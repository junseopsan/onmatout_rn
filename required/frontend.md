# ONMATOUT Frontend Development Guide

## 🏗️ 아키텍처 패턴: MVVM (Model-View-ViewModel)

### MVVM 구조 설명

- **Model**: 데이터와 비즈니스 로직 (Supabase 데이터, API 응답)
- **View**: UI 컴포넌트 (React Native 컴포넌트)
- **ViewModel**: View와 Model 사이의 중재자 (Zustand Store, Custom Hooks)

---

## 📁 현재 파일 구조 (MVVM 패턴 적용)

```
onmatout_rn/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx                 # 탭 네비게이션 레이아웃
│   │   ├── index.tsx                   # 대시보드 탭 (Dashboard)
│   │   ├── asanas.tsx                  # 아사나 탐색 탭
│   │   ├── record.tsx                  # 수련 기록 탭
│   │   ├── studios.tsx                 # 요가원 탐색 탭
│   │   └── profile.tsx                 # 마이페이지 탭
│   ├── auth/
│   │   ├── login.tsx                   # 로그인 화면
│   │   └── verify.tsx                  # 인증 코드 확인 화면
│   ├── asanas/
│   │   ├── [id].tsx                    # 아사나 상세 페이지
│   │   └── search.tsx                  # 아사나 검색 페이지
│   ├── record/
│   │   ├── add.tsx                     # 수련 기록 추가
│   │   └── history.tsx                 # 수련 히스토리
│   ├── studios/
│   │   └── [id].tsx                    # 요가원 상세 페이지
│   └── _layout.tsx                     # 루트 레이아웃
├── components/
│   ├── ui/                             # 재사용 가능한 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Chip.tsx
│   │   ├── Loading.tsx
│   │   └── ErrorBoundary.tsx
│   ├── asanas/                         # 아사나 관련 컴포넌트
│   │   ├── AsanaCard.tsx
│   │   ├── AsanaList.tsx
│   │   ├── AsanaFilter.tsx
│   │   └── AsanaDetail.tsx
│   ├── record/                         # 수련 기록 관련 컴포넌트
│   │   ├── RecordEntry.tsx
│   │   ├── RecordList.tsx
│   │   ├── EmotionChip.tsx
│   │   └── EnergyLevelChip.tsx
│   ├── studios/                        # 요가원 관련 컴포넌트
│   │   ├── StudioCard.tsx
│   │   ├── StudioList.tsx
│   │   └── StudioDetail.tsx
│   ├── dashboard/                      # 대시보드 관련 컴포넌트
│   │   ├── StatsCard.tsx
│   │   ├── WeeklyChart.tsx
│   │   └── MonthlyChart.tsx
│   └── common/                         # 공통 컴포넌트
│       ├── Header.tsx
│       ├── TabBar.tsx
│       └── EmptyState.tsx
├── stores/                             # ViewModel (Zustand Stores)
│   ├── authStore.ts                    # 인증 상태 관리
│   ├── asanaStore.ts                   # 아사나 데이터 관리
│   ├── recordStore.ts                  # 수련 기록 관리
│   ├── studioStore.ts                  # 요가원 데이터 관리
│   ├── userStore.ts                    # 사용자 정보 관리
│   └── uiStore.ts                      # UI 상태 관리 (다크모드 등)
├── hooks/                              # Custom Hooks (ViewModel 로직)
│   ├── useAuth.ts                      # 인증 관련 로직
│   ├── useAsanas.ts                    # 아사나 관련 로직
│   ├── useRecords.ts                   # 수련 기록 관련 로직
│   ├── useStudios.ts                   # 요가원 관련 로직
│   ├── useStatistics.ts                # 통계 관련 로직
│   └── useTheme.ts                     # 테마 관련 로직
├── lib/                                # Model (데이터 레이어)
│   ├── supabase.ts                     # Supabase 클라이언트
│   ├── api/                            # API 함수들
│   │   ├── auth.ts                     # 인증 API
│   │   ├── asanas.ts                   # 아사나 API
│   │   ├── records.ts                  # 수련 기록 API
│   │   └── studios.ts                  # 요가원 API
│   └── utils/                          # 유틸리티 함수들
│       ├── date.ts                     # 날짜 관련 유틸
│       ├── validation.ts               # 유효성 검사
│       └── constants.ts                # 상수 정의
├── types/                              # TypeScript 타입 정의
│   ├── auth.ts                         # 인증 관련 타입
│   ├── asana.ts                        # 아사나 관련 타입
│   ├── record.ts                       # 수련 기록 관련 타입
│   ├── studio.ts                       # 요가원 관련 타입
│   └── user.ts                         # 사용자 관련 타입
├── constants/                          # 앱 상수
│   ├── emotions.ts                     # 감정 상태 상수
│   ├── energyLevels.ts                 # 에너지 레벨 상수
│   ├── categories.ts                   # 아사나 카테고리 상수
│   └── colors.ts                       # 색상 상수
└── assets/                             # 정적 자산
    ├── images/
    │   ├── asanas/                     # 아사나 이미지들
    │   └── icons/                      # 아이콘들
    └── fonts/                          # 폰트 파일들
```

