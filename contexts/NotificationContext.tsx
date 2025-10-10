import React, { createContext, ReactNode, useContext, useState } from "react";
import Dialog from "../components/ui/Dialog";
import Snackbar from "../components/ui/Snackbar";

interface SnackbarState {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface DialogState {
  visible: boolean;
  title?: string;
  message?: string;
  type?: "info" | "success" | "warning" | "error";
  buttons?: Array<{
    text: string;
    onPress: () => void;
    style?: "default" | "cancel" | "destructive";
  }>;
}

interface NotificationContextType {
  showSnackbar: (
    message: string,
    type?: "success" | "error" | "info" | "warning",
    duration?: number,
    action?: { label: string; onPress: () => void }
  ) => void;
  showDialog: (
    title: string,
    message: string,
    type?: "info" | "success" | "warning" | "error",
    buttons?: Array<{
      text: string;
      onPress: () => void;
      style?: "default" | "cancel" | "destructive";
    }>
  ) => void;
  hideSnackbar: () => void;
  hideDialog: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: "",
    type: "info",
    duration: 3000,
  });

  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  const showSnackbar = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
    duration: number = 3000,
    action?: { label: string; onPress: () => void }
  ) => {
    setSnackbar({
      visible: true,
      message,
      type,
      duration,
      action,
    });
  };

  const showDialog = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: "default" | "cancel" | "destructive";
    }> = []
  ) => {
    setDialog({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, visible: false }));
  };

  const hideDialog = () => {
    setDialog((prev) => ({ ...prev, visible: false }));
  };

  const value: NotificationContextType = {
    showSnackbar,
    showDialog,
    hideSnackbar,
    hideDialog,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        duration={snackbar.duration}
        action={snackbar.action}
        onHide={hideSnackbar}
      />
      <Dialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        buttons={dialog.buttons}
        onClose={hideDialog}
      />
    </NotificationContext.Provider>
  );
};
