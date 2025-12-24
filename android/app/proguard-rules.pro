# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

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

# Expo
-keep class expo.modules.** { *; }
-keep class org.unimodules.** { *; }
-dontwarn expo.modules.**
-dontwarn org.unimodules.**

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

# Add any project specific keep options here:
