package com.fidomitiapp

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "FIDOMitiApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onResume() {
    super.onResume()
    try {
      val host = (application as? MainApplication)?.reactHost
      val reactContext = host?.currentReactContext
      if (reactContext != null) {
        NfcReaderHelper.setContext(reactContext)
      }
      NfcReaderHelper.enable(this)
    } catch (e: Exception) {
      android.util.Log.w("MainActivity", "NFC init skipped: ${e.message}")
    }
  }

  override fun onPause() {
    try {
      NfcReaderHelper.disable(this)
    } catch (e: Exception) {
      android.util.Log.w("MainActivity", "NFC disable error: ${e.message}")
    }
    super.onPause()
  }
}

 