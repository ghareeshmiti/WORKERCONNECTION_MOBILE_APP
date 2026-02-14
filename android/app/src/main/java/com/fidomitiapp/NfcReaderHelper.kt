package com.fidomitiapp
 
import android.app.Activity
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
 
object NfcReaderHelper {

  private const val TAG_LOG = "SmartCardNFC"
  private var adapter: NfcAdapter? = null
  private var callback: NfcAdapter.ReaderCallback? = null
  private var reactContext: ReactContext? = null

  fun setContext(context: ReactContext) {
      reactContext = context
  }
 
  private fun sendEvent(eventName: String, params: WritableMap?) {
      reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          ?.emit(eventName, params)
  }

  fun enable(activity: Activity) {
    adapter = NfcAdapter.getDefaultAdapter(activity)
    if (adapter == null) {
      Log.e(TAG_LOG, "NFC adapter not available on this device")
      return
    }
 
    callback = NfcAdapter.ReaderCallback { tag: Tag ->
      try {
        val techs = tag.techList?.joinToString(", ") ?: "(none)"
        val uidHex = tag.id?.joinToString("") { String.format("%02X", it) } ?: ""
        Log.i(TAG_LOG, "Tag detected. UID = $uidHex, TechList = $techs")

        val isoDep = IsoDep.get(tag)
        if (isoDep != null) {
        try {
            isoDep.connect()
            Log.i(TAG_LOG, "IsoDep CONNECTED")

            // SELECT MF (00 A4 00 00 02 3F 00)
            val selectCommand = byteArrayOf(
            0x00.toByte(), 0xA4.toByte(), 0x00.toByte(), 0x00.toByte(),
            0x02.toByte(), 0x3F.toByte(), 0x00.toByte()
            )

            val response = isoDep.transceive(selectCommand)
            val apduHex = response.joinToString("") { String.format("%02X", it) }

            Log.i(TAG_LOG, "APDU Response: $apduHex")

            val params = Arguments.createMap()
            params.putString("uidHex", uidHex)
            params.putString("apduHex", apduHex)
            params.putString("tagId", uidHex)
            params.putString("techList", techs)
            sendEvent("onNfcTagDetected", params)

            isoDep.close()

        } catch (e: Exception) {
            Log.e(TAG_LOG, "IsoDep error: ${e.message}", e)
            // Still send the UID even if APDU fails
            val params = Arguments.createMap()
            params.putString("uidHex", uidHex)
            params.putString("tagId", uidHex)
            params.putString("techList", techs)
            params.putString("apduHex", "")
            sendEvent("onNfcTagDetected", params)
        }
        } else {
          Log.w(TAG_LOG, "IsoDep is NOT present. Sending UID only.")
          val params = Arguments.createMap()
          params.putString("uidHex", uidHex)
          params.putString("tagId", uidHex)
          params.putString("techList", techs)
          sendEvent("onNfcTagDetected", params)
        }
      } catch (e: Exception) {
        Log.e(TAG_LOG, "Error handling tag: ${e.message}", e)
      }
    }
 
   val flags = NfcAdapter.FLAG_READER_NFC_A or
            NfcAdapter.FLAG_READER_NFC_B or
            NfcAdapter.FLAG_READER_NFC_F or
            NfcAdapter.FLAG_READER_NFC_V or
            NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK
 
    adapter?.enableReaderMode(activity, callback, flags, null)
    Log.i(TAG_LOG, "Reader mode ENABLED")
  }
 
  fun disable(activity: Activity) {
    try {
      adapter?.disableReaderMode(activity)
      Log.i(TAG_LOG, "Reader mode DISABLED")
    } catch (e: Exception) {
      Log.e(TAG_LOG, "Failed to disable reader mode: ${e.message}", e)
    }
  }
}
 