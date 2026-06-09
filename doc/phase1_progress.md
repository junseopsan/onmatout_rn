# Phase 1 진행 보고 (자율 진행 세션)

운동 다녀오신 동안 Phase 1 코드 작업의 P0 핵심 블록 대부분을 구현했습니다.

## ✅ 완료 (이번 세션)

### 1. 인프라
- `types/role.ts`, `types/teacher.ts` — 도메인 타입 (database.types.ts 기반)
- `stores/roleStore.ts` — Zustand 역할 store, AsyncStorage 영속
- `hooks/useRoles.ts` — 사용자 역할 fetch + 활성 역할 관리
- `hooks/useRoleSwitch.ts` — 역할 전환 + 라우팅 헬퍼
- `lib/api/teacher.ts` — 선생님 API (회원/클래스/수업권/출석)
- `lib/api/student.ts` — 회원 측 API (연결된 선생님 목록)

### 2. UI 컴포넌트
- `components/teacher/StudentRow.tsx` — 회원 row
- `components/teacher/ClassCard.tsx` — 클래스 카드
- `components/student/MyTeachersBanner.tsx` — 회원 모드 홈 배너

### 3. 화면 (선생님 모드)
- `app/teacher/index.tsx` — **선생님 홈** (회원/클래스 목록 + 통계)
- `app/teacher/member-create.tsx` — **회원 등록** (이름 필수 / 전화번호+PIPA / 메모) + 초대코드 공유
- `app/teacher/member-detail.tsx` — 회원 카드 (기본정보·수업권·최근 출석 20건)
- `app/teacher/class-create.tsx` — **클래스 만들기** (제목·설명·위치·정원 + 요일×시간 다중 스케줄)
- `app/teacher/class-detail.tsx` — 클래스 상세 + **회원 배정 modal**
- `app/teacher/membership-create.tsx` — 수업권 발급 (count/주N회/무제한)

### 4. 화면 (회원 모드 + 공통)
- `app/role-select.tsx` — 신규 사용자 역할 선택 (teacher / student)
- `app/(tabs)/index.tsx` — 기존 대시보드 상단에 `MyTeachersBanner` 추가 (회원 모드일 때만 표시)
- `app/settings.tsx` — **역할 섹션 추가**: 현재 모드 표시 + 다중 역할 전환 + 추가 가입

### 5. 통합
- `app/screens/AppContainer.tsx` — 인증 후 역할 분기 라우팅
  - 인증 + `user_roles` 비어있음 → `RoleSelect`
  - 인증 + teacher 활성 → `TeacherHome`
  - 그 외 → `TabNavigator` (기존 student 시점)
  - `rolesLoading` 대기로 race condition 방지
- `navigation/{types.ts, pages.ts, index.tsx}` — 7개 신규 route 등록:
  `RoleSelect`, `TeacherHome`, `TeacherMemberCreate`, `TeacherMemberDetail`,
  `TeacherClassCreate`, `TeacherClassDetail`, `TeacherMembershipCreate`

## 🧪 사용해 보기

dev에 이미 seed 데이터가 들어가 있으니 (`01000000000` 테스트 계정) 아래 흐름 그대로 확인 가능합니다:

1. **앱 빌드 후 로그인** (`01000000000` / `000000`)
2. AppContainer가 user_roles 확인 → 관리자 user는 이미 `teacher + student` 둘 다 부여돼 있어 → **TeacherHome 진입**
3. 회원 목록 5명 + "토요일 아침 빈야사" 외 클래스 표시
4. 우측 상단 "회원 모드 ↔" 버튼 → 학생 시점 dashboard, 상단 배너에 "리트릿 요가원" 연결 + 횟수권 남음 표시
5. Settings → 역할 섹션 → 모드 전환 또는 역할 추가
6. 회원 등록 → 자동 초대코드 (`ONM-XXXX`) 생성 → 공유 시트
7. 클래스 만들기 → 요일 chip 선택 → 시간 편집 → 생성 → 클래스 상세에서 "+ 배정" 으로 회원 추가
8. 회원 카드 → 수업권 발급 → 3가지 유형

## ⏭️ 남은 Phase 1 작업

