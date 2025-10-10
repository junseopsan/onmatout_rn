import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
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

      // Supabase 인증 상태 확인
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser || authUser.id !== userId) {
        return {
          success: false,
          message: "인증이 필요합니다. 다시 로그인해주세요.",
        };
      }

      // 버킷 조회는 클라이언트에서 권한이 없으므로 제거
      // 바로 avatars 버킷 사용

      // 이미지 선택
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        return {
          success: false,
          message: "갤러리 접근 권한이 필요합니다.",
        };
      }

      // 이미지 선택 옵션 개선 (MediaTypeOptions 경고 해결)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // 정사각형
        quality: 0.9, // 품질 향상
        base64: false,
        exif: false, // EXIF 데이터 제거로 처리 속도 향상
        allowsMultipleSelection: false, // 단일 선택만 허용
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageAsset = result.assets[0];
        const imageUri = imageAsset.uri;
        console.log("선택된 이미지:", imageUri);

        // 파일 확장자 및 MIME 타입 추출
        const fileExtension = (
          imageAsset.fileName?.split(".").pop() || "jpg"
        ).toLowerCase();
        const contentType = imageAsset.mimeType || `image/${fileExtension}`;

        // 사용자별 폴더에 업로드
        const fileName = `${Date.now()}.${fileExtension}`;
        let filePath = `${userId}/${fileName}`;

        console.log("업로드할 파일 경로:", filePath);

        // RN/Expo에서는 FileSystem을 통한 base64 업로드가 더 안정적
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // base64를 Uint8Array로 변환
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        console.log("이미지 byteArray 생성 완료, 크기:", byteArray.length);

        // 파일 크기 제한 (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (byteArray.length > maxSize) {
          return {
            success: false,
            message:
              "이미지 크기가 너무 큽니다. 5MB 이하의 이미지를 선택해주세요.",
          };
        }

        // Supabase Storage에 업로드 (Uint8Array 방식)
        let uploadResult = await supabase.storage
          .from("avatars")
          .upload(filePath, byteArray, {
            cacheControl: "3600",
            upsert: true,
            contentType,
          });

        // 업로드 실패 시 여러 방식으로 재시도
        if (uploadResult.error) {
          console.log("첫 번째 업로드 실패:", uploadResult.error.message);

          // 1. 파일명을 더 간단하게 변경하여 재시도
          const simpleFileName = `avatar_${Date.now()}.${fileExtension}`;
          const simpleFilePath = `${userId}/${simpleFileName}`;

          console.log("간단한 파일명으로 재시도:", simpleFilePath);
          uploadResult = await supabase.storage
            .from("avatars")
            .upload(simpleFilePath, byteArray, {
              cacheControl: "3600",
              upsert: true,
              contentType,
            });

          if (uploadResult.error) {
            console.log("간단한 파일명도 실패:", uploadResult.error.message);

            // 2. 루트 경로에 직접 업로드 시도
            const rootFileName = `avatar_${Date.now()}.${fileExtension}`;
            console.log("루트 경로로 재시도:", rootFileName);

            uploadResult = await supabase.storage
              .from("avatars")
              .upload(rootFileName, byteArray, {
                cacheControl: "3600",
                upsert: true,
                contentType,
              });

            if (uploadResult.error) {
              return {
                success: false,
                message: `업로드 실패: ${uploadResult.error.message}. Storage 버킷 설정을 확인해주세요.`,
              };
            }

            // 루트 경로 성공 시 파일 경로 업데이트
            filePath = rootFileName;
          } else {
            // 간단한 파일명 성공 시 파일 경로 업데이트
            filePath = simpleFilePath;
          }
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
      return {
        success: false,
        message: `이미지 업로드 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`,
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
    const supabaseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      Constants.expoConfig?.extra?.supabaseUrl;
    return url.includes(supabaseUrl || "supabase.co");
  },
};
