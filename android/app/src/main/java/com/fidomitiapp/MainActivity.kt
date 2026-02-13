package com.smartcard
 
import android.os.Bundle

import com.facebook.react.ReactActivity

import com.facebook.react.ReactActivityDelegate

import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled

import com.facebook.react.defaults.DefaultReactActivityDelegate
 
class MainActivity : ReactActivity() {
 
  override fun getMainComponentName(): String = "SmartCard"
 
  override fun createReactActivityDelegate(): ReactActivityDelegate =

      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
 
  override fun onResume() {

    super.onResume()

    NfcReaderHelper.enable(this)

  }
 
  override fun onPause() {

    NfcReaderHelper.disable(this)

    super.onPause()

  }

}

 