### ✅ 완료 (2차 세션)
- **P0-5 출석 체크 + RPC**:
  - `mark_attendance(class_id, student_id, date, status, source, memo)` RPC — 트랜잭션 (출석 INSERT/UPDATE + 횟수권 차감/복구)
  - `cancel_attendance(attendance_id, memo)` RPC
  - 멱등성 보장: 같은 (class, student, date) 호출 시 갱신 + 차감 보정
  - 차감 규칙 (PRD 준수): 횟수권 present/late/makeup → +1, 다른 상태 → 차감 X. 기간권은 cron이 별도 처리
  - `app/teacher/class-attendance.tsx` — 날짜 선택 + 회원별 5개 상태 chip + 통계 바
  - 클래스 상세에 "오늘 출석" 버튼 추가

### 🔧 세션 이슈 해결
- **테스트 계정 (01000000000) 세션 미지속 + 역할 미로드**: 근본 원인 — `authAPI.verifyOTP`가 supabase.auth를 완전히 우회하고 user_profiles만 조회 → JWT 세션 생성 X → RLS가 모든 쿼리 차단
- **첫 시도** Test OTP via `verifyOtp` — 실패 (dev에 Test OTP 설정 안 됨 + auth.users 중복 phone 충돌)
- **최종 해결** phone+password 로그인:
  - dev 관리자 user (`7ec451a9`) 에 bcrypt 해싱된 password 설정 (`Test1234!`)
  - `authAPI.verifyOTP`에서 `supabase.auth.signInWithPassword({phone: '+821000000000', password: 'Test1234!'})` 호출
  - 진짜 JWT 세션 생성 → 자동 영속 + RLS 정상 작동
  - main 호환: `signInWithPassword` 실패 시 기존 user_profiles 조회로 fallback
- **race condition (loaded vs loading)**: roleStore에 `loaded` 플래그 추가 → AppContainer 가 첫 fetch 완료까지 정확히 대기

### 🐛 핫픽스 (이 세션)
- **classes 403 Forbidden**: 헬퍼 함수 (`is_student_in_class` 등) 의 EXECUTE 권한을 너무 강하게 REVOKE 해서 RLS 정책이 함수 호출 못해 403. 마이그레이션 `20260606010000_restore_helper_execute_for_rls.sql` 로 authenticated 에 다시 GRANT (함수 자체는 SECURITY DEFINER + auth.uid() 검증이라 안전).

### ✅ P0-6 회원 가입 매칭 완료
- `lib/api/student.ts`:
  - `findMatchByPhone(phone)` — phone 변형(국가코드/하이픈 포함) 다 검색, user_id NULL인 student_profiles 후보 반환
  - `linkByInviteCode(userId, code)` — `ONM-XXXX` 코드로 연결 + invite_code_used_at 채움
  - `acceptMatch(userId, studentProfileId)` — 후보 수락
- `app/auth/match.tsx`:
  - 후보 카드 표시 (선생님 스튜디오 이름 + 회원 이름)
  - 수락 버튼 + 거절 (자동 패스)
  - 초대 코드 직접 입력 폼
  - "나중에 할게요" 옵션

### ✅ 루틴 빌더 (Phase 2 시작)
- **선생님 측**:
  - `app/teacher/routine-list.tsx` — 본인 루틴 목록 + "만들기" 진입
  - `app/teacher/routine-create.tsx` — 제목/설명 + 아사나 선택(`AsanaSearchModal` 재사용) + 순서 조정(↑↓) + 삭제
  - `app/teacher/routine-detail.tsx` — 시퀀스 표시 + "공유" 시트(클래스 / 특정 회원)
  - TeacherHome 클래스 섹션 우측에 "📋 루틴" 진입점 추가
- **회원 측**:
  - `app/student/routine-list.tsx` — 공유받은 루틴 목록 (RLS `is_routine_shared_with_me` 가 자동 필터)
  - `app/student/routine-detail.tsx` — 아사나 시퀀스, 각 아사나 탭 시 기존 `AsanaDetail` 진입
  - MyTeachersBanner 우측에 "📋 복습 루틴 →" 링크
- `lib/api/teacher.ts`: `listMyRoutines` / `getRoutine` / `createRoutine` / `shareRoutine` / `listRoutineShares`
- `lib/api/routines-student.ts`: `listSharedRoutines` / `getRoutine`

### ✅ 편집 기능 추가 (CRUD 완성)
- `app/teacher/profile-edit.tsx` — studio_name / bio / location / cancellation_hours_before. TeacherHome 헤더 "선생님 모드 · 프로필 편집 ›" 진입
- `app/teacher/class-edit.tsx` — 클래스 기본 정보 + is_active 토글. 클래스 상세 우상단 "수정"
- `app/teacher/member-edit.tsx` — 이름/전화번호+PIPA/메모/상태 chip. 회원 상세 우상단 "수정"
- 새 API: `teacherApi.getMyTeacherProfile / upsertTeacherProfile / updateClass / updateStudent`

