var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// tamagui.config.ts
var tamagui_config_exports = {};
__export(tamagui_config_exports, {
  default: () => tamagui_config_default
});
module.exports = __toCommonJS(tamagui_config_exports);

// node_modules/@tamagui/font-inter/dist/esm/index.mjs
var import_core = require("@tamagui/core");
var createInterFont = /* @__PURE__ */ __name((font = {}, {
  sizeLineHeight = /* @__PURE__ */ __name((size) => size + 10, "sizeLineHeight"),
  sizeSize = /* @__PURE__ */ __name((size) => size * 1, "sizeSize")
} = {}) => {
  const size = Object.fromEntries(Object.entries({
    ...defaultSizes,
    ...font.size
  }).map(([k, v]) => [k, sizeSize(+v)]));
  return (0, import_core.createFont)({
    family: import_core.isWeb ? 'Inter, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' : "Inter",
    lineHeight: Object.fromEntries(Object.entries(size).map(([k, v]) => [k, sizeLineHeight((0, import_core.getVariableValue)(v))])),
    weight: {
      4: "300"
    },
    letterSpacing: {
      4: 0
    },
    ...font,
    size
  });
}, "createInterFont");
var defaultSizes = {
  1: 11,
  2: 12,
  3: 13,
  4: 14,
  true: 14,
  5: 16,
  6: 18,
  7: 20,
  8: 23,
  9: 30,
  10: 46,
  11: 55,
  12: 62,
  13: 72,
  14: 92,
  15: 114,
  16: 134
};

// node_modules/@tamagui/react-native-media-driver/dist/esm/createMedia.mjs
var import_web = require("@tamagui/core");

// node_modules/@tamagui/react-native-media-driver/dist/esm/matchMedia.mjs
var matchMedia = globalThis.matchMedia;

// node_modules/@tamagui/react-native-media-driver/dist/esm/createMedia.mjs
function createMedia(media) {
  return (0, import_web.setupMatchMedia)(matchMedia), media;
}
__name(createMedia, "createMedia");

// node_modules/@tamagui/shorthands/dist/esm/index.mjs
var shorthands = {
  // web-only
  ussel: "userSelect",
  cur: "cursor",
  // tamagui
  pe: "pointerEvents",
  // text
  col: "color",
  ff: "fontFamily",
  fos: "fontSize",
  fost: "fontStyle",
  fow: "fontWeight",
  ls: "letterSpacing",
  lh: "lineHeight",
  ta: "textAlign",
  tt: "textTransform",
  ww: "wordWrap",
  // view
  ac: "alignContent",
  ai: "alignItems",
  als: "alignSelf",
  b: "bottom",
  bc: "backgroundColor",
  bg: "backgroundColor",
  bbc: "borderBottomColor",
  bblr: "borderBottomLeftRadius",
  bbrr: "borderBottomRightRadius",
  bbw: "borderBottomWidth",
  blc: "borderLeftColor",
  blw: "borderLeftWidth",
  boc: "borderColor",
  br: "borderRadius",
  bs: "borderStyle",
  brw: "borderRightWidth",
  brc: "borderRightColor",
  btc: "borderTopColor",
  btlr: "borderTopLeftRadius",
  btrr: "borderTopRightRadius",
  btw: "borderTopWidth",
  bw: "borderWidth",
  dsp: "display",
  f: "flex",
  fb: "flexBasis",
  fd: "flexDirection",
  fg: "flexGrow",
  fs: "flexShrink",
  fw: "flexWrap",
  h: "height",
  jc: "justifyContent",
  l: "left",
  m: "margin",
  mah: "maxHeight",
  maw: "maxWidth",
  mb: "marginBottom",
  mih: "minHeight",
  miw: "minWidth",
  ml: "marginLeft",
  mr: "marginRight",
  mt: "marginTop",
  mx: "marginHorizontal",
  my: "marginVertical",
  o: "opacity",
  ov: "overflow",
  p: "padding",
  pb: "paddingBottom",
  pl: "paddingLeft",
  pos: "position",
  pr: "paddingRight",
  pt: "paddingTop",
  px: "paddingHorizontal",
  py: "paddingVertical",
  r: "right",
  shac: "shadowColor",
  shar: "shadowRadius",
  shof: "shadowOffset",
  shop: "shadowOpacity",
  t: "top",
  w: "width",
  zi: "zIndex"
};
shorthands.bls = "borderLeftStyle";
shorthands.brs = "borderRightStyle";
shorthands.bts = "borderTopStyle";
shorthands.bbs = "borderBottomStyle";
shorthands.bxs = "boxSizing";
shorthands.bxsh = "boxShadow";
shorthands.ox = "overflowX";
shorthands.oy = "overflowY";

