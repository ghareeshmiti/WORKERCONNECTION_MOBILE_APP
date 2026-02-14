package com.fidomitiapp

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "FIDOMitiApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // NOTE: NfcReaderHelper (enableReaderMode) is DISABLED to avoid blocking
  // Android's Credential Manager / FIDO2 API from accessing NFC.
  // FIDO2 smart card authentication is handled by react-native-passkey
  // which uses Android's native FIDO2/Credential Manager stack.
}

 