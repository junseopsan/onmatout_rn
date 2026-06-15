/**
 * 주소 관련 유틸리티 함수
 */

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

