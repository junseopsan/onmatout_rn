// 요가 테마 랜덤 닉네임 생성 (hilly_rn nicknameGenerator 패턴 참조)
// 형용사(차분/요가 무드) + 자연 + 동물(상당수는 요가 아사나 이름) 조합.
import { userAPI } from "../api/user";

const ADJECTIVES = [
  "평온한", "고요한", "유연한", "단단한", "깊은",
  "차분한", "가벼운", "따뜻한", "맑은", "자유로운",
  "빛나는", "잔잔한", "부드러운", "곧은", "온화한",
  "청명한", "산뜻한", "느긋한", "우아한", "단아한",
  "정갈한", "포근한", "싱그러운", "단정한", "든든한",
  "너그러운", "슬기로운", "평화로운", "균형잡힌", "강인한",
  "유려한", "한결같은", "묵직한", "청아한", "고른",
  "단정히선",
];

const NATURE = [
  "연꽃", "보리수", "대나무", "소나무", "단풍",
  "들꽃", "호수", "강물", "바다", "햇살",
  "달빛", "별빛", "새벽", "노을", "바람",
  "구름", "안개", "이슬", "파도", "숲",
  "들판", "하늘", "무지개", "폭포", "계곡",
  "풀잎", "꽃잎", "향기", "숨결", "물결",
  "빗방울", "눈꽃", "봄날", "산마루", "샘물",
  "고요",
];

const ANIMALS = [
  // 다수는 요가 아사나 이름 — 코브라/독수리/낙타/비둘기/전갈/물고기/나비/메뚜기/악어/까마귀/공작 자세 등
  "코브라", "독수리", "낙타", "비둘기", "전갈",
  "물고기", "나비", "메뚜기", "악어", "까마귀",
  "공작", "거북이", "사자", "학", "백조",
  "사슴", "고래", "두루미", "잠자리", "코끼리",
  "고양이", "개구리", "토끼", "봉황", "기린",
  "수달", "다람쥐", "부엉이", "여우", "돌고래",
  "반딧불", "잉어", "물총새", "산양", "노루",
  "범고래",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createNickname(): string {
  return `${pick(ADJECTIVES)}${pick(NATURE)}${pick(ANIMALS)}`;
}

/** 요가 테마 랜덤 닉네임. 중복이면 재시도, 끝까지 중복이면 숫자 접미사. */
export async function generateNickname(maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const nickname = createNickname();
    try {
      const res = await userAPI.checkNicknameDuplicate(nickname);
      if (res.success && !res.isDuplicate) return nickname;
    } catch {
      // 중복 확인 실패(네트워크 등) — 그냥 사용
      return nickname;
    }
  }
  return `${createNickname()}${Math.floor(Math.random() * 1000)}`;
}
