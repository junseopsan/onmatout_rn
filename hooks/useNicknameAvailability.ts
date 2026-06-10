import { useEffect, useState } from "react";
import { userAPI } from "../lib/api/user";

interface Options {
  minLength?: number;
  maxLength?: number;
  /** 중복 확인에서 제외할 user_id (본인 수정 시) */
  excludeUserId?: string;
  /** 기존 닉네임 — 동일하면 중복 조회 없이 통과 */
  original?: string;
  /** false면 검사 비활성 (로드 완료 전 등) */
  enabled?: boolean;
}

/**
 * 닉네임 실시간 검증 + 중복 확인 (디바운스 0.4초).
 * - error: 표시할 에러 메시지 (없으면 "")
 * - checking: 중복 조회 진행 중
 * - isAvailable: 저장 가능한 유효 닉네임
 */
export function useNicknameAvailability(nickname: string, opts: Options = {}) {
  const {
    minLength = 2,
    maxLength = 20,
    excludeUserId,
    original,
    enabled = true,
  } = opts;
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const value = nickname.trim();
    setIsAvailable(false);

    if (!value) {
      setError("");
      setChecking(false);
      return;
    }
    if (value.length < minLength) {
      setError(`닉네임은 ${minLength}자 이상 입력해주세요.`);
      setChecking(false);
      return;
    }
    if (value.length > maxLength) {
      setError(`닉네임은 ${maxLength}자 이하로 입력해주세요.`);
      setChecking(false);
      return;
    }
    if (!/^[가-힣a-zA-Z0-9\s]+$/.test(value)) {
      setError("닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.");
      setChecking(false);
      return;
    }
    if (
      original != null &&
      value.toLowerCase() === original.trim().toLowerCase()
    ) {
      setError("");
      setChecking(false);
      setIsAvailable(true);
      return;
    }

    setError("");
    setChecking(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await userAPI.checkNicknameDuplicate(value, excludeUserId);
        if (cancelled) return;
        if (!res.success) {
          setError(res.message || "닉네임 확인 중 오류가 발생했습니다.");
        } else if (res.isDuplicate) {
          setError("이미 사용 중인 닉네임입니다.");
        } else {
          setIsAvailable(true);
        }
      } catch {
        if (!cancelled) setError("닉네임 확인 중 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [nickname, original, excludeUserId, enabled, minLength, maxLength]);

  return { error, checking, isAvailable, setError };
}