---

## 📋 작업 계획 (순차적 진행)

### 🎯 개발 순서: 스플래시 → 회원가입 → 로그인 → 인증 → 아사나탭 → 대시보드탭 → 기록탭 → 요가원탭 → 마이페이지

---

## ✅ Phase 1: 프로젝트 기반 설정 (1-2일)

### 1.1 환경 설정

- [ ] Supabase 프로젝트 생성 및 설정
- [ ] 환경 변수 설정 (.env 파일)
- [ ] TypeScript 설정 최적화

### 1.2 기본 라이브러리 설치

```bash
npm install @supabase/supabase-js zustand nativewind
npm install react-native-svg victory-native
npm install @react-native-async-storage/async-storage
```

### 1.3 타입 정의 작성

- [ ] `types/auth.ts` - 인증 관련 타입
- [ ] `types/asana.ts` - 아사나 관련 타입
- [ ] `types/record.ts` - 수련 기록 관련 타입
- [ ] `types/studio.ts` - 요가원 관련 타입
- [ ] `types/user.ts` - 사용자 관련 타입

### 1.4 상수 정의

- [ ] `constants/emotions.ts` - 감정 상태 상수
- [ ] `constants/energyLevels.ts` - 에너지 레벨 상수
- [ ] `constants/categories.ts` - 아사나 카테고리 상수
- [ ] `constants/colors.ts` - 색상 상수

---

## ✅ Phase 2: 스플래시 화면 (0.5일)

### 2.1 Model 레이어

- [ ] `lib/supabase.ts` - Supabase 클라이언트 설정

### 2.2 ViewModel 레이어

- [ ] `stores/authStore.ts` - 인증 상태 관리 (기본 구조)
- [ ] `hooks/useAuth.ts` - 인증 관련 커스텀 훅 (기본 구조)

### 2.3 View 레이어

- [ ] `app/_layout.tsx` - 루트 레이아웃 (스플래시 로직 포함)
- [ ] `components/ui/Loading.tsx` - 로딩 컴포넌트
- [ ] 스플래시 화면 디자인 및 구현

---

## ✅ Phase 3: 회원가입 화면 (1일)

### 3.1 Model 레이어

- [ ] `lib/api/auth.ts` - 회원가입 API 함수

### 3.2 ViewModel 레이어

- [ ] `stores/authStore.ts` - 회원가입 상태 관리
- [ ] `hooks/useAuth.ts` - 회원가입 로직

### 3.3 View 레이어

- [ ] `app/auth/signup.tsx` - 회원가입 화면
- [ ] `components/ui/Input.tsx` - 입력 컴포넌트
- [ ] `components/ui/Button.tsx` - 버튼 컴포넌트
- [ ] 전화번호 입력 및 유효성 검사

---

## ✅ Phase 4: 로그인 화면 (1일)

### 4.1 Model 레이어

- [ ] `lib/api/auth.ts` - 로그인 API 함수

### 4.2 ViewModel 레이어

- [ ] `stores/authStore.ts` - 로그인 상태 관리
- [ ] `hooks/useAuth.ts` - 로그인 로직

### 4.3 View 레이어

- [ ] `app/auth/login.tsx` - 로그인 화면
- [ ] 전화번호 입력 및 유효성 검사
- [ ] 로그인 버튼 및 상태 표시

---

