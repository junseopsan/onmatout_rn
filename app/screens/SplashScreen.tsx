import React from "react";
import { Image, View } from "react-native";

export default function SplashScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000",
      }}
    >
      <Image
        source={require("../../images/asanas/asana_bg.png")}
        style={{
          width: "100%",
          height: "100%",
          resizeMode: "cover",
        }}
      />
    </View>
  );
}
