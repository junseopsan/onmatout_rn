// crawl_naver_yoga.js
// 네이버 "검색 > 지역" API로 전국 요가/필라테스 스튜디오 수집

const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ==== 설정 ====

// 네이버 오픈API 키 (환경변수에서 읽음)
const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "❌ NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수를 먼저 설정해주세요."
  );
  process.exit(1);
}

// 출력 파일
const OUTPUT_JSON = path.join(process.cwd(), "naver_yoga_full.json");

// 시/도 리스트 (전국 커버) + 서울 구별 세분화
const SIDO_LIST = [
  "서울",
  "서울 강남구",
  "서울 강동구",
  "서울 강북구",
  "서울 강서구",
  "서울 관악구",
  "서울 광진구",
  "서울 구로구",
  "서울 금천구",
  "서울 노원구",
  "서울 도봉구",
  "서울 동대문구",
  "서울 동작구",
  "서울 마포구",
  "서울 서대문구",
  "서울 서초구",
  "서울 성동구",
  "서울 성북구",
  "서울 송파구",
  "서울 양천구",
  "서울 영등포구",
  "서울 용산구",
  "서울 은평구",
  "서울 종로구",
  "서울 중구",
  "서울 중랑구",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

// 검색 키워드 (다양한 요가 스타일, 브랜드, 관련 용어)
const KEYWORDS = [
  // 기본 요가 용어
  "요가",
  "요가원",
  "요가 스튜디오",
  "요가센터",
  "요가 클래스",
  "요가 레슨",
  "요가 필라테스",

  // 요가 스타일별
  "핫요가",
  "파워요가",
  "아쉬탕가요가",
  "빈야사요가",
  "하타요가",
  "쿤달리니요가",
  "힐링요가",
  "산전요가",
  "임산부요가",
  "키즈요가",
  "시니어요가",
  "휠요가",
  "플라잉요가",

  // 명상 및 관련 용어
  "요가명상",
  "마음수련",
  "요가테라피",
  "요가치료",
  "수련",

  // 브랜드명 (유명 요가 체인)
  "아메리카요가",
  "젠요가",

  // 복합 시설
  "요가 피트니스",
  "요가 헬스",
  "요가 센터",

  // 기타 관련 용어
  "요가 워크샵",
  "요가 리트릿",
  "요가 캠프",
  "요가 아카데미",
  "요가 학원",
  "요가 교육",
  "요가 자격증",
  "요가 강사",
  "요가 트레이닝",
];

// 네이버 지역검색 API 제약
const DISPLAY = 100; // 한 번에 100개
const MAX_START = 1000; // start 최대 1000 (= 총 1000개까지)
const DELAY_MS = 500; // 요청 간 딜레이 (rate limit 방지용, 더 늘림)
const MAX_PAGES_PER_QUERY = 5; // 쿼리당 최대 페이지 수 (500개까지)

// ==== 유틸 ====

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// HTML 태그 제거 (title/description에 <b> 태그 들어오는 것 정리)
function stripTags(text) {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, "");
}

// 위경도 변환
// 2023-08-25 이후: mapx, mapy는 WGS84 * 1e7 값이라서 1e7로 나눠서 사용하면 됨.
// ref: https://developers.naver.com/notice/article/12567
function toLat(mapy) {
  if (mapy === undefined || mapy === null) return null;
  return Number(mapy) / 1e7;
}

function toLng(mapx) {
  if (mapx === undefined || mapx === null) return null;
  return Number(mapx) / 1e7;
}

// ==== 네이버 지역검색 호출 ====

async function searchLocal(query, start) {
  const url = "https://openapi.naver.com/v1/search/local.json";

  const res = await axios.get(url, {
    params: {
      query,
      display: DISPLAY,
      start,
      sort: "random", // 정확도순
    },
    headers: {
      "X-Naver-Client-Id": CLIENT_ID,
      "X-Naver-Client-Secret": CLIENT_SECRET,
    },
    timeout: 10000,
  });

  return res.data;
}

// ==== 메인 로직 ====

