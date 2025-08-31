import * as ImagePicker from "expo-image-picker";
import { supabase } from "../supabase";

export const storageAPI = {
  // 이미지 선택 및 업로드
  uploadProfileImage: async (
    userId: string
  ): Promise<{
    success: boolean;
    url?: string;
    message?: string;
  }> => {
    try {
      console.log("프로필 이미지 업로드 시작:", userId);

      // 이미지 선택
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        return {
          success: false,
          message: "갤러리 접근 권한이 필요합니다.",
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // 정사각형
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log("선택된 이미지:", imageUri);

        // 파일 확장자 추출
        const fileExtension = imageUri.split(".").pop() || "jpg";
        const fileName = `${userId}_${Date.now()}.${fileExtension}`;
        const filePath = `avatars/${fileName}`;

        // 이미지를 base64로 변환
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Supabase Storage에 업로드
        const { data, error } = await supabase.storage
          .from("avatars")
          .upload(filePath, blob, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Storage 업로드 에러:", error);
          return {
            success: false,
            message: error.message,
          };
        }

        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        console.log("업로드 성공:", urlData.publicUrl);
        return {
          success: true,
          url: urlData.publicUrl,
        };
      }

      return {
        success: false,
        message: "이미지 선택이 취소되었습니다.",
      };
    } catch (error) {
      console.error("프로필 이미지 업로드 예외:", error);
      return {
        success: false,
        message: "이미지 업로드 중 오류가 발생했습니다.",
      };
    }
  },

  // 기존 프로필 이미지 삭제
  deleteProfileImage: async (
    imageUrl: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> => {
    try {
      console.log("프로필 이미지 삭제 시작:", imageUrl);

      // URL에서 파일 경로 추출
      const urlParts = imageUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `avatars/${fileName}`;

      const { error } = await supabase.storage
        .from("avatars")
        .remove([filePath]);

      if (error) {
        console.error("Storage 삭제 에러:", error);
        return {
          success: false,
          message: error.message,
        };
      }

      console.log("삭제 성공");
      return {
        success: true,
      };
    } catch (error) {
      console.error("프로필 이미지 삭제 예외:", error);
      return {
        success: false,
        message: "이미지 삭제 중 오류가 발생했습니다.",
      };
    }
  },

  // 이미지 URL 유효성 검사
  validateImageUrl: (url: string): boolean => {
    if (!url) return false;

    // Supabase Storage URL인지 확인
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    return url.includes(supabaseUrl || "supabase.co");
  },
};
