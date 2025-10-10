import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Supabase 환경 변수에서 설정 가져오기 (여러 소스에서 시도)
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey;

// 환경 변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
  console.error("다음 환경 변수를 설정해주세요:");
  console.error("- EXPO_PUBLIC_SUPABASE_URL");
  console.error("- EXPO_PUBLIC_SUPABASE_ANON_KEY");
  console.error("");
  console.error("방법 1: .env 파일 생성");
  console.error("방법 2: app.json의 extra 섹션에 추가");
  console.error("방법 3: expo start 시 환경 변수 전달");

  throw new Error(
    "Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 생성하거나 환경 변수를 설정해주세요."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper functions
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const getCurrentSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};
