// 텍스트 한 줄 → 아사나 매칭. 시퀀스 붙여넣기 등록용.
// 별칭(search_aliases) / 한글명 / 영문명 / 산스크리트 원문에 대해
// 정확(100) → 시작(86) → 포함(72) → 유사도(<=65) 순으로 점수.
import { normalizeText } from "../../hooks/useAsanas";
import type { Asana } from "../api/asanas";

// 자동 선택으로 인정하는 최소 점수
export const AUTO_MATCH_THRESHOLD = 85;

// 줄 앞의 번호/불릿 제거: "1. ", "1) ", "1 - ", "- ", "• ", "*"
function stripBullet(line: string): string {
  return line
    .replace(/^\s*\d+\s*[.)\-]\s*/, "")
    .replace(/^\s*[-•*·]\s*/, "")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
      prevDiag = tmp;
    }
  }
  return prev[b.length];
}

function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

function fieldScore(normLine: string, value: string | null | undefined): number {
  const v = normalizeText(value);
  if (!v || !normLine) return 0;
  if (v === normLine) return 100;
  if (v.startsWith(normLine) || normLine.startsWith(v)) return 86;
  if (v.includes(normLine) || normLine.includes(v)) return 72;
  return Math.round(similarity(normLine, v) * 65);
}

export interface AsanaLineMatch {
  raw: string; // 정제된 입력 줄
  candidates: Asana[]; // 점수 높은 순 후보 (최대 6)
  bestScore: number;
}

export function matchAsanaLine(line: string, asanas: Asana[]): AsanaLineMatch {
  const raw = stripBullet(line);
  const normLine = normalizeText(raw);
  const scored = asanas
    .map((a) => {
      const aliases: string[] = Array.isArray((a as any).search_aliases)
        ? (a as any).search_aliases
        : [];
      const score = Math.max(
        fieldScore(normLine, a.sanskrit_name_kr),
        fieldScore(normLine, a.sanskrit_name_en),
        fieldScore(normLine, (a as any).sanskrit_name),
        ...aliases.map((al) => fieldScore(normLine, al)),
      );
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score);

  return {
    raw,
    candidates: scored.slice(0, 6).map((x) => x.a),
    bestScore: scored[0]?.score ?? 0,
  };
}

// 여러 줄 텍스트 → 줄마다 매칭. 빈 줄 제거.
export function matchAsanaText(text: string, asanas: Asana[]): AsanaLineMatch[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => matchAsanaLine(l, asanas));
}
