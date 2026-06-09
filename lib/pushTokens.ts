import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// 푸시 토큰 등록 — 인증된 사용자가 처음 화면 진입할 때 호출.
// Expo Go 환경에서는 토큰 발급 안 됨 (SDK 53+).
export async function registerPushTokenForUser(userId: string): Promise<void> {
  try {
    if (Constants.executionEnvironment === "storeClient") {
      // Expo Go — 푸시 미지원
      return;
    }

    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") return;

    // Android 채널 (요가톡)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("yoga-talk", {
        name: "요가톡",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenRes.data;
    if (!token) return;

    await supabase.from("user_push_tokens").upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" },
    );
  } catch (e) {
    // 실패는 silently
    console.warn("[push] register failed", e);
  }
}
