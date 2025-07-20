# ONMATOUT PRD (Product Requirements Document)

## 🧘 프로젝트 개요

ONMATOUT은 요가 입문자와 중급자를 위한 모바일 요가 수련 앱입니다.  
사용자는 300개의 요가 아사나 카드를 탐색하고, 오늘 수련한 아사나를 기록하며  
감정/에너지 상태도 함께 선택하여 요가를 일상의 습관으로 만들 수 있도록 유도합니다.  
또한, 주변 요가원 정보를 탐색할 수 있습니다.

---

## 📌 핵심 기능 요약

### 0. 로그인/회원가입 (Auth)

- 전화번호 문자 인증 (비밀번호 없음)
- Access Token 1달 / Refresh Token 1달
- Supabase Auth 연동

---

### 1. 아사나 탐색 (Asanas) - `아사나탭`

- 총 300개의 요가 아사나 카드 제공
- 아사나 검색 (한글/영어 이름)
- 카테고리 및 난이도 필터링
- 즐겨찾기 기능
- 아사나 상세 페이지
  - 이미지
  - 이름 (한글/산스크리트어/영어)
  - 설명
  - 효과
  - 카테고리
  - 난이도
  - 의미

---

### 2. 수련 기록 (Record) - `기록탭`, `대시보드에서 주간/월간 형태로 표시`

- 오늘 수련한 아사나 선택 및 기록 및 리스트 형태로 보기
  - 감정 상태 / 에너지 / 집중도 선택 (텍스트 칩 UI)
  - 자유 메모 작성 기능
- 수련 히스토리(상세) 확인 가능

---

### 3. 수련 통계 (Statistics) - `대시보드탭`

- 누적 수련 횟수
- 연속 수련 일수

---

### 4. 요가원 탐색 (Studios) - `요가원탭`

- 지역 기반 요가원 목록 제공
- 요가원 상세 정보:
  - 센터명
  - 위치
  - 운영 시간
  - 연락처
  - 웹 사이트
  - 인스타그램
- 앱 내 예약 기능 없음 (외부 연락 유도)

---

### 5. 사용자 경험 (User Experience)

- 직관적인 반응형 UI/UX
- 다크 모드 지원
- 바텀 탭 내비게이션:
  - 대시보드 / 아사나 / 기록 / 요가원 / 마이페이지

---

## 🔗 참고 문서 (Docs)

- [React Native 공식 문서](https://reactnative.dev/)
- [Supabase Authentication 가이드](https://supabase.com/docs/guides/auth)
- [Supabase Database 가이드](https://supabase.com/docs/guides/database)

---

## 📁 React Native 프로젝트 구조 제안

```
ONMATOUT/
├── app/
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── index.tsx
│   ├── screens/
│   │   ├── Dashboard/
│   │   ├── Asana/
│   │   ├── Record/
│   │   ├── Studios/
│   │   ├── Profile/
│   │   └── Auth/
│   ├── components/
│   │   ├── AsanaCard.tsx
│   │   ├── StudioCard.tsx
│   │   ├── RecordEntry.tsx
│   │   └── common/
│   ├── stores/
│   │   ├── userStore.ts
│   │   ├── asanaStore.ts
│   │   └── recordStore.ts
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useCalendarStats.ts
│   ├── types/
│   │   ├── asana.ts
│   │   ├── record.ts
│   │   └── user.ts
│   ├── constants/
│   │   ├── emotions.ts
│   │   ├── energyLevels.ts
│   │   └── categories.ts
│   └── assets/
│       ├── images/
│       └── icons/
├── .env
├── tailwind.config.js
├── tsconfig.json
├── app.json
└── package.json
```

---

## 🧩 추천 라이브러리 & 기술 스택

| 기능             | 라이브러리                              |
| ---------------- | --------------------------------------- |
| Navigation       | `@react-navigation/native`              |
| Zustand 상태관리 | `zustand`                               |
| Supabase 연동    | `@supabase/supabase-js`                 |
| 다크모드 감지    | `useColorScheme`                        |
| 스타일링         | `nativewind`                            |
| 차트 시각화      | `react-native-svg`, `victory-native` 등 |

---
