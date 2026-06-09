import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/Colors";
import { SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";

interface SectionLabelProps {
  children: React.ReactNode;
  trailing?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function SectionLabel({ children, trailing, style, textStyle }: SectionLabelProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.text, textStyle]}>{children}</Text>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  text: {
    ...TEXT.eyebrow,
    color: COLORS.textSecondary,
  },
});
