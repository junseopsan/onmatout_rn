import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";
import { Platform, RefObject, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { getStoryCaptureOptions } from "../components/StoryShareCard";

/** 스토리용 고정 비율 카드 캡처 후 공유 (프로필 통계 등) */
export function useShareStory(viewRef: RefObject<View | null>) {
  const [isSharing, setIsSharing] = useState(false);

  const shareAsync = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!viewRef?.current) {
      return { success: false, error: "캡처할 뷰가 없습니다." };
    }

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      return { success: false, error: "이 기기에서는 공유를 사용할 수 없습니다." };
    }

    setIsSharing(true);
    try {
      const options = getStoryCaptureOptions();
      const uri = await captureRef(viewRef, options);
      if (Platform.OS === "android") {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "스토리에 공유",
        });
      } else {
        await Sharing.shareAsync(uri, {});
      }
      return { success: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { success: false, error: message };
    } finally {
      setIsSharing(false);
    }
  }, [viewRef]);

  return { shareAsync, isSharing };
}

/** 뷰를 그대로 캡처(화면 크기) 후 공유. 수련 상세 화면 등 실제 보이는 화면 공유용 */
export function useCaptureViewAndShare(viewRef: RefObject<View | null>) {
  const [isSharing, setIsSharing] = useState(false);

  const captureAndShare = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!viewRef?.current) {
      return { success: false, error: "캡처할 뷰가 없습니다." };
    }

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      return { success: false, error: "이 기기에서는 공유를 사용할 수 없습니다." };
    }

    setIsSharing(true);
    try {
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      if (Platform.OS === "android") {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "공유",
        });
      } else {
        await Sharing.shareAsync(uri, {});
      }
      return { success: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { success: false, error: message };
    } finally {
      setIsSharing(false);
    }
  }, [viewRef]);

  return { captureAndShare, isSharing };
}