// node_modules/tamagui/dist/esm/createTamagui.mjs
var import_core2 = require("@tamagui/core");
var createTamagui = process.env.NODE_ENV !== "development" ? import_core2.createTamagui : (conf) => {
  const sizeTokenKeys = ["$true"], hasKeys = /* @__PURE__ */ __name((expectedKeys, obj) => expectedKeys.every((k) => typeof obj[k] < "u"), "hasKeys"), tamaguiConfig = (0, import_core2.createTamagui)(conf);
  for (const name of ["size", "space"]) {
    const tokenSet = tamaguiConfig.tokensParsed[name];
    if (!tokenSet) throw new Error(`Expected tokens for "${name}" in ${Object.keys(tamaguiConfig.tokensParsed).join(", ")}`);
    if (!hasKeys(sizeTokenKeys, tokenSet)) throw new Error(`
createTamagui() missing expected tokens.${name}:

Received: ${Object.keys(tokenSet).join(", ")}

Expected: ${sizeTokenKeys.join(", ")}

Tamagui expects a "true" key that is the same value as your default size. This is so 
it can size things up or down from the defaults without assuming which keys you use.

Please define a "true" or "$true" key on your size and space tokens like so (example):

size: {
  sm: 2,
  md: 10,
  true: 10, // this means "md" is your default size
  lg: 20,
}

`);
  }
  const expected = Object.keys(tamaguiConfig.tokensParsed.size);
  for (const name of ["radius", "zIndex"]) {
    const tokenSet = tamaguiConfig.tokensParsed[name], received = Object.keys(tokenSet);
    if (!received.some((rk) => expected.includes(rk))) throw new Error(`
createTamagui() invalid tokens.${name}:

Received: ${received.join(", ")}

Expected a subset of: ${expected.join(", ")}

`);
  }
  return tamaguiConfig;
};

// constants/tamagui-theme.ts
var import_core3 = require("@tamagui/core");
var tokens = (0, import_core3.createTokens)({
  color: {
    primary: "#E53935",
    primaryLight: "#FF6F60",
    primaryDark: "#B71C1C",
    secondary: "#10B981",
    secondaryLight: "#34D399",
    secondaryDark: "#059669",
    background: "#111111",
    backgroundDark: "#111111",
    surface: "#181818",
    surfaceDark: "#222222",
    text: "#F9FAFB",
    textSecondary: "#B0B0B0",
    textDark: "#F9FAFB",
    textSecondaryDark: "#D1D5DB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    border: "#222222",
    borderDark: "#333333",
    shadow: "rgba(0, 0, 0, 0.1)",
    shadowDark: "rgba(0, 0, 0, 0.3)",
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayDark: "rgba(0, 0, 0, 0.7)",
    transparent: "transparent"
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    true: 16
    // 기본 space 값 추가
  },
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    true: "100%"
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    true: 8
    // 기본 radius 값 추가
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500
  }
});
var themes = {
  dark: {
    background: tokens.color.background,
    backgroundHover: tokens.color.surface,
    backgroundPress: tokens.color.surfaceDark,
    backgroundFocus: tokens.color.surface,
    borderColor: tokens.color.border,
    borderColorHover: tokens.color.borderDark,
    color: tokens.color.text,
    colorHover: tokens.color.text,
    colorPress: tokens.color.textSecondary,
    colorFocus: tokens.color.text,
    placeholderColor: tokens.color.textSecondary
  },
  light: {
    background: tokens.color.background,
    backgroundHover: tokens.color.surface,
    backgroundPress: tokens.color.surfaceDark,
    backgroundFocus: tokens.color.surface,
    borderColor: tokens.color.border,
    borderColorHover: tokens.color.borderDark,
    color: tokens.color.text,
    colorHover: tokens.color.text,
    colorPress: tokens.color.textSecondary,
    colorFocus: tokens.color.text,
    placeholderColor: tokens.color.textSecondary
  }
};

// tamagui.config.ts
var headingFont = createInterFont({
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
    true: 35
  },
  transform: {
    6: "uppercase",
    7: "none"
  },
  weight: {
    6: "400",
    7: "600",
    8: "700",
    9: "700",
    10: "700"
  },
  color: {
    6: "$colorFocus",
    7: "$color",
    8: "$color",
    9: "$color",
    10: "$color"
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
    15: -5
  },
  face: {
    700: { normal: "InterBold" },
    800: { normal: "InterBold" },
    900: { normal: "InterBold" }
  }
});
var bodyFont = createInterFont(
  {
    face: {
      700: { normal: "InterBold" }
    }
  },
  {
    sizeSize: /* @__PURE__ */ __name((size) => Math.round(size * 1.1), "sizeSize"),
    sizeLineHeight: /* @__PURE__ */ __name((size) => Math.round(size * 1.1 + (size > 20 ? 10 : 10)), "sizeLineHeight")
  }
);
var config = createTamagui({
  defaultFont: "body",
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont
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
    pointerCoarse: { pointer: "coarse" }
  })
});
var tamagui_config_default = config;
