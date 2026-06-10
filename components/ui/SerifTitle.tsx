import React from "react";
import { StyleProp, Text, TextStyle } from "react-native";
import { COLORS } from "../../constants/Colors";
import { TEXT } from "../../constants/Typography";

interface SerifTitleProps {
  children: React.ReactNode;
  size?: "title" | "hero";
  italic?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

// Notion 풍 세리프 헤더 — 의미 있는 이름(루틴/수련생/클래스 등)에 사용
export function SerifTitle({
  children,
  size = "title",
  italic = false,
  color = COLORS.text,
  style,
  numberOfLines,
}: SerifTitleProps) {
  const base = size === "hero" ? TEXT.serifHero : TEXT.serifTitle;
  return (
    <Text
      style={[
        base,
        italic && { fontStyle: "italic" },
        { color },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}
