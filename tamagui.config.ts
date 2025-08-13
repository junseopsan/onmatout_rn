import { createInterFont } from "@tamagui/font-inter";
import { createMedia } from "@tamagui/react-native-media-driver";
import { shorthands } from "@tamagui/shorthands";
import { createTamagui } from "tamagui";
import { themes, tokens } from "./constants/tamagui-theme";

const headingFont = createInterFont({
  size: {
    6: 15,
    7: 18,
    8: 20,
    9: 23,
    10: 27,
    11: 30,
    12: 35,
    13: 40,
    14: 42,
    15: 47,
    16: 55,
    true: 35,
  },
  transform: {
    6: "uppercase",
    7: "none",
  },
  weight: {
    6: "400",
    7: "600",
    8: "700",
    9: "700",
    10: "700",
  },
  color: {
    6: "$colorFocus",
    7: "$color",
    8: "$color",
    9: "$color",
    10: "$color",
  },
  letterSpacing: {
    5: 2,
    6: 1,
    7: 0,
    8: 0,
    9: -1,
    10: -1.5,
    12: -3,
    14: -4,
    15: -5,
  },
  face: {
    700: { normal: "InterBold" },
    800: { normal: "InterBold" },
    900: { normal: "InterBold" },
  },
});

const bodyFont = createInterFont(
  {
    face: {
      700: { normal: "InterBold" },
    },
  },
  {
    sizeSize: (size) => Math.round(size * 1.1),
    sizeLineHeight: (size) => Math.round(size * 1.1 + (size > 20 ? 10 : 10)),
  }
);

const config = createTamagui({
  defaultFont: "body",
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes,
  tokens,
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: "none" },
    pointerCoarse: { pointer: "coarse" },
  }),
  // 경고 레벨 조정
  disableInjectCSS: true,
});

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
