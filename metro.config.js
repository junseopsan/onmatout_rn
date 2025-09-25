const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// 경로 별칭 설정
config.resolver.alias = {
  "@": path.resolve(__dirname, "."),
};

// 빌드 최적화 설정
config.resolver.platforms = ["ios", "android", "native", "web"];
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