async function main() {
  console.log("🏃‍♂️ 네이버 지역검색으로 전국 요가/필라테스 스튜디오 수집 시작");

  // name + address 기준으로 중복 제거
  const studioMap = new Map();
  const nowIso = new Date().toISOString();

  const totalQueries = SIDO_LIST.length * KEYWORDS.length;
  let currentQueryIndex = 0;

  for (const sido of SIDO_LIST) {
    for (const kw of KEYWORDS) {
      currentQueryIndex++;
      const query = `${sido} ${kw}`;
      const progress = ((currentQueryIndex / totalQueries) * 100).toFixed(1);
      console.log(
        `\n🔎 [${currentQueryIndex}/${totalQueries} (${progress}%)] "${query}" 검색 시작`
      );

      let start = 1;

      while (start <= MAX_START) {
        try {
          const data = await searchLocal(query, start);
          const total = data.total || 0;
          const items = data.items || [];

          console.log(
            `  📄 start=${start}, 이번=${items.length}, total=${total}, 누적=${studioMap.size}`
          );

          if (!items.length) {
            // 더 이상 없음
            break;
          }

          // 결과 처리
          for (const item of items) {
            const name = stripTags(item.title);
            const address = item.roadAddress || item.address || "";
            const key = `${name}|${address}`;

            if (studioMap.has(key)) continue;

            const lat = toLat(item.mapy);
            const lng = toLng(item.mapx);

            const studio = {
              // 기존 kakao_yoga_full.json 구조를 최대한 맞춰줌
              name,
              address,
              phone: item.telephone || null,
              website: null, // 지역검색 API에는 별도 홈페이지 URL이 직접 안옴
              instagram: null,
              description: stripTags(item.description || ""),
              image_url: null,
              latitude: lat,
              longitude: lng,
              created_at: nowIso,
              updated_at: nowIso,
              url: item.link || null, // 네이버 상세페이지 URL
              // 디버깅/출처용 필드 (DB에 안쓸거면 버려도 됨)
              _naver_query: query,
            };

            studioMap.set(key, studio);
          }

          // 더 이상 가져올 페이지 없으면 종료
          const maxUsable = Math.min(total, MAX_START);
          const currentPage = Math.ceil(start / DISPLAY);
          if (start + DISPLAY > maxUsable || currentPage >= MAX_PAGES_PER_QUERY)
            break;

          start += DISPLAY;
          await sleep(DELAY_MS);

          // 100개 쿼리마다 중간 저장
          if (currentQueryIndex % 100 === 0) {
            const tempStudios = Array.from(studioMap.values());
            const tempFile = OUTPUT_JSON.replace(
              ".json",
              `_temp_${currentQueryIndex}.json`
            );
            fs.writeFileSync(
              tempFile,
              JSON.stringify(tempStudios, null, 2),
              "utf-8"
            );
            console.log(`💾 중간 저장 (${tempStudios.length}개): ${tempFile}`);
          }
        } catch (err) {
          if (err.response) {
            console.error(
              `  ❌ API 오류 (query=${query}, start=${start}): ${err.response.status} ${err.response.statusText}`
            );
            console.error("     응답:", err.response.data);

            // 429면 좀 더 길게 쉬고 재시도
            if (err.response.status === 429) {
              console.log("  ⏳ 429 (rate limit) → 60초 대기 후 재시도");
              await sleep(60000);
              continue;
            }
          } else {
            console.error(
              `  ❌ 요청 실패 (query=${query}, start=${start}):`,
              err.message
            );
          }

          // 기타 에러는 해당 쿼리 루프 종료
          break;
        }
      }
    }
  }

  const studios = Array.from(studioMap.values());
  console.log("\n📊 최종 수집 개수:", studios.length);

  // 백업 파일 생성
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupFile = OUTPUT_JSON.replace(".json", `_backup_${timestamp}.json`);

  if (fs.existsSync(OUTPUT_JSON)) {
    fs.copyFileSync(OUTPUT_JSON, backupFile);
    console.log("📦 기존 파일 백업:", backupFile);
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(studios, null, 2), "utf-8");
  console.log("💾 JSON 저장 완료:", OUTPUT_JSON);

  // 통계 출력
  const regionStats = new Map();
  studios.forEach((studio) => {
    const address = studio.address || "";
    const cityMatch = address.match(/^([^시도군구]+[시도])/);
    if (cityMatch) {
      const city = cityMatch[1];
      regionStats.set(city, (regionStats.get(city) || 0) + 1);
    }
  });

  console.log("\n📊 지역별 수집 결과:");
  Array.from(regionStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([city, count]) => {
      console.log(`  ${city}: ${count}개`);
    });

  console.log("🎉 크롤링 완료!");
}

main().catch((e) => {
  console.error("🔥 전체 작업 중 에러:", e);
});
