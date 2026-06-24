// Dynamic Expo config — app.json 을 base 로 하고 환경별 supabase URL/Key 만 override.
//
// 결정 우선순위:
//   1. .env.{NODE_ENV} 의 EXPO_PUBLIC_SUPABASE_URL / KEY (있으면 그거 사용)
//   2. APP_CONFIG=development → dev hardcoded
//   3. fallback → app.json 의 main (production) hardcoded
//
// 로컬:
//   - `npm run ios`        → NODE_ENV=development → .env.development 로드 → dev
//   - `NODE_ENV=production npm run ios` → .env 로드 → main
//
// EAS:
//   - production           → APP_CONFIG 없음 → main
//   - production-dev       → APP_CONFIG=development (eas.json 에 정의됨) → dev

const baseConfig = require("./app.json");

const DEV_SUPABASE_URL = "https://sdwmyqshfqcnyzjdpexi.supabase.co";
const DEV_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_QULrsyosPUrR7hg0dUovgQ_SKzdVX4A";

// 앱 버전 — version 과 runtimeVersion 의 단일 진실 소스. (hilly_rn 동일 패턴)
// 여기만 올리면 마케팅 버전과 OTA 런타임 버전이 함께 올라간다.
const APP_VERSION = "2.0.4";

module.exports = () => {
  const isDevConfig = process.env.APP_CONFIG === "development";

  const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const envSupabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const supabaseUrl =
    envSupabaseUrl ||
    (isDevConfig ? DEV_SUPABASE_URL : baseConfig.expo.extra.supabaseUrl);

  const supabasePublishableKey =
    envSupabaseKey ||
    (isDevConfig
      ? DEV_SUPABASE_PUBLISHABLE_KEY
      : baseConfig.expo.extra.supabasePublishableKey);

  return {
    ...baseConfig.expo,
    version: APP_VERSION,
    runtimeVersion: APP_VERSION,
    ios: {
      ...baseConfig.expo.ios,
      // EAS 빌드는 appVersionSource: remote + autoIncrement 가 우선. 아래는 로컬/네이티브 기본값.
      buildNumber:
        process.env.IOS_BUILD_NUMBER ?? baseConfig.expo.ios.buildNumber,
    },
    android: {
      ...baseConfig.expo.android,
      versionCode: Number(
        process.env.ANDROID_VERSION_CODE ?? baseConfig.expo.android.versionCode,
      ),
    },
    updates: {
      ...baseConfig.expo.updates,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
    },
    extra: {
      ...baseConfig.expo.extra,
      supabaseUrl,
      supabasePublishableKey,
    },
  };
};
