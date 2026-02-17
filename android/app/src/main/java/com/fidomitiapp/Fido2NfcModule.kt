package com.fidomitiapp

import android.content.pm.PackageManager
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.util.Log
import java.io.ByteArrayOutputStream
import java.math.BigInteger
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.MessageDigest
import java.security.interfaces.ECPublicKey
import java.security.spec.ECGenParameterSpec
import java.security.spec.ECParameterSpec
import java.security.spec.ECPoint
import java.security.spec.ECPublicKeySpec
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.Mac
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

import org.json.JSONObject

/**
 * Direct CTAP2-over-NFC with full clientPIN protocol for FIDO2 security key authentication.
 * Implements ECDH key exchange + pinUvAuthToken for biometric/PIN verification.
 */
class Fido2NfcModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "Fido2NfcModule"
        private val FIDO2_AID = byteArrayOf(
            0xA0.toByte(), 0x00, 0x00, 0x06, 0x47, 0x2F, 0x00, 0x01
        )
    }

    private var pendingPromise: Promise? = null
    private var storedRpId: String? = null
    private var storedClientDataHash: ByteArray? = null
    private var storedClientDataJSON: String? = null
    private var storedAllowList: List<ByteArray>? = null
    private var nfcAdapter: NfcAdapter? = null
    private var pendingPin: String? = null
    private var tagRetryCount = 0
    private val MAX_TAG_RETRIES = 3

    override fun getName(): String = "Fido2Nfc"

    @ReactMethod
    fun addListener(eventName: String) { /* Required for RN event emitter */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* Required for RN event emitter */ }

    private fun sendProgress(step: String) {
        try {
            val params = Arguments.createMap()
            params.putString("step", step)
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onFido2Progress", params)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to send progress event: ${e.message}")
        }
    }

    @ReactMethod
    fun authenticate(requestJson: String, promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NoActivity", "No current activity"); return
        }
        if (pendingPromise != null) {
            promise.reject("Busy", "Authentication in progress"); return
        }

        try {
            val json = JSONObject(requestJson)
            val rpId = json.getString("rpId")
            val challengeStr = json.getString("challenge")

            Log.d(TAG, "Starting CTAP2 NFC auth: rpId=$rpId")

            // Build clientDataJSON with Android app origin
            val origin = getAndroidOrigin()
            val cdj = """{"type":"webauthn.get","challenge":"$challengeStr","origin":"$origin","crossOrigin":false}"""
            storedClientDataJSON = cdj
            storedClientDataHash = sha256(cdj.toByteArray(Charsets.UTF_8))
            storedRpId = rpId

            Log.d(TAG, "Origin: $origin")

            // Parse allowCredentials
            val creds = mutableListOf<ByteArray>()
            if (json.has("allowCredentials")) {
                val arr = json.getJSONArray("allowCredentials")
                for (i in 0 until arr.length()) {
                    creds.add(base64UrlDecode(arr.getJSONObject(i).getString("id")))
                }
                Log.d(TAG, "allowCredentials: ${creds.size} entries")
            }
            storedAllowList = creds
            pendingPromise = promise

            // Enable NFC reader mode (must be on UI thread)
            nfcAdapter = NfcAdapter.getDefaultAdapter(reactApplicationContext)
            if (nfcAdapter == null) { cleanup(); promise.reject("NoNfc", "NFC not available"); return }
            if (!nfcAdapter!!.isEnabled) { cleanup(); promise.reject("NfcDisabled", "NFC is disabled"); return }

            val extras = Bundle()
            extras.putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, 30000)

            activity.runOnUiThread {
                nfcAdapter!!.enableReaderMode(
                    activity,
                    { tag -> onTagDiscovered(tag) },
                    NfcAdapter.FLAG_READER_NFC_A or NfcAdapter.FLAG_READER_NFC_B or
                        NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK or NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS,
                    extras
                )
                Log.d(TAG, "NFC reader mode enabled on UI thread - tap your FIDO2 card")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Setup error", e)
            cleanup()
            promise.reject("SetupError", e.message ?: "Setup failed")
        }
    }

    @ReactMethod
    fun cancel(promise: Promise) {
        val pending = pendingPromise
        cleanup()
        pending?.reject("UserCancelled", "Cancelled")
        promise.resolve(true)
    }

    @ReactMethod
    fun authenticateWithPin(requestJson: String, pin: String, promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) { promise.reject("NoActivity", "No current activity"); return }
        if (pendingPromise != null) { promise.reject("Busy", "Authentication in progress"); return }

        try {
            val json = JSONObject(requestJson)
            val rpId = json.getString("rpId")
            val challengeStr = json.getString("challenge")
            Log.d(TAG, "Starting CTAP2 NFC auth with PIN: rpId=$rpId")

            val origin = getAndroidOrigin()
            val cdj = """{"type":"webauthn.get","challenge":"$challengeStr","origin":"$origin","crossOrigin":false}"""
            storedClientDataJSON = cdj
            storedClientDataHash = sha256(cdj.toByteArray(Charsets.UTF_8))
            storedRpId = rpId
            pendingPin = pin

            val creds = mutableListOf<ByteArray>()
            if (json.has("allowCredentials")) {
                val arr = json.getJSONArray("allowCredentials")
                for (i in 0 until arr.length()) {
                    creds.add(base64UrlDecode(arr.getJSONObject(i).getString("id")))
                }
            }
            storedAllowList = creds
            pendingPromise = promise

            nfcAdapter = NfcAdapter.getDefaultAdapter(reactApplicationContext)
            if (nfcAdapter == null) { cleanup(); promise.reject("NoNfc", "NFC not available"); return }
            if (!nfcAdapter!!.isEnabled) { cleanup(); promise.reject("NfcDisabled", "NFC is disabled"); return }

            val extras = Bundle()
            extras.putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, 30000)
            activity.runOnUiThread {
                nfcAdapter!!.enableReaderMode(
                    activity,
                    { tag -> onTagDiscovered(tag) },
                    NfcAdapter.FLAG_READER_NFC_A or NfcAdapter.FLAG_READER_NFC_B or
                        NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK or NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS,
                    extras
                )
                Log.d(TAG, "NFC reader mode enabled for PIN auth - tap your FIDO2 card")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Setup error", e)
            cleanup()
            promise.reject("SetupError", e.message ?: "Setup failed")
        }
    }

    // ==================== NFC Tag Handler ====================

    private fun onTagDiscovered(tag: Tag) {
        val promise = pendingPromise ?: return
        val cdj = storedClientDataJSON ?: return
        val cdHash = storedClientDataHash ?: return
        val rpId = storedRpId ?: return
        val allowList = storedAllowList ?: emptyList()

        Log.d(TAG, "NFC tag discovered: ${tag.techList.joinToString()}")
        sendProgress("Card detected. Connecting...")

        try {
            val isoDep = IsoDep.get(tag)
            if (isoDep == null) {
                rejectAndCleanup(promise, "NotFido2", "Card does not support FIDO2"); return
            }

            isoDep.connect()
            isoDep.timeout = 30000 // 30s for biometric
            Thread.sleep(100) // Let NFC connection stabilize after connect
            Log.d(TAG, "IsoDep connected, maxTransceive=${isoDep.maxTransceiveLength}")

            // Step 1: SELECT FIDO2 applet
            val selectApdu = buildSelectApdu(FIDO2_AID)
            val selectResp: ByteArray
            try {
                selectResp = isoDep.transceive(selectApdu)
            } catch (e: android.nfc.TagLostException) {
                // Tag was stale (card was on phone before reader mode enabled).
                // Don't reject - keep reader mode active so Android re-discovers the card.
                try { isoDep.close() } catch (_: Exception) {}
                tagRetryCount++
                if (tagRetryCount <= MAX_TAG_RETRIES) {
                    Log.w(TAG, "SELECT failed (stale tag), waiting for re-discovery (attempt $tagRetryCount/$MAX_TAG_RETRIES)")
                    sendProgress("Card connection lost.\nRemove card briefly, then tap again.")
                    return // Reader mode stays active for next onTagDiscovered
                } else {
                    Log.e(TAG, "SELECT failed after $MAX_TAG_RETRIES retries")
                    tagRetryCount = 0
                    rejectAndCleanup(promise, "TagLost", "TagLost: Keep card steady. Remove and re-tap card.")
                    return
                }
            }
            tagRetryCount = 0 // Reset on success
            if (!isSwSuccess(selectResp)) {
                rejectAndCleanup(promise, "NotFido2", "FIDO2 applet not found on card")
                isoDep.close(); return
            }
            Log.d(TAG, "FIDO2 applet selected OK")
            sendProgress("Setting up secure channel...")

            // Step 2: Get authenticator's ECDH public key (getKeyAgreement)
            val keyAgreeCmd = buildClientPinCmd(subCommand = 0x02, protocol = 1)
            val keyAgreeResp = sendCtap2(isoDep, keyAgreeCmd)
            val keyAgreeMap = CborDecoder(keyAgreeResp).decodeMap()
            val authCoseKey = keyAgreeMap[1] as? Map<*, *>
                ?: throw Exception("No key in getKeyAgreement response")

            val authX = authCoseKey[-2] as? ByteArray ?: throw Exception("Missing x in auth key")
            val authY = authCoseKey[-3] as? ByteArray ?: throw Exception("Missing y in auth key")
            Log.d(TAG, "Got authenticator ECDH key (x=${authX.size}B, y=${authY.size}B)")

            // Step 3: Generate platform ECDH key pair
            val kpg = KeyPairGenerator.getInstance("EC")
            kpg.initialize(ECGenParameterSpec("secp256r1"))
            val platformKeyPair = kpg.generateKeyPair()
            val platformPubKey = platformKeyPair.public as ECPublicKey

            // Step 4: Compute shared secret = SHA-256(ECDH(platformPriv, authPub))
            val authPubKey = reconstructEcPublicKey(authX, authY, platformPubKey.params)
            val ka = KeyAgreement.getInstance("ECDH")
            ka.init(platformKeyPair.private)
            ka.doPhase(authPubKey, true)
            val sharedSecret = sha256(ka.generateSecret())
            Log.d(TAG, "Shared secret computed")

            // Step 5: Get pinUvAuthToken (biometric or PIN)
            val platformX = bigIntTo32Bytes(platformPubKey.w.affineX)
            val platformY = bigIntTo32Bytes(platformPubKey.w.affineY)
            val encryptedToken: ByteArray
            val pin = pendingPin

            if (pin != null) {
                // PIN flow: getPinUvAuthTokenUsingPinWithPermissions (subCommand 0x09)
                sendProgress("Verifying PIN...\nKeep card steady.")
                Log.d(TAG, "Using PIN verification")
                val pinHash = sha256(pin.toByteArray(Charsets.UTF_8)).copyOfRange(0, 16)
                val pinHashEnc = aesEncrypt(sharedSecret, pinHash)
                val pinCmd = buildGetPinTokenCmd(protocol = 1, platformX = platformX, platformY = platformY,
                    pinHashEnc = pinHashEnc)
                val pinResp = sendCtap2(isoDep, pinCmd)
                val pinMap = CborDecoder(pinResp).decodeMap()
                encryptedToken = pinMap[2] as? ByteArray
                    ?: throw Exception("No pinUvAuthToken in PIN response")
                Log.d(TAG, "Got encrypted pinUvAuthToken via PIN (${encryptedToken.size}B)")
            } else {
                // Biometric flow: getPinUvAuthTokenUsingUvWithPermissions (subCommand 0x06)
                try {
                    sendProgress("Verifying fingerprint...\nPlace finger on card sensor.\nKeep card steady.")
                    val uvCmd = buildGetUvTokenCmd(protocol = 1, platformX = platformX, platformY = platformY,
                        permissions = 0x02, rpId = rpId)
                    Log.d(TAG, "Requesting biometric verification - place finger on card sensor now")
                    val uvResp = sendCtap2(isoDep, uvCmd)
                    val uvMap = CborDecoder(uvResp).decodeMap()
                    encryptedToken = uvMap[2] as? ByteArray
                        ?: throw Exception("No pinUvAuthToken in UV response")
                    Log.d(TAG, "Got encrypted pinUvAuthToken via biometric (${encryptedToken.size}B)")
                } catch (e: android.nfc.TagLostException) {
                    // Physical NFC connection lost - re-throw for outer TagLost handler
                    throw e
                } catch (e: Exception) {
                    try { isoDep.close() } catch (_: Exception) {}
                    Log.e(TAG, "Biometric verification failed: ${e.message}")
                    // Any non-TagLost error during biometric → treat as biometric failed
                    rejectAndCleanup(promise, "BiometricFailed",
                        "Fingerprint not matched. ${e.message ?: "Please try with PIN."}")
                    return
                }
            }

            // Step 6: Decrypt pinUvAuthToken
            val pinUvAuthToken = aesDecrypt(sharedSecret, encryptedToken)
            Log.d(TAG, "Decrypted pinUvAuthToken (${pinUvAuthToken.size}B)")

            // Step 7: Compute pinUvAuthParam = HMAC-SHA-256(token, clientDataHash)[0:16]
            val pinUvAuthParam = hmacSha256First16(pinUvAuthToken, cdHash)

            // Step 8: Send authenticatorGetAssertion with pinUvAuth
            sendProgress("Authenticating...\nKeep card steady.")
            val assertionCmd = buildGetAssertionCommand(rpId, cdHash, allowList, pinUvAuthParam, 1)
            Log.d(TAG, "Sending authenticatorGetAssertion with pinUvAuth")
            val assertionResp = sendCtap2(isoDep, assertionCmd)
            isoDep.close()

            // Step 9: Parse CBOR assertion
            val assertion = CborDecoder(assertionResp).decodeMap()
            Log.d(TAG, "Assertion decoded, keys: ${assertion.keys}")

            val credential = assertion[1] as? Map<*, *>
            val authData = assertion[2] as? ByteArray
            val signature = assertion[3] as? ByteArray
            val user = assertion[4] as? Map<*, *>

            if (authData == null || signature == null) {
                rejectAndCleanup(promise, "BadAssertion", "Missing authData or signature"); return
            }

            val credId = (credential?.get("id") as? ByteArray) ?: ByteArray(0)
            val userHandle = user?.get("id") as? ByteArray

            // Step 10: Build WebAuthn response for server
            val result = JSONObject()
            result.put("id", base64UrlEncode(credId))
            result.put("rawId", base64UrlEncode(credId))
            result.put("type", "public-key")

            val respJson = JSONObject()
            respJson.put("authenticatorData", base64UrlEncode(authData))
            respJson.put("clientDataJSON", base64UrlEncode(cdj.toByteArray(Charsets.UTF_8)))
            respJson.put("signature", base64UrlEncode(signature))
            if (userHandle != null) respJson.put("userHandle", base64UrlEncode(userHandle))
            result.put("response", respJson)

            Log.d(TAG, "CTAP2 NFC auth SUCCESS! credId=${base64UrlEncode(credId).take(20)}...")
            cleanup()
            promise.resolve(result.toString())

        } catch (e: android.nfc.TagLostException) {
            Log.e(TAG, "TagLost: Card removed during communication", e)
            rejectAndCleanup(promise, "TagLost", "TagLost: Keep card steady against phone and finger on sensor.")
        } catch (e: Exception) {
            Log.e(TAG, "NFC CTAP2 error", e)
            rejectAndCleanup(promise, "NfcError", e.message ?: "NFC error")
        }
    }

    // ==================== CTAP2 Transport ====================

    private fun sendCtap2(isoDep: IsoDep, command: ByteArray): ByteArray {
        val apdu = buildNfcCtapMsg(command)
        Log.d(TAG, "CTAP2 cmd=0x${String.format("%02X", command[0])}, ${command.size}B")
        var response = isoDep.transceive(apdu)

        // Handle keepalive/processing (SW 9100) - card is busy e.g. during biometric
        var keepaliveCount = 0
        while (isSwProcessing(response)) {
            keepaliveCount++
            if (keepaliveCount % 5 == 0) {
                Log.d(TAG, "CTAP2 still processing... (keepalive #$keepaliveCount)")
            }
            Thread.sleep(200)
            response = isoDep.transceive(byteArrayOf(0x80.toByte(), 0x11, 0x00, 0x00, 0x00))
        }
        if (keepaliveCount > 0) {
            Log.d(TAG, "CTAP2 processing complete after $keepaliveCount keepalives")
        }

        // Handle chained responses (SW 61XX)
        var fullData = getDataBeforeSw(response)
        while (isSwMoreData(response)) {
            response = isoDep.transceive(byteArrayOf(0x80.toByte(), 0x11, 0x00, 0x00, 0x00))
            fullData = concat(fullData, getDataBeforeSw(response))
        }

        if (!isSwSuccess(response)) {
            throw Exception("APDU error: SW=${getSwHex(response)}")
        }
        if (fullData.isEmpty()) throw Exception("Empty CTAP2 response")

        val status = fullData[0].toInt() and 0xFF
        if (status != 0x00) {
            throw Exception(ctap2ErrorMessage(status))
        }
        return fullData.copyOfRange(1, fullData.size)
    }

    // ==================== CTAP2 Command Building ====================

    /** authenticatorClientPIN - getKeyAgreement (subCommand 0x02) */
    private fun buildClientPinCmd(subCommand: Int, protocol: Int): ByteArray {
        val out = ByteArrayOutputStream()
        out.write(0x06) // authenticatorClientPIN
        out.write(cborMapHeader(2))
        out.write(cborUint(1)) // pinUvAuthProtocol
        out.write(cborUint(protocol))
        out.write(cborUint(2)) // subCommand
        out.write(cborUint(subCommand))
        return out.toByteArray()
    }

    /** authenticatorClientPIN - getPinUvAuthTokenUsingUvWithPermissions (subCommand 0x06) */
    private fun buildGetUvTokenCmd(protocol: Int, platformX: ByteArray, platformY: ByteArray,
                                    permissions: Int, rpId: String): ByteArray {
        val out = ByteArrayOutputStream()
        out.write(0x06) // authenticatorClientPIN

        out.write(cborMapHeader(5))

        // Key 0x01: pinUvAuthProtocol
        out.write(cborUint(1))
        out.write(cborUint(protocol))

        // Key 0x02: subCommand = 0x06 (getPinUvAuthTokenUsingUvWithPermissions)
        out.write(cborUint(2))
        out.write(cborUint(6))

        // Key 0x03: keyAgreement (platform COSE_Key)
        out.write(cborUint(3))
        out.write(encodeCoseKey(platformX, platformY))

        // Key 0x09: permissions
        out.write(cborUint(9))
        out.write(cborUint(permissions))

        // Key 0x0A: rpId
        out.write(cborUint(10))
        out.write(cborText(rpId))

        return out.toByteArray()
    }

    /** authenticatorClientPIN - getPinToken (subCommand 0x05) */
    private fun buildGetPinTokenCmd(protocol: Int, platformX: ByteArray, platformY: ByteArray,
                                     pinHashEnc: ByteArray): ByteArray {
        val out = ByteArrayOutputStream()
        out.write(0x06) // authenticatorClientPIN
        out.write(cborMapHeader(4))
        out.write(cborUint(1)); out.write(cborUint(protocol))
        out.write(cborUint(2)); out.write(cborUint(5))  // subCommand 0x05 (getPinToken)
        out.write(cborUint(3)); out.write(encodeCoseKey(platformX, platformY))
        out.write(cborUint(6)); out.write(cborBytes(pinHashEnc))
        return out.toByteArray()
    }

    /** authenticatorGetAssertion with optional pinUvAuth */
    private fun buildGetAssertionCommand(
        rpId: String, clientDataHash: ByteArray, allowList: List<ByteArray>,
        pinUvAuthParam: ByteArray? = null, pinUvAuthProtocol: Int? = null
    ): ByteArray {
        val out = ByteArrayOutputStream()
        out.write(0x02) // authenticatorGetAssertion

        var mapSize = 2 // rpId + clientDataHash
        if (allowList.isNotEmpty()) mapSize++
        if (pinUvAuthParam != null) mapSize += 2 // pinUvAuthParam + protocol
        mapSize++ // options

        out.write(cborMapHeader(mapSize))

        // Key 1: rpId
        out.write(cborUint(1))
        out.write(cborText(rpId))

        // Key 2: clientDataHash
        out.write(cborUint(2))
        out.write(cborBytes(clientDataHash))

        // Key 3: allowList
        if (allowList.isNotEmpty()) {
            out.write(cborUint(3))
            out.write(cborArrayHeader(allowList.size))
            for (credId in allowList) {
                out.write(cborMapHeader(2))
                out.write(cborText("id"))
                out.write(cborBytes(credId))
                out.write(cborText("type"))
                out.write(cborText("public-key"))
            }
        }

        // Key 5: options {"up": true}
        out.write(cborUint(5))
        out.write(cborMapHeader(1))
        out.write(cborText("up"))
        out.write(byteArrayOf(0xF5.toByte())) // true

        // Key 6: pinUvAuthParam
        if (pinUvAuthParam != null) {
            out.write(cborUint(6))
            out.write(cborBytes(pinUvAuthParam))
        }

        // Key 7: pinUvAuthProtocol
        if (pinUvAuthProtocol != null) {
            out.write(cborUint(7))
            out.write(cborUint(pinUvAuthProtocol))
        }

        return out.toByteArray()
    }

    // ==================== COSE Key Encoding ====================

    /** Encode EC P-256 public key as COSE_Key CBOR */
    private fun encodeCoseKey(x: ByteArray, y: ByteArray): ByteArray {
        val out = ByteArrayOutputStream()
        out.write(cborMapHeader(5))

        // 1 (kty): 2 (EC2)
        out.write(cborUint(1))
        out.write(cborUint(2))

        // 3 (alg): -25 (ECDH-ES+HKDF-256)
        out.write(cborUint(3))
        out.write(cborNegInt(-25))

        // -1 (crv): 1 (P-256)
        out.write(cborNegInt(-1))
        out.write(cborUint(1))

        // -2 (x): byte string
        out.write(cborNegInt(-2))
        out.write(cborBytes(x))

        // -3 (y): byte string
        out.write(cborNegInt(-3))
        out.write(cborBytes(y))

        return out.toByteArray()
    }

    // ==================== Crypto ====================

    /** Reconstruct ECPublicKey from x,y coordinates */
    private fun reconstructEcPublicKey(x: ByteArray, y: ByteArray, params: ECParameterSpec): ECPublicKey {
        val point = ECPoint(BigInteger(1, x), BigInteger(1, y))
        val spec = ECPublicKeySpec(point, params)
        return KeyFactory.getInstance("EC").generatePublic(spec) as ECPublicKey
    }

    /** Convert BigInteger to exactly 32 bytes (for P-256) */
    private fun bigIntTo32Bytes(bi: BigInteger): ByteArray {
        val bytes = bi.toByteArray()
        return when {
            bytes.size == 32 -> bytes
            bytes.size > 32 -> bytes.copyOfRange(bytes.size - 32, bytes.size)
            else -> ByteArray(32 - bytes.size) + bytes
        }
    }

    /** AES-256-CBC decrypt with IV=0 (pinUvAuthProtocol 1) */
    private fun aesDecrypt(key: ByteArray, data: ByteArray): ByteArray {
        val cipher = Cipher.getInstance("AES/CBC/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, "AES"), IvParameterSpec(ByteArray(16)))
        return cipher.doFinal(data)
    }

    /** AES-256-CBC encrypt with IV=0 (pinUvAuthProtocol 1) */
    private fun aesEncrypt(key: ByteArray, data: ByteArray): ByteArray {
        val cipher = Cipher.getInstance("AES/CBC/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"), IvParameterSpec(ByteArray(16)))
        return cipher.doFinal(data)
    }

    /** HMAC-SHA-256, return first 16 bytes (pinUvAuthProtocol 1) */
    private fun hmacSha256First16(key: ByteArray, data: ByteArray): ByteArray {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(key, "HmacSHA256"))
        return mac.doFinal(data).copyOfRange(0, 16)
    }

    // ==================== Lifecycle ====================

    private fun cleanup() {
        try {
            val activity = reactApplicationContext.currentActivity
            val adapter = nfcAdapter
            if (activity != null && adapter != null) {
                activity.runOnUiThread { adapter.disableReaderMode(activity) }
            }
        } catch (e: Exception) { Log.w(TAG, "Error disabling reader mode", e) }
        pendingPromise = null
        pendingPin = null
        storedRpId = null
        storedClientDataHash = null
        storedClientDataJSON = null
        storedAllowList = null
        tagRetryCount = 0
    }

    private fun rejectAndCleanup(promise: Promise, code: String, message: String) {
        cleanup()
        promise.reject(code, message)
    }

    // ==================== Android Origin ====================

    private fun getAndroidOrigin(): String {
        val context = reactApplicationContext
        val certBytes = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val pi = context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES)
            pi.signingInfo?.apkContentsSigners?.firstOrNull()?.toByteArray()
        } else {
            @Suppress("DEPRECATION")
            val pi = context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_SIGNATURES)
            @Suppress("DEPRECATION")
            pi.signatures?.firstOrNull()?.toByteArray()
        }
        if (certBytes == null) throw Exception("Cannot get APK signing certificate")
        return "android:apk-key-hash:" + base64UrlEncode(sha256(certBytes))
    }

    // ==================== NFC APDU ====================

    private fun buildSelectApdu(aid: ByteArray): ByteArray {
        val apdu = ByteArray(6 + aid.size)
        apdu[0] = 0x00; apdu[1] = 0xA4.toByte(); apdu[2] = 0x04; apdu[3] = 0x00
        apdu[4] = aid.size.toByte()
        System.arraycopy(aid, 0, apdu, 5, aid.size)
        apdu[5 + aid.size] = 0x00
        return apdu
    }

    private fun buildNfcCtapMsg(data: ByteArray): ByteArray {
        if (data.size <= 255) {
            val apdu = ByteArray(5 + data.size + 1)
            apdu[0] = 0x80.toByte(); apdu[1] = 0x10; apdu[2] = 0x00; apdu[3] = 0x00
            apdu[4] = data.size.toByte()
            System.arraycopy(data, 0, apdu, 5, data.size)
            apdu[5 + data.size] = 0x00
            return apdu
        } else {
            val apdu = ByteArray(7 + data.size + 2)
            apdu[0] = 0x80.toByte(); apdu[1] = 0x10; apdu[2] = 0x00; apdu[3] = 0x00
            apdu[4] = 0x00; apdu[5] = (data.size shr 8).toByte(); apdu[6] = (data.size and 0xFF).toByte()
            System.arraycopy(data, 0, apdu, 7, data.size)
            apdu[7 + data.size] = 0x00; apdu[8 + data.size] = 0x00
            return apdu
        }
    }

    private fun isSwSuccess(r: ByteArray) = r.size >= 2 && r[r.size-2].toInt() and 0xFF == 0x90 && r[r.size-1].toInt() and 0xFF == 0x00
    private fun isSwProcessing(r: ByteArray) = r.size >= 2 && r[r.size-2].toInt() and 0xFF == 0x91 && r[r.size-1].toInt() and 0xFF == 0x00
    private fun isSwMoreData(r: ByteArray) = r.size >= 2 && r[r.size-2].toInt() and 0xFF == 0x61
    private fun getDataBeforeSw(r: ByteArray) = if (r.size <= 2) ByteArray(0) else r.copyOfRange(0, r.size - 2)
    private fun getSwHex(r: ByteArray) = if (r.size < 2) "????" else String.format("%02X%02X", r[r.size-2], r[r.size-1])

    // ==================== CBOR Encoding ====================

    private fun cborMapHeader(n: Int) = cborHeader(5, n)
    private fun cborArrayHeader(n: Int) = cborHeader(4, n)
    private fun cborUint(v: Int) = cborHeader(0, v)
    private fun cborNegInt(v: Int): ByteArray = cborHeader(1, -v - 1) // e.g. -1 → cborHeader(1,0)
    private fun cborText(s: String): ByteArray { val b = s.toByteArray(Charsets.UTF_8); return concat(cborHeader(3, b.size), b) }
    private fun cborBytes(b: ByteArray): ByteArray = concat(cborHeader(2, b.size), b)

    private fun cborHeader(mt: Int, v: Int): ByteArray {
        val t = mt shl 5
        return when {
            v < 24 -> byteArrayOf((t or v).toByte())
            v < 256 -> byteArrayOf((t or 24).toByte(), v.toByte())
            v < 65536 -> byteArrayOf((t or 25).toByte(), (v shr 8).toByte(), (v and 0xFF).toByte())
            else -> byteArrayOf((t or 26).toByte(), (v shr 24).toByte(), ((v shr 16) and 0xFF).toByte(), ((v shr 8) and 0xFF).toByte(), (v and 0xFF).toByte())
        }
    }

    // ==================== CBOR Decoding ====================

    private class CborDecoder(private val data: ByteArray) {
        private var pos = 0

        fun decodeMap(): Map<Any, Any> {
            val (mt, cnt) = readHeader()
            if (mt != 5) throw Exception("Expected CBOR map, got type $mt at pos ${pos-1}")
            val m = mutableMapOf<Any, Any>()
            for (i in 0 until cnt) { val k = decodeValue(); val v = decodeValue(); m[k] = v }
            return m
        }

        private fun decodeValue(): Any {
            val (mt, info) = readHeader()
            return when (mt) {
                0 -> info
                1 -> -(1 + info)
                2 -> { val b = data.copyOfRange(pos, pos + info); pos += info; b }
                3 -> { val s = String(data, pos, info, Charsets.UTF_8); pos += info; s }
                4 -> { val a = mutableListOf<Any>(); for (i in 0 until info) a.add(decodeValue()); a }
                5 -> { val m = mutableMapOf<Any, Any>(); for (i in 0 until info) { m[decodeValue()] = decodeValue() }; m }
                7 -> when (info) { 20 -> false; 21 -> true; 22 -> "null"; else -> info }
                else -> throw Exception("Unsupported CBOR type $mt")
            }
        }

        private fun readHeader(): Pair<Int, Int> {
            val f = data[pos++].toInt() and 0xFF
            val mt = f shr 5; val ai = f and 0x1F
            val v = when {
                ai < 24 -> ai
                ai == 24 -> data[pos++].toInt() and 0xFF
                ai == 25 -> { val h = data[pos++].toInt() and 0xFF; val l = data[pos++].toInt() and 0xFF; (h shl 8) or l }
                ai == 26 -> { var r = 0; for (i in 0 until 4) r = (r shl 8) or (data[pos++].toInt() and 0xFF); r }
                else -> throw Exception("Unsupported CBOR length $ai")
            }
            return Pair(mt, v)
        }
    }

    // ==================== CTAP2 Errors ====================

    private fun ctap2ErrorMessage(status: Int): String = when (status) {
        0x01 -> "Invalid command"
        0x02 -> "Invalid parameter"
        0x03 -> "Invalid length"
        0x05 -> "Timeout"
        0x11 -> "CBOR unexpected type"
        0x12 -> "Invalid CBOR"
        0x14 -> "Missing parameter"
        0x22 -> "Invalid credential"
        0x25 -> "No credentials found for this site"
        0x27 -> "Operation denied"
        0x2C -> "No credentials"
        0x2D -> "User action timeout"
        0x2E -> "Not allowed (UV required)"
        0x2F -> "PIN invalid"
        0x30 -> "PIN blocked"
        0x31 -> "PIN auth invalid"
        0x32 -> "PIN auth blocked"
        0x33 -> "PIN not set"
        0x34 -> "PIN/UV auth token required"
        0x35 -> "PIN policy violation"
        0x36 -> "PIN/UV auth token required"
        0x38 -> "Request too large"
        0x39 -> "Action timeout"
        0x3A -> "User presence required"
        0x3B -> "UV blocked"
        0x3E -> "UV invalid"
        0x3F -> "Unauthorized permission"
        else -> "CTAP2 error 0x${String.format("%02X", status)}"
    }

    // ==================== Utilities ====================

    private fun sha256(d: ByteArray): ByteArray = MessageDigest.getInstance("SHA-256").digest(d)
    private fun base64UrlEncode(d: ByteArray): String = Base64.encodeToString(d, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
    private fun base64UrlDecode(s: String): ByteArray = Base64.decode(s, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
    private fun concat(a: ByteArray, b: ByteArray): ByteArray { val r = ByteArray(a.size + b.size); System.arraycopy(a, 0, r, 0, a.size); System.arraycopy(b, 0, r, a.size, b.size); return r }
}