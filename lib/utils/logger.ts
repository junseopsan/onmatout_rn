/**
 * 프로덕션 빌드에서 로그를 제거하기 위한 유틸리티
 * __DEV__가 false일 때는 로그가 출력되지 않습니다.
 */

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // 에러는 프로덕션에서도 출력 (중요한 에러 추적을 위해)
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};