## ✅ Phase 5: 인증 코드 확인 (1일)

### 5.1 Model 레이어

- [ ] `lib/api/auth.ts` - 인증 코드 확인 API

### 5.2 ViewModel 레이어

- [ ] `stores/authStore.ts` - 인증 코드 상태 관리
- [ ] `hooks/useAuth.ts` - 인증 코드 확인 로직

### 5.3 View 레이어

- [ ] `app/auth/verify.tsx` - 인증 코드 확인 화면
- [ ] `components/ui/Input.tsx` - 인증 코드 입력
- [ ] 타이머 및 재전송 기능
- [ ] 인증 성공 시 메인 화면으로 이동

---

## ✅ Phase 6: 아사나탭 (3-4일)

### 6.1 Model 레이어

- [ ] `lib/api/asanas.ts` - 아사나 API 함수들
- [ ] 아사나 데이터 구조 설계

### 6.2 ViewModel 레이어

- [ ] `stores/asanaStore.ts` - 아사나 상태 관리
- [ ] `hooks/useAsanas.ts` - 아사나 관련 커스텀 훅

### 6.3 View 레이어

- [ ] `app/(tabs)/_layout.tsx` - 탭 네비게이션 레이아웃
- [ ] `app/(tabs)/asanas.tsx` - 아사나 목록 탭
- [ ] `app/asanas/[id].tsx` - 아사나 상세 페이지
- [ ] `app/asanas/search.tsx` - 아사나 검색 페이지
- [ ] `components/asanas/AsanaCard.tsx` - 아사나 카드 컴포넌트
- [ ] `components/asanas/AsanaList.tsx` - 아사나 목록 컴포넌트
- [ ] `components/asanas/AsanaFilter.tsx` - 아사나 필터 컴포넌트
- [ ] `components/asanas/AsanaDetail.tsx` - 아사나 상세 컴포넌트

---

## ✅ Phase 7: 대시보드탭 (2-3일)

### 7.1 ViewModel 레이어

- [ ] `hooks/useStatistics.ts` - 통계 관련 커스텀 훅
- [ ] 통계 계산 로직 구현

### 7.2 View 레이어

- [ ] `app/(tabs)/index.tsx` - 대시보드 탭
- [ ] `components/dashboard/StatsCard.tsx` - 통계 카드 컴포넌트
- [ ] `components/dashboard/WeeklyChart.tsx` - 주간 차트 컴포넌트
- [ ] `components/dashboard/MonthlyChart.tsx` - 월간 차트 컴포넌트
- [ ] 누적 수련 횟수 표시
- [ ] 연속 수련 일수 표시

---

## ✅ Phase 8: 기록탭 (3-4일)

### 8.1 Model 레이어

- [ ] `lib/api/records.ts` - 수련 기록 API 함수들
- [ ] 수련 기록 데이터 구조 설계

### 8.2 ViewModel 레이어

- [ ] `stores/recordStore.ts` - 수련 기록 상태 관리
- [ ] `hooks/useRecords.ts` - 수련 기록 관련 커스텀 훅

### 8.3 View 레이어

- [ ] `app/(tabs)/record.tsx` - 수련 기록 탭
- [ ] `app/record/add.tsx` - 수련 기록 추가
- [ ] `app/record/history.tsx` - 수련 히스토리
- [ ] `components/record/RecordEntry.tsx` - 수련 기록 입력 컴포넌트
- [ ] `components/record/RecordList.tsx` - 수련 기록 목록 컴포넌트
- [ ] `components/record/EmotionChip.tsx` - 감정 상태 칩 컴포넌트
- [ ] `components/record/EnergyLevelChip.tsx` - 에너지 레벨 칩 컴포넌트

---

## ✅ Phase 9: 요가원탭 (2-3일)

### 9.1 Model 레이어

- [ ] `lib/api/studios.ts` - 요가원 API 함수들
- [ ] 요가원 데이터 구조 설계

### 9.2 ViewModel 레이어

- [ ] `stores/studioStore.ts` - 요가원 상태 관리
- [ ] `hooks/useStudios.ts` - 요가원 관련 커스텀 훅

### 9.3 View 레이어

