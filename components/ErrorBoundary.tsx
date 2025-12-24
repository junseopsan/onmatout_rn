import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 (릴리즈 빌드에서도 확인 가능하도록)
    console.error("❌ [ErrorBoundary] 에러 발생:", error);
    console.error("❌ [ErrorBoundary] 에러 정보:", errorInfo);
    
    // 에러 정보를 상태에 저장
    this.setState({
      error,
      errorInfo,
    });

    // 여기에 에러 리포팅 서비스 연동 가능 (예: Sentry, Crashlytics)
    // 예: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 화면
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.title}>앱 오류가 발생했습니다</Text>
            <Text style={styles.message}>
              {this.state.error?.message || "알 수 없는 오류가 발생했습니다."}
            </Text>
            
            {__DEV__ && this.state.errorInfo && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>에러 상세:</Text>
                <Text style={styles.details}>
                  {this.state.error?.stack || "스택 정보 없음"}
                </Text>
                <Text style={styles.detailsTitle}>컴포넌트 스택:</Text>
                <Text style={styles.details}>
                  {this.state.errorInfo.componentStack || "컴포넌트 스택 정보 없음"}
                </Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: "100%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#cccccc",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  detailsContainer: {
    marginTop: 16,
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 8,
    marginBottom: 4,
  },
  details: {
    fontSize: 12,
    color: "#999999",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

