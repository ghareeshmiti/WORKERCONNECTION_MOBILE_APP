package com.smartcard
 
import android.app.Activity

import android.nfc.NfcAdapter

import android.nfc.Tag

import android.nfc.tech.IsoDep

import android.util.Log
 
object NfcReaderHelper {

  private const val TAG_LOG = "SmartCardNFC"
 
  private var adapter: NfcAdapter? = null

  private var callback: NfcAdapter.ReaderCallback? = null
 
  fun enable(activity: Activity) {

    adapter = NfcAdapter.getDefaultAdapter(activity)

    if (adapter == null) {

      Log.e(TAG_LOG, "NFC adapter not available on this device")

      return

    }
 
    callback = NfcAdapter.ReaderCallback { tag: Tag ->

      try {

        val techs = tag.techList?.joinToString(", ") ?: "(none)"

        Log.i(TAG_LOG, "Tag detected. TechList = $techs")
 
        val isoDep = IsoDep.get(tag)

        if (isoDep != null) {

        try {

            isoDep.connect()

            Log.i(TAG_LOG, "IsoDep CONNECTED")
 
            // Example: SELECT MF (00 A4 00 00 02 3F 00)

            val selectCommand = byteArrayOf(

            0x00.toByte(),

            0xA4.toByte(),

            0x00.toByte(),

            0x00.toByte(),

            0x02.toByte(),

            0x3F.toByte(),

            0x00.toByte()

            )
 
            val response = isoDep.transceive(selectCommand)

            val responseHex = response.joinToString(" ") { String.format("%02X", it) }
 
            Log.i(TAG_LOG, "APDU Response: $responseHex")
 
            isoDep.close()

        } catch (e: Exception) {

            Log.e(TAG_LOG, "IsoDep error: ${e.message}", e)

        }

        } else {

          Log.w(TAG_LOG, "IsoDep is NOT present. This may not be an ISO-DEP card.")

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
 