- [ ] `app/(tabs)/studios.tsx` - 요가원 목록 탭
- [ ] `app/studios/[id].tsx` - 요가원 상세 페이지
- [ ] `components/studios/StudioCard.tsx` - 요가원 카드 컴포넌트
- [ ] `components/studios/StudioList.tsx` - 요가원 목록 컴포넌트
- [ ] `components/studios/StudioDetail.tsx` - 요가원 상세 컴포넌트

---

## ✅ Phase 10: 마이페이지 (1-2일)

### 10.1 ViewModel 레이어

- [ ] `stores/userStore.ts` - 사용자 정보 상태 관리
- [ ] `hooks/useUser.ts` - 사용자 관련 커스텀 훅

### 10.2 View 레이어

- [ ] `app/(tabs)/profile.tsx` - 마이페이지 탭
- [ ] 사용자 정보 표시
- [ ] 설정 메뉴
- [ ] 로그아웃 기능

---

## ✅ Phase 11: 테마 및 UI/UX 개선 (2-3일)

### 11.1 ViewModel 레이어

- [ ] `stores/uiStore.ts` - UI 상태 관리
- [ ] `hooks/useTheme.ts` - 테마 관련 커스텀 훅

### 11.2 View 레이어

- [ ] 다크모드 구현
- [ ] UI/UX 개선
- [ ] 애니메이션 추가
- [ ] `components/common/Header.tsx` - 헤더 컴포넌트
- [ ] `components/common/TabBar.tsx` - 탭바 컴포넌트
- [ ] `components/common/EmptyState.tsx` - 빈 상태 컴포넌트

---

## ✅ Phase 12: 테스트 및 최적화 (2-3일)

### 12.1 테스트

- [ ] 각 기능별 단위 테스트
- [ ] 통합 테스트
- [ ] 사용자 테스트

### 12.2 최적화

- [ ] 성능 최적화
- [ ] 메모리 누수 방지
- [ ] 에러 처리 개선
- [ ] `components/ui/ErrorBoundary.tsx` - 에러 바운더리 컴포넌트

---

## ✅ Phase 13: 배포 준비 (1-2일)

### 13.1 배포 설정

- [ ] 앱 아이콘 및 스플래시 스크린
- [ ] 앱 설정 최적화
- [ ] 스토어 등록 준비

---

## 🛠️ 기술 스택 상세

### 상태 관리

- **Zustand**: 가벼운 상태 관리 라이브러리
- **React Query**: 서버 상태 관리 (선택사항)

### 스타일링

- **NativeWind**: Tailwind CSS for React Native
- **React Native Reanimated**: 부드러운 애니메이션

### 네비게이션

- **Expo Router**: 파일 기반 라우팅

### 데이터베이스

- **Supabase**: 백엔드 서비스
- **AsyncStorage**: 로컬 데이터 저장

### 차트 및 시각화

- **Victory Native**: 차트 라이브러리
- **React Native SVG**: SVG 지원

---

## 📱 주요 화면별 MVVM 구조 예시

### 아사나 목록 화면

```
View: app/(tabs)/asanas.tsx
├── AsanaList 컴포넌트
├── AsanaFilter 컴포넌트
└── SearchBar 컴포넌트

ViewModel: hooks/useAsanas.ts
├── asanaStore (Zustand)
├── 필터링 로직
└── 검색 로직

Model: lib/api/asanas.ts
├── 아사나 목록 조회 API
├── 아사나 검색 API
└── 즐겨찾기 API
```

### 수련 기록 추가 화면

```
View: app/record/add.tsx
├── AsanaSelector 컴포넌트
├── EmotionChip 컴포넌트
├── EnergyLevelChip 컴포넌트
└── MemoInput 컴포넌트

ViewModel: hooks/useRecords.ts
├── recordStore (Zustand)
├── 기록 저장 로직
└── 유효성 검사 로직

Model: lib/api/records.ts
├── 수련 기록 저장 API
└── 수련 기록 조회 API
```

---

## 🎯 개발 우선순위

1. **High Priority**: 인증, 아사나 탐색, 수련 기록
2. **Medium Priority**: 대시보드, 요가원 탐색
3. **Low Priority**: 마이페이지, 테마, 최적화

이 순서로 진행하면 핵심 기능부터 구현하여 빠르게 프로토타입을 만들 수 있습니다.
