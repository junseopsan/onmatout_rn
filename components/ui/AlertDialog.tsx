import { Alert } from "react-native";

interface AlertDialogProps {
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  showCancel?: boolean;
}

export const AlertDialog = {
  // 기본 확인 다이얼로그
  show: (title: string, message: string, onConfirm?: () => void) => {
    Alert.alert(title, message, [
      {
        text: "확인",
        onPress: onConfirm,
      },
    ]);
  },

  // 확인/취소 다이얼로그
  confirm: (
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText: string = "확인",
    cancelText: string = "취소"
  ) => {
    Alert.alert(title, message, [
      {
        text: cancelText,
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: confirmText,
        onPress: onConfirm,
      },
    ]);
  },

  // 로그인 다이얼로그 (특화)
  login: (onLogin?: () => void, onCancel?: () => void) => {
    Alert.alert("로그인이 필요합니다", "이 기능을 사용하려면 로그인해주세요.", [
      {
        text: "취소",
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: "로그인",
        onPress: onLogin,
      },
    ]);
  },

  // 삭제 확인 다이얼로그
  delete: (onDelete?: () => void, onCancel?: () => void) => {
    Alert.alert("삭제 확인", "정말로 삭제하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: onDelete,
      },
    ]);
  },

  // 에러 다이얼로그
  error: (message: string, onConfirm?: () => void) => {
    Alert.alert("오류", message, [
      {
        text: "확인",
        onPress: onConfirm,
      },
    ]);
  },

  // 성공 다이얼로그
  success: (message: string, onConfirm?: () => void) => {
    Alert.alert("성공", message, [
      {
        text: "확인",
        onPress: onConfirm,
      },
    ]);
  },
};

export default AlertDialog;
