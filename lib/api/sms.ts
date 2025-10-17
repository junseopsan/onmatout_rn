import crypto from "crypto-js";

const SENS_SERVICE_ID = "ncp:sms:kr:360511816819:onmatout";
const SENS_API_URL = "https://sens.apigw.ntruss.com/sms/v2";
const ACCESS_KEY = process.env.EXPO_PUBLIC_NCP_ACCESS_KEY || "";
const SECRET_KEY = process.env.EXPO_PUBLIC_NCP_SECRET_KEY || "";

// HMAC-SHA256 서명 생성 (API Gateway v2 방식)
const generateSignature = (
  method: string,
  url: string,
  timestamp: string,
  accessKey: string,
  secretKey: string
): string => {
  // URL에서 경로 부분만 추출 (Swagger와 동일하게)
  const urlObj = new URL(url);
  const path = urlObj.pathname;

  const message = `${method} ${path}\n${timestamp}\n${accessKey}`;
  console.log("서명 생성 메시지:", message);
  const signature = crypto
    .HmacSHA256(message, secretKey)
    .toString(crypto.enc.Base64);
  console.log("생성된 서명:", signature);
  return signature;
};

// 타임스탬프 생성
const getTimestamp = (): string => {
  return Date.now().toString();
};

// SMS 발송 API
export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; message?: string; data?: any }> => {
  try {
    console.log("환경 변수 확인:");
    console.log("ACCESS_KEY 존재:", !!ACCESS_KEY);
    console.log("SECRET_KEY 존재:", !!SECRET_KEY);
    console.log("ACCESS_KEY 길이:", ACCESS_KEY.length);
    console.log("SECRET_KEY 길이:", SECRET_KEY.length);
    console.log("ACCESS_KEY 값:", ACCESS_KEY);
    console.log("SECRET_KEY 값:", SECRET_KEY);

    if (!ACCESS_KEY || !SECRET_KEY) {
      return {
        success: false,
        message: "API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.",
      };
    }

    const timestamp = getTimestamp();
    const url = `${SENS_API_URL}/services/${SENS_SERVICE_ID}/messages`;

    const body = {
      type: "SMS",
      countryCode: "82",
      from: "15445218", // 네이버 클라우드 플랫폼에 등록된 발신번호
      subject: "[OnMatOut] 인증번호",
      contentType: "COMM",
      content: message,
      messages: [
        {
          to: phoneNumber.replace(/[^0-9]/g, ""), // 숫자만 추출
        },
      ],
    };

    const bodyString = JSON.stringify(body);
    const signature = generateSignature(
      "POST",
      url,
      timestamp,
      ACCESS_KEY,
      SECRET_KEY
    );

    console.log("SMS API 요청 정보:");
    console.log("URL:", url);
    console.log("Headers:", {
      "Content-Type": "application/json",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": ACCESS_KEY,
      "x-ncp-apigw-signature-v2": signature,
    });
    console.log("Body:", JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ncp-apigw-timestamp": timestamp,
        "x-ncp-iam-access-key": ACCESS_KEY,
        "x-ncp-apigw-signature-v2": signature,
      },
      body: bodyString,
    });

    console.log("SMS API 응답 상태:", response.status);
    console.log("SMS API 응답 헤더:", response.headers);

    const result = await response.json();
    console.log("SMS API 응답 데이터:", result);

    if (
      response.ok &&
      (result.statusCode === "202" || result.statusName === "success")
    ) {
      return {
        success: true,
        data: result,
      };
    } else {
      return {
        success: false,
        message: result.statusName || `SMS 발송 실패 (HTTP ${response.status})`,
      };
    }
  } catch (error) {
    console.error("SMS 발송 오류:", error);
    return {
      success: false,
      message: "SMS 발송 중 오류가 발생했습니다.",
    };
  }
};

// 인증번호 발송
export const sendVerificationCode = async (
  phoneNumber: string
): Promise<{ success: boolean; message?: string; data?: any }> => {
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString(); // 6자리 랜덤 숫자
  const message = `[OnMatOut] 인증번호: ${verificationCode}`;

  const result = await sendSMS(phoneNumber, message);

  if (result.success) {
    // 인증번호를 서버에 임시 저장 (실제로는 Redis나 DB에 저장)
    // 여기서는 간단히 메모리에 저장
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage");
      await AsyncStorage.setItem(
        `verification_code_${phoneNumber}`,
        verificationCode
      );
      await AsyncStorage.setItem(
        `verification_time_${phoneNumber}`,
        Date.now().toString()
      );
    } catch (storageError) {
      console.log("AsyncStorage 오류, 메모리에 저장:", storageError);
      // AsyncStorage 실패 시 메모리에 저장
      global.verificationCodes = global.verificationCodes || {};
      global.verificationCodes[phoneNumber] = {
        code: verificationCode,
        timestamp: Date.now(),
      };
    }
  }

  return result;
};

// 인증번호 검증
export const verifyCode = async (
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    let storedCode, storedTime;

    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage");
      storedCode = await AsyncStorage.getItem(
        `verification_code_${phoneNumber}`
      );
      storedTime = await AsyncStorage.getItem(
        `verification_time_${phoneNumber}`
      );
    } catch (storageError) {
      console.log("AsyncStorage 오류, 메모리에서 조회:", storageError);
      // AsyncStorage 실패 시 메모리에서 조회
      const storedData = global.verificationCodes?.[phoneNumber];
      storedCode = storedData?.code;
      storedTime = storedData?.timestamp?.toString();
    }

    if (!storedCode || !storedTime) {
      return {
        success: false,
        message: "인증번호를 찾을 수 없습니다.",
      };
    }

    // 5분(300초) 만료 체크
    const currentTime = Date.now();
    const codeTime = parseInt(storedTime);
    const timeDiff = (currentTime - codeTime) / 1000; // 초 단위

    if (timeDiff > 300) {
      return {
        success: false,
        message: "인증번호가 만료되었습니다.",
      };
    }

    if (storedCode === code) {
      // 인증 성공 시 저장된 코드 삭제
      try {
        const AsyncStorage = require("@react-native-async-storage/async-storage");
        await AsyncStorage.removeItem(`verification_code_${phoneNumber}`);
        await AsyncStorage.removeItem(`verification_time_${phoneNumber}`);
      } catch (storageError) {
        console.log("AsyncStorage 삭제 오류, 메모리에서 삭제:", storageError);
        // 메모리에서 삭제
        if (global.verificationCodes) {
          delete global.verificationCodes[phoneNumber];
        }
      }

      return {
        success: true,
      };
    } else {
      return {
        success: false,
        message: "인증번호가 일치하지 않습니다.",
      };
    }
  } catch (error) {
    console.error("인증번호 검증 오류:", error);
    return {
      success: false,
      message: "인증번호 검증 중 오류가 발생했습니다.",
    };
  }
};