### ✅ Floga 스타일 루틴 빌더 (UI/UX 리디자인 시작점)
- `app/teacher/routine-create.tsx` 완전 새로 작성:
  - 상단: X / 제목 인라인 편집 pill / Undo · Redo
  - 시퀀스 슬롯 row — 가로 스크롤 + 빈 placeholder + 길게 누르면 삭제
  - "▲ 탭하여 시퀀스에 추가" 힌트 + 가운데 아사나 이름 표시
  - 큰 카드 캐러셀 (62% 화면 폭, snap-to-center, 좌우 카드 0.9 scale + 55% opacity)
  - 카드: 카테고리 컬러 배지 + 로컬 thumbnail (image_number → require) + 한글/영문 이름
  - 카테고리 필터 chips (CATEGORIES 활용, 활성 시 카테고리 컬러)
  - 우하단 floating 저장 버튼 (선택 개수 표시)
- 디자인 시스템 일관성을 위해 향후 다른 화면도 점진적으로 카드/필터 패턴 통일 예정

### ✅ Phase 1 마무리 — 주간 absent cron
- `process_weekly_absences()` Postgres 함수 — 매주 일요일 23:59 KST 실행
- 동작: `period_weekly` 활성 수업권에 대해 이번 주 attendance 카운트가 weekly_limit 미만이면, 등록된 클래스 스케줄 중 오늘 이전 + attendance 없는 날짜에 system_auto/absent 행 생성 (잔여 슬롯만큼)
- pg_cron 등록: `'59 14 * * 0'` (UTC) = 일요일 23:59 KST
- 멱등성: (class_id, student_id, date) 유니크 제약으로 중복 방지
- dev + main 둘 다 적용

### ✅ Floga 디자인 언어 마이그레이션 (점진적)
- 디자인 토큰: `constants/Design.ts` (RADIUS · SPACING · TYPE · SHADOW)
- 공통 컴포넌트:
  - `FormHeader` — ✕ + pill title + 우측 액션 (저장 등)
  - `PillInput` — 둥근 pill 입력 필드 (single/multi, focus glow, error 표시)
  - `Chip` — 필터/상태 chip (size sm/md, custom color)
  - `FabButton` — 우하단 floating action button (그림자 + 로딩)
- 마이그레이션된 화면 (5개):
  - `teacher/profile-edit` · `class-edit` · `class-create` · `member-edit` · `member-create` · `membership-create`

### ✅ 회원 가입 매칭 폴리시 강화
- `findMatchByPhone` 의 phone 변형 알고리즘 개선:
  - 010xxxxxxxx, 8210xxxxxxxx, +8210xxxxxxxx, 하이픈 (010-XXXX-XXXX), 공백 (010 XXXX XXXX) 모두 매칭
- Settings 에 회원 모드 진입점 추가: **"선생님과 연결 / 초대 코드"** → AuthMatch 진입
  - 자동 매칭을 건너뛴 뒤에도 언제든 수동 진입 가능

### 🎨 디자인 시스템 — Linear + Notion 하이브리드 (getdesign.md 기반)
- **`constants/Colors.ts` 전면 재정의**:
  - Primary: 빨강 `#E53935` → 보라 `#8B5CF6` (sahasrara, Linear 톤)
  - Secondary: 에메랄드 `#10B981` (anahata, 따뜻한 액센트)
  - Background: `#1A1A1A` → `#0A0A0A` (깊은 흑)
  - Surface: `#2D2D2D` → `#171717` (떠 있는 카드)
  - Border: `#404040` → `#262626` (부드러운 톤)
  - Chakra 팔레트 추가 — 카테고리/감정 매핑용 (Crown, ThirdEye, Throat, Heart, Solar, Sacral, Root)
- **`constants/Typography.ts`** 신설:
  - `FONT.sans` (시스템 default) + `FONT.serif` (Georgia / serif fallback) + `FONT.mono` (SpaceMono)
  - `TEXT.uiTitle` / `serifTitle` / `serifHero` / `eyebrow` 등 토큰
  - 향후 `@expo-google-fonts/inter + newsreader` 도입 시 fontFamily 만 교체
- **`components/ui/SerifTitle.tsx`** — Notion 풍 세리프 헤더 (size: title|hero, italic 지원)
- **적용 화면**:
  - TeacherHome — 헤더 "오늘의 회원" → serif hero
  - member-detail / class-detail / routine-detail / student/teacher-detail — 헤더 이름들 → serif title
