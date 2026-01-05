# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep application entry points
-keep class com.onmatout.app.MainApplication { *; }
-keep class com.onmatout.app.MainActivity { *; }

# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}
-keepclassmembers class * {
  @react.keep *;
}
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native Skia
-keep class com.shopify.reactnative.skia.** { *; }

# Supabase (JavaScript library, no native ProGuard rules needed)
# Note: Supabase is a JavaScript library, so ProGuard rules are not required

# React Query / TanStack Query (JavaScript library, no native ProGuard rules needed)
# Note: React Query is a JavaScript library, so ProGuard rules are not required

# Tamagui (JavaScript library, no native ProGuard rules needed)
# Note: Tamagui is a JavaScript library, so ProGuard rules are not required

# Expo - Keep all Expo modules and their native code
-keep class expo.modules.** { *; }
-keep class org.unimodules.** { *; }
-keepclassmembers class expo.modules.** { *; }
-keepclassmembers class org.unimodules.** { *; }
-dontwarn expo.modules.**
-dontwarn org.unimodules.**

# Expo Splash Screen
-keep class expo.modules.splashscreen.** { *; }

# Expo Notifications
-keep class expo.modules.notifications.** { *; }

# Expo Location
-keep class expo.modules.location.** { *; }

# Expo Image Picker
-keep class expo.modules.imagepicker.** { *; }

# Expo Constants
-keep class expo.modules.constants.** { *; }

# Expo Device
-keep class expo.modules.device.** { *; }

# Expo Font
-keep class expo.modules.font.** { *; }

# Expo Haptics
-keep class expo.modules.haptics.** { *; }

# Expo Image
-keep class expo.modules.image.** { *; }

# Expo Linking
-keep class expo.modules.linking.** { *; }

# Expo Network
-keep class expo.modules.network.** { *; }

# Expo Status Bar
-keep class expo.modules.statusbar.** { *; }

# Expo System UI
-keep class expo.modules.systemui.** { *; }

# Expo Web Browser
-keep class expo.modules.webbrowser.** { *; }

# Expo Blur
-keep class expo.modules.blur.** { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Navigation (JavaScript library, native modules handled by React Native)
# Note: React Navigation is primarily a JavaScript library
# Native modules are automatically handled by React Native's ProGuard rules

# Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native SVG
-keep class com.horcrux.svg.** { *; }

# React Native WebView
-keep class com.reactnativecommunity.webview.** { *; }

# React Native Chart Kit
-keep class com.github.PhilJay.** { *; }
-keep class com.github.mikephil.charting.** { *; }

# Crypto-JS
-keep class com.googlecode.javacpp.** { *; }
-keep class org.bouncycastle.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep all React Native classes that might be accessed via reflection
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep React Native bridge classes
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.views.** { *; }

# Keep React Native modules
-keep class com.facebook.react.modules.** { *; }

# Keep classes that are referenced in AndroidManifest.xml
-keep class * extends android.app.Activity
-keep class * extends android.app.Application
-keep class * extends android.app.Service
-keep class * extends android.content.BroadcastReceiver
-keep class * extends android.content.ContentProvider

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep R class
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Prevent obfuscation of native method names
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# Keep Kotlin metadata
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# Add any project specific keep options here:
