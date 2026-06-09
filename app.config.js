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
const DEV_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QULrsyosPUrR7hg0dUovgQ_SKzdVX4A";

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
    extra: {
      ...baseConfig.expo.extra,
      supabaseUrl,
      supabasePublishableKey,
    },
  };
};