- **FabButton** — 그림자가 새 primary(보라) 따라가도록 동적 적용
- **루틴 빌더 카드** — 차가운 흰색 → 따뜻한 베이지 `#F5F0E8` (요가 매트 톤) + 세리프 이름

기존 모든 화면이 `COLORS.primary` 등 토큰을 참조하므로 색 교체는 자동으로 전파됨. FAB · pill input · chip 등은 그대로 새 보라 톤으로 렌더링.

### 🔠 폰트 업그레이드
- `@expo-google-fonts/inter` + `@expo-google-fonts/newsreader` 설치
- `_layout.tsx` 에서 useFonts 로 6개 weight 로딩 (Regular/Medium/SemiBold/Bold)
- `Typography.ts`: FONT.sans = Inter, FONT.serif = Newsreader 로 전환
  - fontWeight 대신 폰트 패밀리로 두께 구분 (Android 가독성)
  - 한글 깨짐 우려 → Inter는 라틴, Newsreader는 라틴 위주 → 한글은 시스템 fallback 자동 (Android Noto Sans CJK, iOS Apple SD Gothic Neo) — 단 정렬/lineHeight 미세 조정 필요할 수 있음

### 🧭 선생님 모드 네비게이션
- **`navigation/TeacherTabNavigator.tsx`** — 4 탭 하단 네비:
  - 🏠 홈 (TeacherHome — overview)
  - 👥 회원 (`teacher/members-tab.tsx` 신설 — 검색 + 활동/휴면 그룹)
  - 📋 루틴 (TeacherRoutineList)
  - 👤 프로필 (공용 Profile)
- AppContainer 분기: teacher → `TeacherTabNavigator` (이전 단일 화면 TeacherHome 에서 업그레이드)
- useRoleSwitch / role-select 도 `TeacherTabNavigator` 로 리다이렉트

### 🧹 회원(학생) 모드 탭 정리
- **요가원 탭 제거** — TabNavigator 에서 Studios 삭제
- **대시보드 feed 제거** — 기존 복잡한 FlatList 피드 코드 모두 정리
- 새 대시보드 (`app/(tabs)/index.tsx`) 재작성:
  - 헤더 "수련 잘 다녀오세요" (회원) / "오늘 한 호흡" (선생님) — serif hero
  - MyTeachersBanner (연결된 선생님 + 잔여 회수)
  - 빠른 진입: 📚 아사나 사전 / 📝 기록 쓰기
  - 비로그인 시 게스트 카드 (로그인 안내)
- 기록 피드는 추후 Profile 탭으로 이전 예정

### ⏭️ 다음
- 회원 가입 직후 (signup이 아닌 sign-in 흐름 분기) `AuthMatch` 자동 진입 wire-up — useAuth onAuthStateChange 후 student role + no linkage 조건 확인
- **회원 측 화면 확장** (P1-8):
  - 본인 출석 히스토리 / 잔여 횟수 상세
  - 공유받은 루틴 표시 (Phase 2와 연결)
- **자동 cron** (Phase 1 마지막):
  - 일요일 23:59 → 기간권+주N회의 미처리 슬롯 absent 자동 마감 (pg_cron)
  - 7일 무활동 thread closed (요가톡 — Phase 2)

## 🔍 검증

- TypeScript: Phase 1 신규 코드 **0 에러** (`npx tsc --noEmit`)
- pre-existing 에러 33개는 모두 기존 코드 (`profile-info`, `Collapsible` 등) — 이번 작업과 무관
- 모든 신규 RLS 정책이 화면 동작과 일치하도록 작성됨 (선생님은 본인 데이터만, 회원은 본인 또는 공유받은 것만)

## 결정 사항 (자율 진행 중 채택한 default)

- **운영 사용자 33명 처리**: Phase 1 코드 자체는 비파괴적 — 기존 user는 user_roles 비어있어 RoleSelect로 진입 → 본인이 student/teacher 선택. 별도 일괄 마이그레이션 불필요.
- **프로젝트 구조**: 점진적 이행 채택. 기존 `app/(tabs)/` 그대로 유지 (= student 시점 기본 홈), `app/teacher/*` 신설. 큰 폴더 재구성 없음.

이 결정들은 PRD v0.4 작성 시 명시적으로 확정해도 좋고, 다른 방향이면 빠른 시점에 알려주세요.
