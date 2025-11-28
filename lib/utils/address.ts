/**
 * 주소 관련 유틸리티 함수
 */

// 지역명 매핑: 표준 지역명 -> 필터에서 사용하는 지역명
const REGION_NAME_MAP: Record<string, string> = {
  "서울특별시": "서울",
  "경기도": "경기",
  "부산광역시": "부산",
  "인천광역시": "인천",
  "대전광역시": "대전",
  "대구광역시": "대구",
  "광주광역시": "광주",
  "울산광역시": "울산",
  "세종특별자치시": "세종",
  "강원도": "강원",
  "강원특별자치도": "강원",
  "충청북도": "충북",
  "충청남도": "충남",
  "전라북도": "전북",
  "전라남도": "전남",
  "경상북도": "경북",
  "경상남도": "경남",
  "제주특별자치도": "제주",
};

/**
 * 주소에서 지역명을 추출하고 정규화합니다.
 * @param address 전체 주소 문자열
 * @returns 정규화된 지역명 (예: "서울", "경기")
 */
export function normalizeRegionName(address: string): string | null {
  if (!address) return null;

  // 주소에서 지역명 추출 (예: "서울특별시 송파구..." -> "서울특별시")
  for (const [standardName, normalizedName] of Object.entries(REGION_NAME_MAP)) {
    if (address.includes(standardName)) {
      return normalizedName;
    }
  }

  return null;
}

/**
 * 주소에서 구/군/시 이름을 추출합니다.
 * @param address 전체 주소 문자열
 * @returns 구/군/시 이름 (예: "송파구", "수원시", "수원시 영통구")
 */
export function extractDistrictName(address: string): string | null {
  if (!address) return null;

  // 주소 형식: "서울특별시 송파구..." 또는 "경기도 수원시..." 또는 "경기도 수원시 영통구..."
  // 정규식으로 구/군/시 추출
  const regionPattern =
    /(?:서울특별시|경기도|부산광역시|인천광역시|대전광역시|대구광역시|광주광역시|울산광역시|세종특별자치시|강원도|강원특별자치도|충청북도|충청남도|전라북도|전라남도|경상북도|경상남도|제주특별자치도)\s+/u;

  // 지역명 제거 후 남은 부분에서 구/군/시 추출
  const addressWithoutRegion = address.replace(regionPattern, "");

  // 구/군/시 패턴 매칭 (예: "송파구", "수원시", "수원시 영통구")
  const districtMatch = addressWithoutRegion.match(
    /^([가-힣]+(?:시|군|구))(?:\s+([가-힣]+구))?/u
  );

  if (districtMatch) {
    // "수원시 영통구" 같은 경우 "수원시 영통구" 반환
    if (districtMatch[2]) {
      return `${districtMatch[1]} ${districtMatch[2]}`;
    }
    // "송파구" 또는 "수원시" 같은 경우
    return districtMatch[1];
  }

  return null;
}

/**
 * 주소가 특정 지역명과 일치하는지 확인합니다.
 * @param address 전체 주소 문자열
 * @param regionName 필터에서 사용하는 지역명 (예: "서울", "경기")
 * @returns 일치 여부
 */
export function matchesRegion(address: string, regionName: string): boolean {
  if (!address || !regionName) return false;

  const normalizedRegion = normalizeRegionName(address);
  return normalizedRegion === regionName;
}

/**
 * 주소가 특정 구/군/시와 일치하는지 확인합니다.
 * @param address 전체 주소 문자열
 * @param districtName 구/군/시 이름 (예: "송파구", "수원시")
 * @returns 일치 여부
 */
export function matchesDistrict(address: string, districtName: string): boolean {
  if (!address || !districtName) return false;

  const extractedDistrict = extractDistrictName(address);
  if (!extractedDistrict) {
    // 추출 실패 시 단순 포함 검사로 폴백
    return address.includes(districtName);
  }

  // 정확한 일치
  if (extractedDistrict === districtName) {
    return true;
  }

  // 부분 일치 확인
  // 예: "수원시" 검색 시 "수원시 영통구"도 매칭
  // 예: "영통구" 검색 시 "수원시 영통구"도 매칭
  if (extractedDistrict.includes(districtName) || districtName.includes(extractedDistrict)) {
    return true;
  }

  // 구/군/시 이름만 비교 (예: "수원시"와 "수원시 영통구"에서 "수원시" 부분만 비교)
  const extractedBase = extractedDistrict.split(/\s+/)[0];
  const districtBase = districtName.split(/\s+/)[0];
  
  return extractedBase === districtBase;
}

/**
 * 검색어가 주소나 이름에 포함되는지 확인합니다.
 * 더 유연한 검색을 위해 부분 일치를 지원합니다.
 * @param text 검색 대상 텍스트 (이름 또는 주소)
 * @param query 검색어
 * @returns 일치 여부
 */
export function matchesSearchQuery(text: string, query: string): boolean {
  if (!text || !query) return false;

  const normalizedText = text.toLowerCase().trim();
  const normalizedQuery = query.toLowerCase().trim();

  // 공백으로 분리된 검색어들
  const searchTerms = normalizedQuery.split(/\s+/).filter((term) => term.length > 0);

  if (searchTerms.length === 0) return true;

  // 모든 검색어가 포함되어야 함 (AND 조건)
  return searchTerms.every((term) => normalizedText.includes(term));
}

