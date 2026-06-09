# ONMATOUT Pivot PRD v0.6

## 요가 선생님과 회원을 수업 밖에서도 연결하는 AI 클래스 케어 앱

문서 버전: v0.6
작성일: 2026-06-09
이전 버전: v0.5 (2026-06-08), v0.4 (2026-06-05)
프로젝트명: ONMATOUT
플랫폼: Mobile App
기술 방향: React Native / Supabase / RAG / OpenAI

---

## v0.6 주요 변경 사항 (구현 반영)

v0.5 → v0.6 은 v0.5 이후 추가 구현을 PRD에 동기화하는 업데이트. (작성일 2026-06-09)

### 요가톡: 토픽별 다중 스레드 (기본 1개 + 필요 시 추가)

- v0.5 의 "회원 ↔ 지도자 **단일 영구 스레드**" 정책을 확장 → **(회원, 지도자) 페어당 기본 스레드 1개 + 주제별 스레드 N개**
- 한 지도자가 여러 클래스를 운영해도 회원은 그 지도자와 **하나의 톡방 그룹**에서 주제만 나눠 대화 (예: "부상 상담", "시퀀스 질문")
- `yoga_talk_threads.is_default boolean` 추가. 페어 첫 스레드 = 기본(삭제 불가, 항상 존재), 추가 스레드는 제목 변경/삭제 가능
- 스레드 화면 좌측 **사이드바 드로어**에서 토픽 전환 / 새 대화 / 이름 변경 / 삭제 (옴 AI 사이드바와 동일 패턴)
- 요가톡 탭(DM 리스트)에는 페어당 **기본 스레드만** 노출 → 회원 1명당 한 줄 유지

### 시퀀스 옴 (좋아요)

- `routine_likes(routine_id, user_id, created_at)` 신설. 복합 PK, RLS: 누구나 조회 / 본인만 추가·삭제
- 시퀀스 카드 하단에 "옴 N" 토글 (낙관적 업데이트 + 실패 시 롤백, 햅틱). 선생님·수련생 양쪽 시퀀스 목록 모두 적용
- 시퀀스 카드에 **작성자(요가원/스튜디오명)** 표시 — 누가 만든 시퀀스인지, 옴을 몇 개 받았는지 노출

### 회원 커스텀 상태

- 회원 상태를 **수련중(active) / 휴식중(paused) / 커스텀(자유 텍스트)** 3종으로 확장
- `student_profiles.custom_status text nullable` 추가. 커스텀 입력 시 `status='paused'` + `custom_status` 저장
- 공통 `StatusChip` 컴포넌트로 회원 목록/상세에서 일관 표시 (커스텀은 primary 톤 강조)
- 회원 탭은 이름/전화번호 검색 + 수련중/휴식/커스텀 3섹션 구성

### 출석 체크 = 바텀시트

- 기존 풀페이지 출석 화면(`TeacherClassAttendance`) → 공통 `Sheet` 기반 **`AttendanceSheet` 바텀시트**로 전환
- 진입점 2곳 공유: 클래스 상세 "오늘 출석" 버튼 + 클래스 탭 "오늘 출석 체크" 버튼
- 회원 행 컴팩트화: 컬러 아바타 + 이름 + [출석][결석] 한 줄

### 클래스 스케줄 표시 단순화

- 일~토 전체 요일 스트립 제거 → **동일 시간대끼리 요일 묶음** 표시 (예: `[월][수][금]  09:00–10:30`)
- 시간이 다른 그룹은 줄 분리. 클래스 상세 + 클래스 목록 카드(ClassCard) 동일 적용
- 클래스 상세에서 활성/비활성 칩 제거, 메타 아이콘 primary 통일로 가독성 개선

### 공통 컴포넌트 정착 (추가)

- `Avatar` (이름/id hash → 10색 팔레트, 결정적 색상) — StudentRow, 요가톡 리스트, 출석시트에서 중복돼 있던 색상 함수를 단일화
- `SideSheet` (좌측 드로어 모달), `SessionRow` (토픽/세션 한 줄), `RenameDialog` (제목 입력 모달) — 옴 AI / 요가톡 사이드바가 공유
- `StatusChip` (active/paused/archived + 커스텀 라벨, sm/md)

### 기타

- 수업 취소 확인 모달에 **날짜/요일/시간** 표시 (예: `11월 13일 (목), 19:00–20:30`)
- 소스 전반에서 **가운데점(·) 사용 중단** → 쉼표 또는 줄바꿈으로 대체 (한국어 표기/디자인 일관성)

### 데이터 모델 변경 (v0.6)

- `routine_likes(routine_id, user_id, created_at)` 신규 — 시퀀스 옴(좋아요). 복합 PK, dev + main 적용
- `yoga_talk_threads.is_default boolean default false` 추가 — 페어당 기본 스레드 구분
- `student_profiles.custom_status text nullable` 추가 — 회원 커스텀 상태 텍스트

### 미구현 / 보류 (v0.5 → v0.6 갱신)

- 요가톡 자동 종결(7일) / 미응답 리마인드 — 여전히 미구현. 토픽 멀티 스레드 구조에서도 영구 보존이 기본
- 옴(좋아요)에 대한 알림/집계 대시보드 — 미구현 (카운트 표시만)
- 시퀀스 작성자 프로필로의 딥링크 — 미구현 (이름 표시만)

---

## v0.5 주요 변경 사항 (구현 반영)

v0.4 → v0.5 는 실제 구현을 기준으로 PRD를 동기화하는 업데이트. 새로 도입된 개념과 v0.4 스펙에서 벗어난 부분을 정리한다.

### 신규 도메인: 요가원 (Studio)

- v0.4 에는 없던 **요가원** 개체 도입. `pivot_studios` 테이블 신설
- 한 요가원 = 1명의 **원장(Director, owner_id)** + N명의 **지도자(Teacher, studio_teachers)**
- 회원은 `student_profiles.studio_id` 로 1개 요가원에 소속
- 클래스는 `classes.studio_id` 로 요가원에 묶임
- 요가원 단위로 인스타그램·카카오·전화·운영시간 등 연락 정보를 저장 → 회원 클래스탭에 노출

### 역할 모델 보강

- v0.4 의 `teacher` / `student` 2종 → 실제 구현은 **원장 / 지도자 / 수련생** 3단 권한
- 원장은 요가원 + 클래스 + 지도자 관리, 지도자는 출석 체크와 수련생 케어 도움, 수련생은 클래스 신청/수업권 사용
- 회원 상세에서 "지도자 승급/해제" 기능 (원장 전용) — `studio_teacher_removals` 이력 보존

### 요가톡 흐름 단순화

- v0.4 의 `ai_answered → sent_to_teacher → teacher_answered → closed` 상태머신 **폐기**
- 실제 구현: **AI 와 DM 을 분리**
  - **옴(AI 요가 도우미)**: 별도 화면. 세션별 대화 저장 (`ai_sessions` + `ai_answer_logs`). 제목 변경/삭제 가능
  - **요가톡 DM**: 회원 ↔ 지도자 단일 영구 스레드 (인스타 DM 스타일). 닫기 기능 제거. 영구 보존 → **v0.6 에서 토픽별 다중 스레드로 확장** (기본 1개 + 주제별 추가)
- "AI 답변 초안" 개념 폐기. AI 답변은 회원 전용. 지도자는 별도 DM 으로만 답변.
- 요가톡 탭 = DM 리스트, 우측 하단 플로팅 "옴" 버튼 → AI 화면

### 클래스 신청/대기 (신규)

- v0.4 의 출석 정책 위에 **회원 셀프 신청** 추가
- `class_bookings(class_id, student_id, booking_date, status)` 신설. 상태: `booked` / `waitlisted` / `canceled`
- 정원 도달 시 자동 `waitlisted`. 누군가 취소하면 DB 트리거가 대기자 자동 승급 + 알림
- 수련생 클래스탭: 주간 SectionList 뷰 (월~일 시간순), 다음 주까지 탐색 가능, 지난 시점은 비활성

### 푸시 알림 인프라 (신규)

- `user_push_tokens` 테이블 + Expo Push 토큰 등록 hook
- `send-push` Edge Function (verify_jwt=false, DB trigger 호출용)
- yoga_talk_messages INSERT 트리거가 `pg_net.http_post` 로 send-push 호출 → 상대에게 즉시 푸시

### UI/UX 표준화

- 공통 컴포넌트 정착: `Button` (primary/secondary/outline/destructive × small/medium/large × rect/pill), `PillInput` (`required` prop = 빨간 \* 자동), `DetailHeader serif={false}` 통일 (15px Sans)
- `FormHeader (X close)` 제거 → 모든 폼 페이지가 `DetailHeader (‹ back)` 로 일관
- `FabButton` 의 "+" 사인은 add-new 화면에서만, 일반 submit 은 공통 Button 으로 교체
- 색상 기반 아바타 (이름 hash → 10색 팔레트), 이모지 대신 Ionicons 사용 (Android 폰트 fallback 회피)

### 수련 탭 = 인스타 프로필 스타일

- `user_profiles.bio text` 컬럼 추가 (소개 한 줄)
- 큰 원형 아바타(84x84) + 우측 인라인 통계 (총 수련 / 이번 주 / 이번 달)
- 표시명 + bio + [프로필 수정] 액션 행

### 시퀀스(루틴) 빌더 개편

- 드래그 정렬 (`react-native-draggable-flatlist`)
- 슬롯 사이 `→` 화살표로 흐름 표시
- 상세 화면은 3열 그리드 + 지그재그(Boustrophedon) 흐름 (행 사이 ↓ 표시)
- 카드 미리보기 7개 (시퀀스 목록에서 어떤 아사나가 들어있는지 즉시 파악)
- 시퀀스 수정 기능 (`TeacherRoutineCreate { routineId? }`)
- 공개 여부: 세그먼트 토글 [비공개 | 공개] (헤더 영역)

### 데이터 모델 변경

- `ai_sessions(thread_id pk, user_id, title)` 신규 — 세션 제목 보관
- `ai_answer_logs.thread_id` FK 제거 (yoga_talk_threads 와 무관한 자체 식별자로 분리)
- `routines.visibility` CHECK 에 `'public'` 추가
- `pivot_studios` 에 `instagram_url`, `kakao_url` 컬럼 추가
- `yoga_talk_thread_reads(thread_id, user_id, last_read_at)` 으로 읽음 표시
- `studio_teacher_removals(studio_id, teacher_id, removed_by, reason, removed_at)` 으로 지도자 해제 이력

### 미구현 / 의도적으로 보류된 항목 (v0.4 → v0.5)

- v0.4 의 `user_roles(user_id, role)` 다중 역할 분리 테이블 — 미구현. 실제로는 `roles` 테이블 + `roleStore` 로 활성 역할 토글만 구현
- v0.4 의 `teacher_students` N:M join table — 미구현. 회원은 `student_profiles.teacher_id` 단일 FK 로 한 지도자에 소속 (피벗에서는 요가원 + 원장으로 충분)
- 자동 결석 cron (매주 일요일 23:59 absent 마감) — 미구현. 대기자 자동 승급 트리거만 가동
- 회원 셀프 수업 취소 정책 시간 (cancellation_hours_before) — `teacher_profiles` 컬럼은 있지만 클라이언트 시점 검증은 보류
- 요가톡 자동 종결(7일) / 미응답 리마인드(3일/7일) — 미구현 (단일 영구 스레드로 변경되어 불필요)

---

## v0.4 주요 변경 사항

v0.3 리뷰(`pivot_todo.md`)의 P0 결정사항을 본문에 반영.

### 데이터 모델

- **다중 역할 모델**: 한 사람이 선생님 + 회원 동시 가능. `users.role` 단일값 → `user_roles(user_id, role)` 분리
- **회원 ↔ 선생님 N:M**: 회원이 여러 선생님과 동시 연결 가능. `teacher_students` join table 추가
- **클래스 스케줄 분리**: `classes.day_of_week` 제거 → `class_schedules(class_id, day_of_week, start_time, end_time)` 별도 테이블
- **수업권 타입 재정의**: `count` / `period_weekly` / `period_unlimited` 3종. 횟수권에도 기본 2개월 유효기간
- **초대 코드 추가**: 모든 `student_profiles`에 전역 유니크 1회용 코드 자동 생성

### 출석/취소 정책

- 차감 정책 명문화: 횟수권은 실제 참여만 차감 / 기간권+주N회는 모든 상태 슬롯 차감
- 매주 일요일 23:59 cron이 기간권+주N회 미처리 슬롯을 absent로 자동 마감
- 회원 셀프 취소 도입: `teacher_profiles.cancellation_hours_before` 정책

### 요가톡 흐름

- AI 답변은 회원에게 즉시 노출 (선생님 검토 대기 없음)
- "AI 답변 초안" 용어 제거 → "회원이 받은 AI 답변" 통일
- 자동 종결: 회원 마지막 활동 + 7일
- 선생님 미응답 3일/7일 자동 리마인드

### UX

- 앱 진입 시 역할 모드 토글 (다중 역할 사용자 대응)
- 회원 가입 후 자동 매칭 흐름 (전화번호 + 초대 코드 fallback)

### 신규 섹션

- 24. 기존 데이터 처리 정책 (v0.5에서 결정 예정)
- 25. 프로젝트 구조 마이그레이션 전략 (v0.5에서 결정 예정)

---

## 1. 프로젝트 개요

ONMATOUT은 기존의 개인 요가 기록 앱에서 벗어나, **요가 선생님과 회원을 수업 밖에서도 연결하는 클래스 케어 앱**으로 피벗한다.

핵심은 다음 네 가지다.

1. **아사나 사전**
2. **선생님 회원 관리 / 출석 체크**
3. **복습 루틴 공유**
4. **요가톡 AI / RAG 기반 수련 도우미**

기존 온매트아웃의 강점이었던 아사나 사전은 유지하고, 이를 단순 콘텐츠가 아니라 **AI 답변의 지식 기반**으로 활용한다. 선생님은 수업과 회원을 관리하고, 회원은 수업에서 배운 아사나와 복습 루틴을 확인하며, 수련 중 생기는 질문을 요가톡 AI 또는 선생님에게 남길 수 있다.

---

## 2. 피벗 배경

### 2.1 기존 문제

기존 앱은 사용자가 직접 오늘 수련한 아사나를 선택하고, 감정 상태와 메모를 기록하는 구조였다.

하지만 일반 사용자는 다음 부담을 느낄 수 있다.

- 내가 어떤 아사나를 했는지 정확히 모름
- 아사나 이름이 어렵게 느껴짐
- 기록 작성이 숙제처럼 느껴짐
- 수련하지 않은 날에는 앱을 열 이유가 적음
- 개인 기록만으로는 지속적인 재방문 동기가 약함

### 2.2 긍정적 신호

반면, **아사나 사전 기능은 반응이 좋다.**

이는 사용자가 온매트아웃에서 얻는 핵심 가치가 “기록”보다는 다음에 더 가깝다는 뜻이다.

- 요가 자세를 쉽게 찾아보기
- 자세의 이름과 효과 이해하기
- 수업에서 배운 자세를 다시 확인하기
- 선생님이 말한 자세를 복습하기
- 어려운 자세를 저장해두기

### 2.3 새로운 기회

요가 수업은 오프라인에서 끝나지만, 회원의 고민은 수업 밖에서 계속된다.

회원은 이런 고민을 가진다.

- 오늘 배운 자세가 기억나지 않음
- 집에서 무엇을 복습해야 할지 모름
- 특정 자세가 계속 어려움
- 몸에 불편감이 있는데 수련을 계속해도 되는지 궁금함
- 선생님에게 질문하고 싶지만 카카오톡으로 묻기 애매함
- 내 출석 횟수나 남은 수업 횟수를 확인하고 싶음

선생님은 이런 니즈를 가진다.

- 회원 출석을 편하게 관리하고 싶음
- 회원별 수업 이력을 확인하고 싶음
- 수업 후 복습 루틴을 공유하고 싶음
- 회원 질문과 컨디션을 기록해두고 싶음
- 반복되는 질문에 대한 답변 부담을 줄이고 싶음
- 단순 출석부가 아니라 수련 케어 도구가 필요함

---

## 3. 제품 정의

### 3.1 한 줄 정의

**ONMATOUT은 요가 선생님이 회원 출석을 관리하고, 수업에서 배운 아사나와 복습 루틴, 요가톡 AI 상담까지 이어갈 수 있는 요가 클래스 케어 앱이다.**

### 3.2 짧은 소개

온매트아웃은 요가 선생님과 회원을 수업 밖에서도 연결한다.  
선생님은 클래스를 만들고 회원을 등록하며 출석을 체크할 수 있다.  
회원은 수업에서 배운 아사나를 다시 확인하고, 선생님이 공유한 복습 루틴을 따라볼 수 있으며, 수련 중 생기는 고민을 요가톡 AI 또는 선생님에게 질문할 수 있다.

### 3.3 핵심 가치

- 선생님에게는 **회원 관리와 수련 케어 도구**
- 회원에게는 **수업 복습과 질문 공간**
- 앱 전체에는 **아사나 사전 기반의 요가 지식 플랫폼**
- AI 기능에는 **온매트아웃 데이터 기반 수련 도우미**

---

## 4. 목표 사용자

### 4.1 주요 사용자: 요가 선생님

대상:

- 개인 요가 강사
- 소규모 요가원 운영자
- 프리랜서 요가 선생님
- 1:1 또는 그룹 수업을 운영하는 강사
- 회원별 수련 상태를 관리하고 싶은 선생님

주요 니즈:

- 회원 출석 관리
- 남은 횟수 관리
- 수업별 회원 관리
- 수업 후 복습 루틴 공유
- 회원 질문 관리
- 회원별 수련 히스토리 확인
- 반복 질문에 대한 답변 부담 감소
- AI 답변 초안 활용

### 4.2 보조 사용자: 요가 회원

대상:

- 요가 수업을 듣는 수강생
- 수업에서 배운 자세를 복습하고 싶은 사람
- 집에서 무엇을 해야 할지 모르는 사람
- 선생님에게 가볍게 질문하고 싶은 사람
- AI에게 먼저 물어보고 싶은 사람
- 내 출석과 남은 횟수를 확인하고 싶은 사람

주요 니즈:

- 내 수업 일정 확인
- 출석 내역 확인
- 남은 수업 횟수 확인
- 복습 루틴 확인
- 아사나 사전 보기
- 요가톡 AI에게 질문하기
- 선생님께 질문 이어서 보내기

---

## 5. 제품 포지셔닝

### 5.1 기존 포지션

요가 아사나를 탐색하고 오늘 수련을 기록하는 앱

### 5.2 변경 포지션

요가 선생님과 회원을 연결하는 AI 클래스 케어 앱

### 5.3 핵심 메시지

- 수업은 끝났지만, 수련은 이어집니다.
- 선생님과 회원을 수업 밖에서도 연결합니다.
- 출석, 복습, 질문, 아사나 사전을 한 곳에서 관리하세요.
- 요가톡 AI가 수련 질문에 먼저 답하고, 필요하면 선생님에게 이어줍니다.
- 온매트아웃의 아사나 사전과 선생님의 루틴을 기반으로 더 정확한 수련 안내를 제공합니다.

---

## 6. 핵심 기능 요약

### 6.1 선생님 기능

- 선생님 회원가입 / 로그인
- 클래스 생성
- 회원 등록
- 회원별 수업권 / 횟수권 관리
- 출석 체크
- 회원별 출석 히스토리
- 아사나 사전 탐색
- 복습 루틴 생성
- 회원에게 루틴 공유
- 회원 질문 확인
- 질문 답변
- 답변에 아사나 카드 또는 루틴 첨부
- AI 답변 초안 확인
- AI 답변을 수정하여 회원에게 전송

### 6.2 회원 기능

- 회원가입 / 로그인
- 선생님 또는 클래스 연결
- 내 수업 확인
- 출석 내역 확인
- 남은 횟수 확인
- 선생님이 공유한 복습 루틴 확인
- 아사나 카드 보기
- 요가톡 AI에게 질문하기
- AI 답변 확인
- 선생님에게 질문 이어서 보내기
- 선생님 답변 확인
- 관심 아사나 저장

### 6.3 공통 기능

- 아사나 사전
- 아사나 검색
- 난이도 / 카테고리 / 부위 / 효과 필터
- 아사나 상세
- 즐겨찾기
- 최근 본 아사나
- 요가톡 AI
- RAG 기반 관련 아사나 추천

---

## 7. MVP 범위

MVP는 복잡한 요가원 운영 시스템이 아니라, **선생님 1명이 자신의 회원과 수업을 관리하고, 회원이 AI와 선생님을 통해 수련 질문을 이어갈 수 있는 가장 작은 클래스 케어 도구**를 목표로 한다.

### 7.1 MVP 포함 기능

#### Auth

- 전화번호 또는 이메일 기반 로그인
- 역할 선택
  - 선생님
  - 회원

#### 선생님

- 클래스 생성
- 회원 직접 등록
- 회원을 클래스에 배정
- 출석 체크
- 회원별 출석 내역 확인
- 회원별 남은 횟수 확인
- 아사나 사전 보기
- 루틴 생성
- 루틴을 특정 클래스 또는 특정 회원에게 공유
- 회원 질문 확인
- 질문 답변 작성
- 답변에 아사나 카드 첨부
- AI 답변 초안 보기

#### 회원

- 초대 코드 또는 링크로 선생님/클래스 연결
- 내 클래스 확인
- 내 출석 내역 확인
- 남은 횟수 확인
- 공유받은 루틴 보기
- 아사나 사전 보기
- 요가톡 AI에게 질문하기
- AI 답변 확인
- 선생님에게 이어서 질문 보내기
- 선생님 답변 확인

#### 아사나

- 아사나 목록
- 아사나 상세
- 검색
- 필터
- 즐겨찾기

#### AI / RAG

- 아사나 사전 데이터 임베딩
- 회원 질문 입력
- 관련 아사나 3~5개 검색
- AI 답변 생성
- 관련 아사나 카드 노출
- 선생님에게 질문 이어보내기

### 7.2 MVP 제외 기능

초기 개발 범위에서는 제외한다.

- 결제 기능
- 예약 기능
- 자동 알림
- 1:1 실시간 채팅
- 영상 업로드
- 사진 첨부 상담
- QR 출석 체크
- 요가원별 관리자 웹
- 정산 기능
- 강사 마켓플레이스
- Apple Health / Apple Watch 연동
- 회원별 장기 개인화 AI
- 선생님 말투 학습
- 실시간 음성 상담
- AI 영상 자세 분석

---

## 8. 주요 사용자 시나리오

### 8.1 선생님: 회원 등록 후 출석 체크

1. 선생님이 로그인한다.
2. 클래스를 생성한다. 예: 월수금 오전 하타요가
3. 회원을 등록한다.
4. 회원을 클래스에 배정한다.
5. 수업 당일 클래스 화면을 연다.
6. 회원 목록에서 출석 여부를 체크한다.
7. 출석 시 남은 횟수가 자동 차감된다.
8. 회원 상세에서 출석 히스토리를 확인한다.

### 8.2 선생님: 수업 후 복습 루틴 공유

1. 선생님이 수업 후 루틴 생성 화면을 연다.
2. 아사나 사전에서 오늘 배운 자세를 검색한다.
3. 자세를 루틴에 추가한다.
4. 순서를 정한다.
5. 각 자세의 권장 시간을 입력한다.
6. 루틴 제목을 입력한다. 예: 오늘의 골반 열기 복습 루틴
7. 특정 클래스 또는 특정 회원에게 공유한다.
8. 회원 앱에 복습 루틴이 표시된다.

### 8.3 회원: 수업 복습하기

1. 회원이 앱을 연다.
2. 홈에서 선생님이 공유한 복습 루틴을 확인한다.
3. 루틴 상세를 연다.
4. 각 아사나 카드의 설명과 키포인트를 확인한다.
5. 필요하면 관심 아사나로 저장한다.

### 8.4 회원: 요가톡 AI에게 질문하기

1. 회원이 요가톡 화면을 연다.
2. 질문을 입력한다. 예: "다운독 할 때 손목이 아파요."
3. 앱은 질문을 임베딩으로 변환한다.
4. Supabase pgvector에서 관련 아사나 문서를 검색한다.
5. 검색된 문서를 기반으로 AI 답변을 생성한다.
6. **AI 답변은 회원에게 즉시 노출된다**. 회원은 답변과 관련 아사나 카드를 확인한다.
7. 위험 카테고리(통증/불편감)인 경우 안전 문구가 강제 표시된다 (15장 참조).
8. 더 궁금하면 "선생님에게 이어서 질문하기"를 누른다 (status: `ai_answered` → `sent_to_teacher`).
9. 선생님은 회원이 받은 AI 답변과 질문을 함께 보고 답변한다.

### 8.5 선생님: 회원이 받은 AI 답변을 참고해 답변하기

1. 선생님이 큐에 들어온 회원 질문을 확인한다.
2. **회원이 이미 받은 AI 답변**을 함께 본다 (참고용).
3. 선생님은 자기 답변을 새로 작성하거나 AI 답변을 참고해 수정/보완한다.
4. 필요하면 아사나 카드 또는 루틴을 첨부한다.
5. 회원에게 선생님 답변이 전달된다 (status: `sent_to_teacher` → `teacher_answered`).
6. 회원이 7일간 추가 활동 없으면 자동 `closed` 처리.
7. 선생님이 3일 안에 답변하지 않으면 자동 리마인드 알림 (3일/7일).

---

## 9. 정보 구조 IA

### 9.0 역할 모드 토글 (다중 역할 사용자 대응)

한 사용자가 선생님 + 회원 역할을 동시에 가질 수 있으므로 앱은 모드 기반으로 탭 구조가 전환된다.

- 헤더 또는 프로필 영역에 **"선생님 모드 / 회원 모드"** 토글 노출
- 단일 역할 사용자(예: 회원만)는 토글 숨김 — 해당 역할 화면만 표시
- 마지막 선택한 모드를 로컬 저장 → 다음 진입 시 동일 모드로 시작
- 모드 전환은 즉시 적용 (별도 재로그인 불필요)

### 9.1 선생님 앱 탭 구조

- 홈
- 클래스
- 회원
- 아사나
- 요가톡
- 프로필

#### 홈

- 오늘 수업
- 오늘 출석 체크 필요 클래스
- 새 질문
- 최근 공유한 루틴
- 이번 주 출석 요약

#### 클래스

- 클래스 목록
- 클래스 상세
- 클래스별 회원
- 클래스별 출석
- 클래스별 공유 루틴

#### 회원

- 회원 목록
- 회원 상세
- 출석 히스토리
- 남은 횟수
- 질문 히스토리
- 공유받은 루틴

#### 아사나

- 아사나 목록
- 검색
- 필터
- 상세
- 루틴에 추가

#### 요가톡

- 회원 질문 목록
- AI 답변 초안
- 답변 작성
- 아사나 카드 첨부
- 루틴 첨부

#### 프로필

- 선생님 정보
- 수업 장소
- 알림 설정
- 계정 설정

### 9.2 회원 앱 탭 구조

- 홈
- 내 수업
- 아사나
- 요가톡
- 프로필

#### 홈

- 다음 수업
- 남은 횟수
- 선생님이 공유한 복습 루틴
- 최근 본 아사나
- 요가톡 답변 알림

#### 내 수업

- 연결된 클래스
- 출석 내역
- 남은 횟수
- 공유 루틴

#### 아사나

- 아사나 사전
- 검색
- 필터
- 즐겨찾기
- 최근 본 자세

#### 요가톡

- AI에게 질문하기
- AI 답변 확인
- 선생님에게 이어서 질문하기
- 질문 목록
- 답변 확인

#### 프로필

- 회원 정보
- 연결된 선생님
- 계정 설정

---

## 10. 상세 기능 요구사항

### 10.1 Auth

#### 기능

- **다중 역할 지원**: 한 계정이 선생님 + 회원 역할을 동시에 가질 수 있다.
- 가입 시 1개 이상의 역할을 선택한다 (선생님 / 회원 / 둘 다).
- 가입 후에도 역할 추가/해제 가능.
- 역할에 따라 앱 진입 시 모드 토글로 탭 구조가 전환된다 (9.0 참조).
- 회원은 자동 매칭 또는 초대 코드를 통해 선생님과 연결된다 (10.3 참조).

#### users 필드 (계정 정보, 역할 컬럼 제거)

- id
- name
- phone
- email
- profile_image_url
- created_at
- updated_at

#### user_roles 필드 (다중 역할, 신규)

- user_id (FK users)
- role (`teacher` | `student`)
- created_at
- PK: (user_id, role)

#### teacher_profiles 필드 (선생님 부가 정보)

- id
- user_id (FK users, UNIQUE)
- studio_name
- bio
- location
- instagram_url
- website_url
- cancellation_hours_before INT default 24  -- 회원 셀프 취소 가능 시점
- created_at
- updated_at

---

### 10.2 클래스 관리

#### 기능

선생님은 클래스를 생성하고 관리할 수 있다.
"월수금 오전 하타요가" 같은 정기 수업은 **1개 클래스 + 다중 스케줄**로 표현한다 (요일별로 다른 시간도 가능).

#### classes 필드 (요일/시간 컬럼 제거)

- id
- teacher_id (FK users)
- title
- description
- location
- capacity
- is_active
- created_at
- updated_at

#### class_schedules 필드 (신규)

- id
- class_id (FK classes)
- day_of_week (0=일 ~ 6=토, ISO 호환)
- start_time
- end_time
- created_at

예시: "월수금 오전 하타요가"
```
classes: { id: 1, title: "월수금 오전 하타요가" }
class_schedules:
  - { class_id: 1, day_of_week: 1, start_time: "07:00", end_time: "08:00" }
  - { class_id: 1, day_of_week: 3, start_time: "07:00", end_time: "08:00" }
  - { class_id: 1, day_of_week: 5, start_time: "07:00", end_time: "08:00" }
```

#### 주요 화면

- 클래스 목록
- 클래스 생성 (요일 다중 선택 + 요일별 시간)
- 클래스 상세
- 클래스 수정
- 클래스별 회원 목록
- 클래스별 출석 체크 (오늘 날짜에 해당하는 스케줄 기준)

---

### 10.3 회원 관리

#### 기능

선생님은 회원을 직접 등록할 수 있다.
회원이 앱에 가입하지 않아도 등록 가능 — 나중에 회원이 가입하면 초대 코드(또는 전화번호 자동 매칭)로 기존 데이터와 연결된다.

#### 등록 시 입력 정책

- **이름**: 필수
- **전화번호**: Optional (선생님이 모를 수 있음)
- **메모**: Optional
- 전화번호 입력 시 **개인정보 동의 체크박스** 노출 (PIPA 대응)

#### student_profiles 필드

- id
- teacher_id (FK users) — 등록한 선생님
- user_id nullable (FK users) — 회원 가입 시 채워짐
- name (필수)
- phone nullable
- phone_consent_at nullable — 전화번호 동의 시점
- invite_code (전역 유니크) — 예: "ONM-A7K2"
- invite_code_used_at nullable — 사용 시 채움 (= 무효화)
- memo
- status (`active` | `paused` | `archived`)
- created_at
- updated_at

#### teacher_students 필드 (N:M 관계, 신규)

- teacher_id (FK users)
- student_profile_id (FK student_profiles)
- status (`active` | `paused` | `archived`)
- created_at
- PK: (teacher_id, student_profile_id)

#### 초대 코드 규칙

- 전역 유니크 (시스템 전체에서 유일)
- 1회용 (사용 시 `invite_code_used_at` 채워지면서 무효)
- 포맷: `ONM-XXXX` — 헷갈리는 0/O, 1/I/L 제외
- 회원 카드당 1개, 동명이인도 별도 카드/별도 코드

#### 회원 가입 → 매칭 흐름 (MVP)

```
1. 회원이 앱에서 가입 (전화번호 + OTP)
2. 자동 매칭 시도:
   - student_profiles.phone == 가입 phone AND user_id IS NULL → 후보 추출
3. 후보 있음 → "00 요가원 김선생님이 회원님을 등록했어요. 맞으신가요?"
   - [수락] → student_profiles.user_id 채움, invite_code 무효화
   - [거절] → 매칭 안 함
4. 후보 없음 OR 거절 → "초대 코드 입력" 화면
   - 코드 입력 → 매칭 → user_id 채움
5. 프로필에 "선생님이 입력한 내 정보 보기/삭제" 메뉴 노출
```

`attendance.student_id` → `student_profiles.id` 이므로 `user_id` 채우는 순간 그동안의 출석 내역이 회원에게 자동 노출. 별도 마이그레이션 불필요.

#### 회원 상태

- active
- paused
- archived

> Phase 2 추가 연결 방법: 회원 셀프 신청(코드 잃어버린 경우), 선생님 사후 매칭(대시보드에서 신규 가입자 선택)

---

### 10.4 수업권 관리

#### 기능

선생님은 회원별로 수업권을 관리할 수 있다. 한국 요가원 현실에 맞춰 3가지 타입을 지원한다.

#### 수업권 타입

- **횟수권 (`count`)**: 10회권, 20회권 등. 기본 2개월 유효기간 (선생님이 연장/단축 가능).
- **기간권 + 주N회 (`period_weekly`)**: 한달권, 주2회 / 주3회 등. 시간에 슬롯이 묶임.
- **기간권 무제한 (`period_unlimited`)**: 기간 내 횟수 제한 없음.

#### memberships 필드

- id
- student_id (FK student_profiles)
- class_id nullable (FK classes)
- type (`count` | `period_weekly` | `period_unlimited`)
- total_count nullable — 횟수권일 때 (예: 10)
- used_count default 0 — 실제 차감된 횟수/슬롯
- weekly_limit nullable — 기간권+주N회일 때 (예: 2)
- start_date
- end_date — 횟수권은 기본 = start_date + 2개월
- status (`active` | `expired` | `paused`)
- created_at
- updated_at

#### MVP 정책

- 결제 기능 없음 → 선생님이 수동으로 수업권 발급/연장 (오프라인 결제 가정)
- "10회권 등록" 폼: 타입 선택 → 회수/주N회/유효기간 입력
- 차감 정책은 10.5 출석 정책 참조
- 만료 후: `status = 'expired'`, 추가 출석 등록 불가, 잔여 횟수 보존(기록용)
- 횟수권 만료일 수동 연장 가능

---

### 10.5 출석 체크

#### 기능

선생님은 클래스별로 회원 출석을 체크할 수 있다. 회원도 셀프로 수업을 취소할 수 있다.

#### 출석 상태

- `present`: 출석
- `late`: 지각
- `makeup`: 보강
- `absent`: 결석
- `canceled`: 취소 (회원 셀프 또는 선생님 처리)

#### attendance 필드

- id
- teacher_id (FK users)
- student_id (FK student_profiles)
- class_id (FK classes)
- attendance_date
- status
- source (`teacher_manual` | `student_cancel` | `system_auto`)
- deducted boolean — 실제 차감 여부
- memo
- created_at
- updated_at

#### 차감 정책 (수업권 타입별)

| 수업권 | present/late/makeup | absent | canceled |
|--------|--------------------|---------|---------|
| 횟수권 (`count`) | ✅ 1회 차감 | ❌ 차감 안 함 | ❌ 차감 안 함 |
| 기간권+주N회 (`period_weekly`) | ✅ 슬롯 1개 차감 | ✅ 슬롯 1개 차감 | ✅ 슬롯 1개 차감 |
| 기간권 무제한 (`period_unlimited`) | 차감 로직 없음 | 차감 로직 없음 | 차감 로직 없음 |

**원리**: 횟수권은 횟수만 제한(시간 무관) → 잔여 보존. 기간권+주N회는 시간 슬롯 제한 → 안 가면 슬롯 소멸.

#### 자동 결석 마감 (cron)

- **매주 일요일 23:59**에 시스템이 자동 실행
- 대상: 기간권+주N회 회원의 그 주 채워지지 않은 슬롯
- 처리: `status='absent'`, `source='system_auto'` 로 attendance row 자동 생성 + 슬롯 차감
- 횟수권은 대상 아님 (시간 무관, 차감도 안 됨)
- 주 단위 기준: **월요일 시작** (ISO 표준)

#### 회원 셀프 취소

- 회원 앱에 "다음 수업 취소" 버튼
- 취소 가능 시점: `teacher_profiles.cancellation_hours_before` (기본 24시간)
- 정책 시간 이후 취소 불가 → 못 오면 cron이 absent로 자동 처리
- 셀프 취소 attendance row는 `source='student_cancel'`

#### 출석 + 차감 트랜잭션 (Supabase RPC)

- `mark_attendance(student_id, class_id, date, status)`: 정책 확인 → 슬롯 검증 → 차감 → row 생성 (한 트랜잭션)
- `cancel_attendance(attendance_id)`: 출석 → 취소로 변경 시 차감 자동 복구
- 횟수권 만료된 회원은 출석 등록 불가 (에러 반환)

---

### 10.6 아사나 사전

#### 기능

기존 온매트아웃의 핵심 기능으로 유지한다.  
사용자는 아사나를 검색하고 상세 정보를 확인할 수 있다.

#### Asana 필드

- id
- korean_name
- sanskrit_name
- english_name
- description
- key_point
- benefits
- cautions
- meaning
- difficulty
- category
- posture_type
- movement_type
- body_parts
- image_url
- created_at
- updated_at

#### 주요 기능

- 이름 검색
- 난이도 필터
- 카테고리 필터
- 부위 필터
- 효과 필터
- 즐겨찾기
- 최근 본 아사나
- 루틴에 추가
- 요가톡 AI 관련 카드로 노출

---

### 10.7 루틴 빌더

#### 기능

선생님은 아사나 사전에서 자세를 선택하여 복습 루틴을 만들 수 있다.

#### Routine 필드

- id
- teacher_id
- title
- description
- visibility
  - private
  - class_shared
  - student_shared
- created_at
- updated_at

#### RoutineItem 필드

- id
- routine_id
- asana_id
- order_index
- duration_seconds
- memo
- created_at
- updated_at

#### 주요 기능

- 루틴 생성
- 아사나 추가
- 순서 변경
- 자세별 시간 설정
- 메모 추가
- 클래스에 공유
- 특정 회원에게 공유
- 요가톡 답변에 루틴 첨부

---

### 10.8 요가톡

#### 기능

요가톡은 회원이 수련 중 생기는 질문을 남기고, AI 또는 선생님에게 답변을 받을 수 있는 수련 대화 기능이다.

#### MVP 방식

MVP에서는 카카오톡 같은 실시간 채팅이 아니라, **질문/답변형 비동기 대화**로 구현한다.

#### 요가톡 질문 카테고리

- pose_difficulty: 자세가 어려워요
- discomfort: 통증/불편감이 있어요
- routine_request: 복습 루틴이 필요해요
- class_question: 수업 관련 질문
- condition: 컨디션/마음 상태
- etc: 기타

#### 질문 상태 및 자동 전이

```
ai_answered          ← 질문 작성 + AI 답변 자동 생성 (즉시 회원 노출)
   ↓ 회원이 "선생님에게 이어서" 클릭
sent_to_teacher      ← 선생님 큐 진입, 3일/7일 후 미응답 시 자동 리마인드
   ↓ 선생님 답변 작성
teacher_answered     ← 회원 알림 발송
   ↓ 회원 마지막 활동 + 7일 무활동 OR 회원이 "해결됐어요"
closed
```

- AI 답변은 회원에게 **즉시 노출** (선생님 검토 대기 없음)
- 위험 카테고리(통증/불편감)도 즉시 노출되지만 15장 안전 문구가 강제 표시됨
- "AI 답변 초안" 표현은 사용하지 않음 — 회원이 받은 것 = 선생님이 보는 것 (참고용)

#### yoga_talk_threads 필드

- id
- teacher_id (FK users)
- student_id (FK student_profiles)
- class_id nullable
- category
- title
- status
- last_activity_at — 자동 종결 판정용 (메시지/조회 시 갱신)
- reminder_count default 0 — 선생님 리마인드 발송 횟수
- closed_at nullable
- created_at
- updated_at

#### YogaTalkMessage 필드

- id
- thread_id
- sender_type
  - student
  - ai
  - teacher
- sender_id nullable
- body
- created_at
- updated_at

#### YogaTalkAttachment 필드

- id
- message_id
- attachment_type
  - asana
  - routine
- attachment_id
- created_at

#### 주요 기능

- 회원 질문 작성
- AI 답변 생성
- AI 답변 저장
- 관련 아사나 카드 첨부
- 관련 루틴 첨부
- 선생님에게 이어서 질문하기
- 선생님 답변 작성
- 회원별 요가톡 히스토리

---

### 10.9 요가톡 AI

#### 정의

요가톡 AI는 회원이 수련 중 생기는 질문을 입력하면, 온매트아웃의 아사나 사전과 선생님이 공유한 루틴을 기반으로 기본 안내를 제공하는 AI 수련 도우미다.

답변에는 관련 아사나 카드와 복습 루틴을 함께 제안할 수 있으며, 필요 시 선생님에게 질문을 이어서 보낼 수 있다.

#### 목적

- 회원이 수업 밖에서도 궁금한 점을 바로 해소할 수 있게 한다.
- 선생님의 반복 답변 부담을 줄인다.
- 아사나 사전과 루틴 콘텐츠 활용도를 높인다.
- 선생님과 회원의 연결성을 강화한다.

#### AI가 답변하기 좋은 영역

- 자세 이름 설명
- 자세 효과
- 기본 키포인트
- 주의사항
- 초보자용 변형
- 수업 복습 루틴 추천
- 상황별 가벼운 루틴 추천
- 아사나 비교
  - 예: 코브라와 업독 차이

#### AI가 조심해야 하는 영역

- 통증 진단
- 부상 치료
- 심리 상담
- 임신/질환 관련 수련
- 특정 질병에 대한 처방
- “이 자세 해도 되나요?”에 대한 확정적 답변

#### 답변 톤

AI는 단정하거나 처방하듯 말하지 않는다.  
다음 표현을 우선 사용한다.

- “이런 점을 확인해보세요”
- “범위를 줄여보세요”
- “선생님에게 확인해보세요”
- “통증이 지속되면 전문가와 상담하세요”

#### 안전 문구

통증/불편감 카테고리에는 다음 안내 문구를 표시한다.

> 온매트아웃의 요가톡 AI는 요가 수련을 위한 일반적인 안내를 제공하며, 의료 진단이나 치료를 대체하지 않습니다. 통증이 지속되거나 심한 경우 전문가와 상담하세요.

---

### 10.10 RAG

#### 정의

RAG는 Retrieval-Augmented Generation의 약자로, 사용자의 질문에 답변하기 전 온매트아웃의 내부 지식 문서를 검색하고, 검색된 정보를 바탕으로 AI 답변을 생성하는 구조다.

온매트아웃에서는 다음 데이터를 RAG의 지식 기반으로 사용한다.

1. 아사나 사전
2. 선생님 루틴
3. 선생님 메모
4. 자주 묻는 질문
5. 추후 회원별 수련 맥락

#### RAG v1 대상 데이터

MVP에서는 아사나 사전만 RAG에 포함한다.

포함 데이터:

- 아사나 이름
- 산스크리트어 이름
- 영어 이름
- 설명
- 키포인트
- 효과
- 주의사항
- 난이도
- 카테고리
- 부위
- 움직임 타입

#### RAG v2 대상 데이터

- 선생님 루틴
- 루틴 설명
- 포함 아사나
- 자세별 시간
- 선생님 메모
- 공유 대상 클래스

#### RAG v3 대상 데이터

- 회원이 속한 클래스
- 최근 공유받은 루틴
- 최근 질문 이력
- 저장한 아사나
- 최근 본 아사나
- 출석 이력 요약

#### RAG 처리 흐름

```txt
회원 질문
  ↓
질문을 embedding으로 변환
  ↓
Supabase pgvector에서 관련 아사나/루틴 검색
  ↓
검색된 문서 3~8개를 AI 프롬프트에 삽입
  ↓
AI가 온매트아웃 데이터 기반으로 답변
  ↓
관련 아사나 카드 / 루틴 함께 반환
  ↓
필요하면 선생님에게 질문 이어서 전송
```

#### KnowledgeDocument 필드

- id
- source_type
  - asana
  - routine
  - teacher_note
  - faq
- source_id
- title
- content
- metadata
- embedding
- created_at
- updated_at

#### 검색 결과 반환값

AI 답변 API는 다음 값을 반환한다.

- answer
- related_asanas
- related_routines
- safety_notice_required
- should_recommend_teacher
- retrieved_document_ids

#### 답변 생성 정책

AI는 반드시 검색된 문서를 우선 참고한다.  
검색된 문서에 없는 내용을 단정하지 않는다.  
불확실한 경우 선생님에게 확인하도록 안내한다.  
의료 진단, 치료, 처방을 하지 않는다.

---

### 10.11 저장함 / 즐겨찾기

#### 기능

회원과 선생님은 아사나를 저장할 수 있다.

#### 저장 타입

- favorite: 좋아요
- want_to_learn: 배우고 싶어요
- difficult: 어려워요
- class_pose: 수업에서 했어요
- review_later: 나중에 다시 볼래요

#### SavedAsana 필드

- id
- user_id
- asana_id
- save_type
- memo
- created_at

---

## 11. 권한 정책

### 11.1 선생님

선생님은 다음 데이터를 관리할 수 있다.

- 본인이 생성한 클래스
- 본인이 등록한 회원
- 본인 클래스의 출석
- 본인 회원의 질문
- 본인이 만든 루틴
- 본인이 공유한 루틴
- 본인 회원의 요가톡 스레드
- AI 답변 초안

### 11.2 회원

회원은 다음 데이터를 볼 수 있다.

- 본인 프로필
- 본인의 출석 내역
- 본인에게 공유된 루틴
- 본인의 질문과 답변
- 본인의 요가톡 AI 답변
- 공개 아사나 사전
- 본인의 저장 아사나

### 11.3 관리자

관리자는 다음 데이터를 관리할 수 있다.

- 전체 아사나 데이터
- RAG 지식 문서
- 신고된 질문/답변
- 사용자 계정 상태
- 서비스 공지
- 운영 통계

---

## 12. 데이터베이스 초안

### users (변경: role 컬럼 제거)

- id
- name
- phone
- email
- profile_image_url
- created_at
- updated_at

### user_roles (신규 — 다중 역할 지원)

- user_id (FK users)
- role (`teacher` | `student`)
- created_at
- PK: (user_id, role)

### teacher_profiles (변경: cancellation_hours_before 추가)

- id
- user_id (FK users, UNIQUE)
- studio_name
- bio
- location
- instagram_url
- website_url
- cancellation_hours_before INT default 24
- created_at
- updated_at

### student_profiles (변경: invite_code, phone_consent_at 추가)

- id
- teacher_id (FK users)
- user_id nullable (FK users)
- name (필수)
- phone nullable
- phone_consent_at nullable
- invite_code (UNIQUE 전역)
- invite_code_used_at nullable
- memo
- status (`active` | `paused` | `archived`)
- created_at
- updated_at

### teacher_students (신규 — N:M 관계)

- teacher_id (FK users)
- student_profile_id (FK student_profiles)
- status (`active` | `paused` | `archived`)
- created_at
- PK: (teacher_id, student_profile_id)

### classes (변경: day_of_week / start_time / end_time 제거)

- id
- teacher_id (FK users)
- title
- description
- location
- capacity
- is_active
- created_at
- updated_at

### class_schedules (신규 — 클래스별 요일/시간)

- id
- class_id (FK classes)
- day_of_week (0=일 ~ 6=토)
- start_time
- end_time
- created_at

### class_students

- id
- class_id (FK classes)
- student_id (FK student_profiles)
- joined_at
- status

### memberships (변경: type 재정의, weekly_limit 추가, remaining_count 제거)

- id
- student_id (FK student_profiles)
- class_id nullable (FK classes)
- type (`count` | `period_weekly` | `period_unlimited`)
- total_count nullable
- used_count default 0
- weekly_limit nullable
- start_date
- end_date — 횟수권 기본 = start_date + 2개월
- status (`active` | `expired` | `paused`)
- created_at
- updated_at

> `remaining_count`는 계산값(`total_count - used_count`)으로 view 또는 클라이언트 계산

### attendance (변경: source 추가, deducted_count → deducted boolean)

- id
- teacher_id (FK users)
- student_id (FK student_profiles)
- class_id (FK classes)
- attendance_date
- status (`present` | `late` | `makeup` | `absent` | `canceled`)
- source (`teacher_manual` | `student_cancel` | `system_auto`)
- deducted boolean
- memo
- created_at
- updated_at

### asanas

- id
- korean_name
- sanskrit_name
- english_name
- description
- key_point
- benefits
- cautions
- meaning
- difficulty
- category
- posture_type
- movement_type
- body_parts
- image_url
- created_at
- updated_at

### routines

- id
- teacher_id
- title
- description
- visibility
- created_at
- updated_at

### routine_items

- id
- routine_id
- asana_id
- order_index
- duration_seconds
- memo
- created_at
- updated_at

### routine_shares

- id
- routine_id
- teacher_id
- class_id nullable
- student_id nullable
- shared_at
- created_at

### yoga_talk_threads (변경: last_activity_at, reminder_count, closed_at 추가)

- id
- teacher_id (FK users)
- student_id (FK student_profiles)
- class_id nullable
- category
- title
- status (`ai_answered` | `sent_to_teacher` | `teacher_answered` | `closed`)
- last_activity_at — 자동 종결 판정용
- reminder_count default 0 — 선생님 리마인드 발송 횟수
- closed_at nullable
- created_at
- updated_at

### yoga_talk_messages

- id
- thread_id
- sender_type
- sender_id nullable
- body
- created_at
- updated_at

### yoga_talk_attachments

- id
- message_id
- attachment_type
- attachment_id
- created_at

### knowledge_documents

- id
- source_type
- source_id
- title
- content
- metadata
- embedding
- created_at
- updated_at

### ai_answer_logs

- id
- user_id
- thread_id nullable
- question
- answer
- retrieved_document_ids
- related_asana_ids
- related_routine_ids
- safety_notice_required
- should_recommend_teacher
- created_at

### saved_asanas

- id
- user_id
- asana_id
- save_type
- memo
- created_at

---

## 13. 화면 목록

### 13.1 공통

- 스플래시
- 온보딩
- 로그인
- 회원가입
- 역할 선택
- 프로필 설정
- 아사나 목록
- 아사나 상세
- 아사나 검색
- 아사나 필터
- 즐겨찾기

### 13.2 선생님

- 선생님 홈
- 오늘 수업 목록
- 클래스 목록
- 클래스 생성
- 클래스 상세
- 클래스 수정
- 회원 목록
- 회원 등록
- 회원 상세
- 출석 체크
- 출석 히스토리
- 루틴 목록
- 루틴 생성
- 루틴 상세
- 루틴 공유
- 요가톡 질문 목록
- 요가톡 상세
- AI 답변 초안 확인
- 답변 작성

### 13.3 회원

- 회원 홈
- 내 수업
- 출석 내역
- 남은 횟수
- 공유받은 루틴 목록
- 루틴 상세
- 요가톡 AI 질문 작성
- AI 답변 상세
- 선생님에게 이어서 질문하기
- 요가톡 목록
- 선생님 답변 상세
- 저장한 아사나

### 13.4 관리자

- 아사나 관리
- RAG 문서 관리
- AI 답변 로그
- 신고 관리
- 사용자 관리

---

## 14. 핵심 UX 원칙

### 14.1 선생님은 빠르게 처리할 수 있어야 한다

출석 체크는 수업 전후에 빠르게 해야 한다.  
따라서 출석 체크 화면은 한 손으로 빠르게 조작할 수 있어야 한다.

### 14.2 회원은 부담 없이 질문할 수 있어야 한다

질문 작성은 카카오톡보다 정돈되어야 하지만, 상담 신청서처럼 무거워서는 안 된다.  
카테고리 선택 후 짧게 남길 수 있어야 한다.

### 14.3 AI는 선생님을 대체하지 않는다

요가톡 AI는 선생님을 대체하는 기능이 아니다.  
AI는 회원의 기본 질문에 먼저 답하고, 필요한 경우 선생님에게 자연스럽게 연결하는 역할이다.

### 14.4 아사나 사전은 항상 연결되어야 한다

선생님 답변, 루틴, 수업 복습, AI 답변, 저장함에서 아사나 카드로 바로 연결되어야 한다.

### 14.5 기록보다 연결이 중요하다

회원이 직접 기록하게 만들기보다, 선생님이 공유하고 회원이 확인하는 구조를 우선한다.

### 14.6 의료적 표현을 피한다

통증과 불편감은 다룰 수 있지만 진단, 치료, 처방처럼 보이면 안 된다.

---

## 15. AI 안전 정책

### 15.1 금지 표현

AI는 다음 표현을 피해야 한다.

- 진단합니다
- 치료됩니다
- 처방합니다
- 반드시 해야 합니다
- 이 자세를 해도 괜찮습니다
- 병원에 가지 않아도 됩니다

### 15.2 권장 표현

AI는 다음 표현을 사용한다.

- 범위를 줄여보세요
- 불편하면 멈춰주세요
- 선생님에게 확인해보세요
- 통증이 지속되면 전문가와 상담하세요
- 일반적인 수련 안내로 참고해주세요

### 15.3 위험 질문 처리

다음 질문은 AI가 답변을 제한하고 선생님 또는 전문가 상담을 권한다.

- 심한 통증
- 부상
- 임신
- 수술 후 회복
- 질환
- 정신건강 위기
- 약물/치료 관련 질문

---

## 16. 알림 정책

MVP에서는 알림 기능을 제외할 수 있지만, 추후 확장 시 다음 알림이 필요하다.

### 선생님 알림

- 새 질문 도착
- 오늘 출석 체크 필요
- 회원 수업권 만료 예정
- 회원 남은 횟수 부족
- AI가 선생님 연결을 추천한 질문

### 회원 알림

- AI 답변 생성 완료
- 선생님 답변 도착
- 새 루틴 공유
- 다음 수업 안내
- 남은 횟수 부족

---

## 17. 운영 정책

### 17.1 상담 관련 고지

서비스 내 요가톡 AI와 수련 상담은 요가 수련에 대한 일반적인 안내이며, 의료 진단이나 치료를 대체하지 않는다.

### 17.2 개인정보

회원의 전화번호, 출석 이력, 질문 내용은 민감할 수 있으므로 선생님과 해당 회원만 접근할 수 있어야 한다.

### 17.3 AI 답변 로그

AI 답변은 품질 개선과 안전 검토를 위해 저장할 수 있다.  
단, 개인정보 처리방침에 AI 답변 로그 저장 목적과 보관 기간을 명시해야 한다.

### 17.4 탈퇴

회원 탈퇴 시 개인 계정은 삭제하되, 선생님의 출석 관리 기록은 법적/운영상 필요한 범위 내에서 익명화 또는 보관 정책에 따라 처리한다.

---

## 18. 성공 지표

### 18.1 선생님 지표

- 가입 선생님 수
- 클래스 생성 수
- 등록 회원 수
- 주간 출석 체크 수
- 루틴 생성 수
- 루틴 공유 수
- 질문 답변 수
- AI 답변 초안 사용률

### 18.2 회원 지표

- 초대 수락률
- 주간 활성 회원 수
- 공유 루틴 조회율
- 요가톡 AI 질문 수
- 선생님에게 이어서 질문한 비율
- 선생님 답변 확인율
- 아사나 상세 조회 수

### 18.3 AI / RAG 지표

- AI 답변 생성 수
- 질문당 평균 검색 문서 수
- 관련 아사나 클릭률
- AI 답변 후 선생님 연결률
- 위험 질문 감지 수
- 답변 만족도
- 답변 신고 수

### 18.4 서비스 지표

- 선생님 1명당 평균 회원 수
- 선생님 1명당 월간 출석 체크 수
- 루틴 공유 후 회원 조회율
- 질문 답변 완료율
- 4주 후 선생님 유지율

---

## 19. 단계별 개발 계획

### Phase 1. 클래스 관리 MVP

목표: 선생님이 회원과 출석을 관리할 수 있다.

포함 기능:

- 선생님/회원 역할 기반 가입
- 클래스 생성
- 회원 직접 등록
- 회원 클래스 배정
- 출석 체크
- 회원별 출석 내역
- 남은 횟수 관리
- 아사나 사전 기본 기능

### Phase 2. 복습 루틴

목표: 선생님이 수업 후 복습 루틴을 공유할 수 있다.

포함 기능:

- 루틴 생성
- 아사나 추가
- 순서 변경
- 시간 설정
- 클래스/회원별 루틴 공유
- 회원 루틴 조회

### Phase 3. 요가톡 v1

목표: 회원이 질문하고 선생님이 답변할 수 있다.

포함 기능:

- 질문 작성
- 질문 카테고리
- 선생님 질문함
- 답변 작성
- 아사나 카드 첨부
- 루틴 첨부
- 회원별 요가톡 히스토리

### Phase 4. RAG 기반 요가톡 AI

목표: 회원 질문에 대해 아사나 사전 기반 AI 답변을 제공한다.

포함 기능:

- 아사나 데이터 knowledge_documents 생성
- embedding 저장
- 질문 embedding
- pgvector 유사도 검색
- AI 답변 생성
- 관련 아사나 카드 추천
- 선생님에게 이어서 질문하기

### Phase 5. 성장 기능

목표: 선생님과 회원이 계속 쓰는 이유를 강화한다.

포함 기능:

- 푸시 알림
- QR 출석 체크
- 회원 초대 링크 개선
- 수업권 만료 알림
- 루틴 완료 체크
- 요가원/선생님 프로필 공개 페이지
- 간단한 결제 또는 외부 결제 링크 연결
- 루틴 RAG
- 회원 맥락 기반 개인화 RAG

---

## 20. 추천 기술 구조

### 20.1 앱

- React Native
- Expo
- React Navigation
- Zustand
- NativeWind

### 20.2 백엔드

- Supabase Auth
- Supabase Database
- Supabase Storage
- Supabase Edge Functions
- Supabase Realtime, 추후 채팅 고도화 시

### 20.3 AI / RAG

- OpenAI Chat Model
- OpenAI Embedding Model
- Supabase pgvector
- Edge Function 기반 AI API
- knowledge_documents 테이블
- ai_answer_logs 테이블

### 20.4 RAG API 흐름

```txt
POST /yoga-talk/ai-answer

Request:
- user_id
- question
- class_id nullable
- teacher_id nullable

Process:
1. 질문 안전성 1차 분류
2. 질문 embedding 생성
3. knowledge_documents 검색
4. 관련 문서 추출
5. AI 답변 생성
6. 관련 아사나/루틴 정리
7. ai_answer_logs 저장
8. 응답 반환

Response:
- answer
- related_asanas
- related_routines
- safety_notice_required
- should_recommend_teacher
```

---

## 21. React Native 프로젝트 구조 제안

```txt
ONMATOUT/
├── app/
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── TeacherNavigator.tsx
│   │   ├── StudentNavigator.tsx
│   │   └── index.tsx
│   ├── screens/
│   │   ├── Auth/
│   │   ├── Teacher/
│   │   │   ├── Home/
│   │   │   ├── Classes/
│   │   │   ├── Students/
│   │   │   ├── Attendance/
│   │   │   ├── Routines/
│   │   │   └── YogaTalk/
│   │   ├── Student/
│   │   │   ├── Home/
│   │   │   ├── MyClasses/
│   │   │   ├── Routines/
│   │   │   └── YogaTalk/
│   │   ├── Asana/
│   │   └── Profile/
│   ├── components/
│   │   ├── AsanaCard.tsx
│   │   ├── ClassCard.tsx
│   │   ├── StudentCard.tsx
│   │   ├── AttendanceRow.tsx
│   │   ├── RoutineCard.tsx
│   │   ├── YogaTalkMessage.tsx
│   │   ├── AIAnswerCard.tsx
│   │   └── common/
│   ├── stores/
│   │   ├── userStore.ts
│   │   ├── teacherStore.ts
│   │   ├── studentStore.ts
│   │   ├── classStore.ts
│   │   ├── attendanceStore.ts
│   │   ├── asanaStore.ts
│   │   ├── routineStore.ts
│   │   └── yogaTalkStore.ts
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   ├── aiClient.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTeacher.ts
│   │   ├── useStudent.ts
│   │   ├── useAttendance.ts
│   │   ├── useRoutines.ts
│   │   └── useYogaTalk.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── teacher.ts
│   │   ├── student.ts
│   │   ├── class.ts
│   │   ├── attendance.ts
│   │   ├── asana.ts
│   │   ├── routine.ts
│   │   ├── yogaTalk.ts
│   │   └── ai.ts
│   ├── constants/
│   │   ├── attendanceStatus.ts
│   │   ├── yogaTalkCategories.ts
│   │   ├── asanaCategories.ts
│   │   └── roles.ts
│   └── assets/
│       ├── images/
│       └── icons/
├── supabase/
│   ├── functions/
│   │   ├── yoga-talk-ai-answer/
│   │   └── sync-knowledge-documents/
│   └── migrations/
├── .env
├── tailwind.config.js
├── tsconfig.json
├── app.json
└── package.json
```

---

## 22. 우선 개발해야 할 화면

1. 역할 선택 / 로그인
2. 선생님 홈
3. 클래스 목록 / 생성
4. 회원 목록 / 등록
5. 출석 체크
6. 회원 상세
7. 아사나 목록 / 상세
8. 루틴 생성
9. 루틴 공유
10. 회원 요가톡 AI 질문 작성
11. AI 답변 화면
12. 선생님에게 이어서 질문하기
13. 선생님 요가톡 질문함
14. 선생님 답변 작성

---

## 23. 최종 정리

ONMATOUT의 피벗 방향은 개인 기록 앱이 아니다.

새로운 방향은 다음과 같다.

> **요가 선생님이 회원 출석을 관리하고, 수업에서 배운 아사나와 복습 루틴, 요가톡 AI 질문까지 이어갈 수 있는 AI 클래스 케어 앱**

이 방향은 기존의 아사나 사전 반응을 살리면서도, 일반 유저의 기록 부담을 줄인다.  
또한 선생님을 통해 회원 유입이 일어나는 B2B2C 구조를 만들 수 있다.

핵심은 다음 네 가지다.

1. **출석 관리**
2. **아사나 기반 복습 루틴**
3. **요가톡 질문/답변**
4. **RAG 기반 요가톡 AI**

온매트아웃은 "요가를 혼자 기록하는 앱"에서 벗어나,
**요가 선생님과 회원이 수업 밖에서도 이어지고, AI가 그 연결을 도와주는 앱**이 되어야 한다.

---

## 24. 기존 데이터 처리 정책

> ⚠️ v0.5에서 결정 예정 (P1 #10). 아래는 검토해야 할 항목 리스트.

피벗 전 onmatout은 개인 요가 기록 앱이었으므로, 기존 사용자의 `records`(요가 일지) 등 데이터를 어떻게 처리할지 정책이 필요하다.

### 검토 항목

- 기존 사용자의 `records` 데이터: **폐기 / 보존 / 회원 역할로 이전** 중 선택
- 기존 회원의 자동 역할 매핑: 기본 `student` 역할 부여 여부
- 기존 즐겨찾기(saved_asanas) 데이터: 유지 (역할 무관하게 보존 권장)
- 기존 사용자 푸시 알림 토큰: 유지 여부
- 데이터 마이그레이션 실행 시점: 새 버전 배포 직후 vs 사용자 첫 로그인 시 lazy migration
- 사용자 안내: 인앱 공지로 "앱이 새로워졌어요" 안내 필요

### 사고 방지를 위한 점검 매트릭스 (작성 예정)

| 기존 데이터 | 처리 방침 | 영향 받는 사용자 수 |
|------------|----------|-------------------|
| records | TBD | TBD |
| saved_asanas | 보존 (잠정) | TBD |
| user 계정 | student 역할 자동 부여 (잠정) | TBD |

---

## 25. 프로젝트 구조 마이그레이션 전략

> ⚠️ v0.5에서 결정 예정 (P2 #14).

21장의 제안 구조와 현재 onmatout 코드 구조 간 차이가 크다. 한 번에 갈아엎는 big bang 방식 vs Phase별 점진적 이행 방식 중 선택 필요.

### 현재 구조 (요약)

```
app/
├── (tabs)/          -- expo-router 스타일 탭
├── screens/         -- AppContainer, SplashScreen 등
├── asanas/, auth/, profile/, record/, support/
├── _layout.tsx, index.tsx, ...
navigation/
├── index.tsx, TabNavigator.tsx, pages.ts, types.ts
stores/              -- Zustand
hooks/, lib/, components/, constants/, contexts/
```

### 21장 제안 구조 (목표)

```
app/
├── navigation/      -- TeacherNavigator, StudentNavigator 등
├── screens/Teacher/, screens/Student/, screens/Asana/, ...
├── stores/          -- 역할별 store 분리
├── lib/, hooks/, types/, constants/, assets/
```

### 검토 옵션

- **A안 (big bang)**: 새 브랜치에서 한 번에 새 구조로 작성. 머지 시 전체 교체.
  - 장점: 깔끔. 단점: 머지 갈등 폭발, 안 끝날 위험.
- **B안 (점진적 이행)**: Phase 1 신규 화면부터 새 구조로 작성. 기존 화면은 그대로 두고 필요 시 이동.
  - 장점: 위험 분산. 단점: 한동안 두 구조 공존 → 혼란.
- **C안 (선언적 매핑)**: 현재 구조 유지하고 Phase별로 디렉토리 재배치 PR 분리.
  - 장점: 작은 PR. 단점: 디렉토리 이동 빈번.

권장: B안 + Phase별 정리 PR. 신규 피벗 화면은 새 구조로, 기존 코드는 살아남는 동안만 유지.

---

## 26. 요가원 (Studio) 도메인

### 26.1 개념

v0.4 에는 없던 **요가원** 개체. 한 원장이 운영하는 단위로, 클래스/회원/지도자/수업권을 묶는다.

### 26.2 pivot_studios 필드

- id
- owner_id (FK auth.users) — 원장
- name
- location
- phone
- hours_text
- website_url
- instagram_url — 회원이 ↗ 외부 링크로 열 수 있음
- kakao_url — 카카오 오픈채팅/플러스친구 URL
- description
- created_at / updated_at

### 26.3 studio_teachers (N:M)

- studio_id (FK pivot_studios)
- teacher_id (FK auth.users)
- added_by — 누가 추가했는지
- added_at
- status (`active` | `removed`)

회원 상세에서 원장이 "이 회원을 지도자로 승급" 누르면 row 추가. 해제 시 `studio_teacher_removals` 에 사유와 함께 보존.

### 26.4 RLS 패턴

- `pivot_studios SELECT`: owner OR student (그 요가원 소속 student_profiles 보유)
- `pivot_studios UPDATE/DELETE`: owner only

### 26.5 회원 클래스탭 노출

회원의 클래스탭 상단 `StudioInfoCard` 가 다음을 보여줌:
- 활성 수업권 (티켓 아이콘 + 클래스명·사용횟수)
- 연락처 액션 (전화/카카오/인스타) — 각각 `Linking.openURL`

---

## 27. 옴 (AI 요가 도우미) 세션 구조

### 27.1 개념

ChatGPT 스타일 멀티 세션. 한 사용자가 여러 대화 세션을 가질 수 있고, 각 세션은 자체 thread_id + 제목.

### 27.2 데이터 모델

```
ai_answer_logs        — 매 질문/답변 1행
  thread_id (uuid, NOT FK)  ← 같은 세션이면 같은 값
  user_id
  question / answer
  retrieved_document_ids / related_asana_ids / related_routine_ids
  safety_notice_required / should_recommend_teacher
  rating / rated_at

ai_sessions (신규)    — 세션 메타 (제목 변경 시점에만 row 생성)
  thread_id (uuid, PK)
  user_id
  title text nullable
  created_at / updated_at
  RLS: user_id = auth.uid()
```

### 27.3 클라이언트 흐름

- 진입: 항상 **새 대화로 시작** (`useState(() => uuid())` 로 thread_id 즉시 발급)
- 메뉴 ☰: 시트로 세션 리스트 (최신 활동순) + "+ 새 대화" 버튼
- 각 세션 row: 제목 변경(✏️) / 삭제(🗑️)
- 삭제: `ai_answer_logs` + `ai_sessions` 양쪽 cascade
- 표시 제목: `ai_sessions.title` > `firstQuestion` (fallback)
- 레거시 null thread_id 로그는 "이전 대화" 가상 세션으로 표시 (제목 변경 불가, 삭제만 가능)

### 27.4 Edge Function

- `yoga-ask` 가 클라이언트 발급 thread_id 를 그대로 INSERT
- v0.4 에는 thread_id 가 yoga_talk_threads 를 가리키는 FK 였으나 임의 uuid 와 충돌 → **FK 제거**
- system prompt 에 "마크다운 사용 금지" 명시. 클라이언트도 `stripMarkdown()` 으로 `**`, `*`, `##` 제거

### 27.5 헤더

- eyebrow: `AI Talk Beta`
- title: `옴`
- 우측: ☰ 메뉴 (세션 시트 열기)

---

## 28. 요가톡 DM 단순화

### 28.1 변경 요지

v0.4 의 4단계 상태머신 폐기. 회원 ↔ 지도자 사이는 **카카오톡처럼 단일 영구 스레드**.

### 28.2 yoga_talk_threads

- `(teacher_id, student_id, class_id)` 조합당 1개 row 보장
- 닫힌 스레드도 재진입 시 자동 재오픈 (status → 'open')
- `class_id` 가 있으면 클래스 컨텍스트 thread, 없으면 일반 thread

### 28.3 yoga_talk_thread_reads

- `(thread_id, user_id, last_read_at)` 으로 양쪽 last_read 기록
- 클라이언트가 화면 진입 시 `markThreadRead` RPC 호출
- 리스트 화면에서:
  - 내가 보낸 마지막 메시지 + 상대 last_read >= 그 시각 → **읽음**
  - 내가 보낸 마지막 메시지 + 상대 last_read < 그 시각 → **전송됨**
  - 상대가 보낸 마지막 메시지 + 내 last_read >= 그 시각 → **읽음** (또는 표시 안 함)
  - 상대가 보낸 마지막 메시지 + 내 last_read < 그 시각 → **새 메시지** (보라 dot + 굵게)

### 28.4 화면

- 요가톡 탭 = thread list (PageHeader title 없음, 우측 ✏️ 새 메시지 / 우측 하단 옴 FAB)
- 아바타: 이름 hash → 10색 팔레트 (보더 없음, 흰 글자)
- 새 메시지 시트: 지도자→내 회원 / 수련생→내 지도자 목록 → 탭 시 `getOrCreateThread`
- 개별 thread 화면: 카톡 풍 좌우 말풍선

### 28.5 푸시 알림

- yoga_talk_messages INSERT 트리거 → `pg_net.http_post('send-push', { user_id, title, body })` 호출
- send-push Edge Function 이 `user_push_tokens` 에서 대상 토큰 조회 → Expo Push API 전송
- 클라이언트가 백그라운드/포그라운드 어디에 있어도 즉시 알림

---

## 29. 수업 신청 / 대기 시스템

### 29.1 class_bookings

- id
- class_id (FK classes)
- student_id (FK student_profiles)
- booking_date
- status (`booked` | `waitlisted` | `canceled`)
- created_at / updated_at

### 29.2 정원 정책

- `class_day_stats(class_id, date)` RPC 가 booked_count, waitlist_count, my_status 반환
- 신청 시 `booked_count < capacity` 면 `booked`, 아니면 `waitlisted`
- 취소 시 `class_bookings_promote_waitlist_trigger` 가 대기자 1명 자동 승급 (created_at asc 순)
- 승급 시 send-push 트리거로 푸시 알림

### 29.3 회원 클래스탭 UI

- 주간 SectionList — 월~일 / 시간순
- 주 네비게이션: 이번 주 ~ 다음 주 (`maxWeekOffset=1`)
- 지난 슬롯: opacity 0.55 + "마감" 버튼 비활성
- 신청 버튼 상태:
  - **신청** (primary)
  - **수업 취소** (빨강) — 확인 다이얼로그 후 취소
  - **대기중** (warning)
  - **대기 신청** (warning) — 정원 가득 차서
  - **마감** (회색, 비활성) — 지난 시점
- 신청 시 자동으로 `mark_attendance` 가 함께 호출되지는 않음. 출석은 지도자가 별도로 처리.

### 29.4 RLS

- `class_bookings_select_staff`: studio staff(원장 + 활성 지도자) 는 그 요가원 모든 booking 조회 가능
- 회원은 본인 booking 만 조회

---

## 30. 출석 화면 (지도자) 개선

### 30.1 출석 체크 화면

- DetailHeader (sans 15px) + 날짜 네비게이션 행 (← 날짜 →)
- 미래 날짜는 → 비활성 (오늘 이후는 출석 의미 없음)
- 통계 카드: ✅출석 / ⏱지각 / 🔄보강 / ❌결석 / 👥전체 (아이콘 + 숫자)
- 회원 행: 색상 아바타(이름 hash) + 이름 + 5개 상태 pill (피드백 색)
- 차감된 회원은 우측에 보라 "🎫 −1회" 칩

### 30.2 회원별 출석 내역 (신규 페이지)

- 회원 상세에서 "출석 내역 →" 링크 행 탭 → `TeacherMemberAttendance` 진입
- 통계 카드 + 200건까지 전체 출석 기록
- 각 행: 색상 dot + 날짜 + 상태 pill + 차감 미니칩

---

## 31. 공통 UI 컴포넌트

### 31.1 Button (`components/ui/Button.tsx`)

```ts
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "destructive";
  size?: "small" | "medium" | "large";
  shape?: "rect" | "pill";
  disabled?: boolean;
  loading?: boolean;       // ActivityIndicator 자동 표시
  fullWidth?: boolean;
  prefix?: ReactNode;      // 좌측 아이콘 슬롯
  suffix?: ReactNode;      // 우측 아이콘 슬롯
  style?: ViewStyle;
  textStyle?: TextStyle;
}
```

borderRadius 10 (rect) / 999 (pill). 폼 화면 하단 submit, 액션 행 등 모든 주요 버튼이 이 컴포넌트 사용.

### 31.2 PillInput (`components/ui/PillInput.tsx`)

```ts
interface PillInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
  required?: boolean;  // label 뒤에 빨간 * 자동 렌더
}
```

borderRadius 10 (이전 pill 모양에서 변경). "(선택)" 텍스트는 PRD 라벨에서 제거하고 필수만 빨간 \* 로 표기.

### 31.3 DetailHeader / PageHeader

- 모든 detail 페이지: `<DetailHeader serif={false} title=... onBack=... trailing=... eyebrow?=... />`
- 탭 루트: `<PageHeader title?=... eyebrowSlot?=... trailingSlot?=... />`
- `FormHeader (X close)` 는 사용하지 않음 (모달이 아닌 페이지에서 X 가 어색)

### 31.4 아바타 색상 팔레트

`AVATAR_COLORS` 10색: primary / cyan / emerald / amber / red / pink / blue / lime / purple / orange. 이름 hash → 결정적 매핑.

### 31.5 ClassCard / RoutineCard 미리보기

- ClassCard: 좌측 4px 보라 강조 바 + 요일 7칩 (등록 요일 강조) + 메타 (시간/정원/위치)
- RoutineCard: 7개 아사나 썸네일 가로 행 + 날짜 우측 상단 + 카테고리/공개 chip

---

## 32. 탭 구조 (실제 구현)

### 32.1 수련생 (5탭)

- 클래스 (`StudentClassesTabScreen`)
- 아사나 (`AsanasScreen`)
- 요가톡 (`YogaTalkThreadListScreen`) — 가운데
- 시퀀스 (`StudentRoutineListScreen`)
- 수련 (`ProfileScreen`)

### 32.2 지도자 (5탭)

- 클래스 (`TeacherClassesTabScreen`)
- 수련생 (`TeacherMembersTabScreen`)
- 요가톡 (`YogaTalkThreadListScreen`) — 가운데
- 시퀀스 (`TeacherRoutineListScreen`)
- 수련 (`ProfileScreen`)

### 32.3 요가톡 탭 동작

- 탭 진입 = DM 리스트
- 우측 상단 ✏️ → 새 메시지 시트
- 우측 하단 floating "옴" 버튼 (48x48, 반투명 보라) → AI 어시스턴트 화면
- 미읽음 배지: `YogaTalkTabIcon` 이 30초 폴링 + AppState foreground 시 재조회

### 32.4 수련 탭 (인스타 스타일)

- 상단 헤더: 닉네임 좌측 / 역할 chip + 설정 우측 (사진 미리보기 제거)
- 본문: 큰 아바타(84) + 통계 인라인 + 표시명 + bio + [프로필 수정]
- 아래: 수련 기록 리스트 (기존 유지)
- 우측 상단 "통계 공유" 작은 아이콘 (전체 수련 기록 헤더 행)

---

## 33. 데이터 모델 (v0.5 추가/변경 정리)

### 신규 테이블

- `pivot_studios` — 요가원
- `studio_teachers` — 요가원-지도자 N:M
- `studio_teacher_removals` — 해제 이력
- `class_bookings` — 수업 신청/대기
- `ai_sessions` — AI 세션 제목
- `yoga_talk_thread_reads` — 읽음 표시
- `user_push_tokens` — Expo Push 토큰
- `app_config` — Edge Function URL 등 런타임 설정

### 변경된 컬럼

- `user_profiles.bio text` 추가
- `pivot_studios.instagram_url`, `kakao_url` 추가
- `routines.visibility` CHECK 에 `'public'` 추가
- `student_profiles.studio_id` 추가
- `classes.studio_id` 추가
- `ai_answer_logs.thread_id` FK 제거 (자체 uuid)

### 신규 트리거 / RPC

- `dispatch_push_on_new_message` — yoga_talk_messages INSERT → send-push
- `class_bookings_promote_waitlist_trigger` — 취소 시 대기자 자동 승급
- `class_day_stats(class_id, date)` — 신청/대기/내상태 통계
- `mark_attendance` / `cancel_attendance` — 트랜잭션 출석 처리
- `is_my_student_profile`, `is_student_in_class`, `is_teacher_of_class` — RLS 헬퍼
- `yoga_talk_unread_count`, `yoga_talk_mark_read` — 읽음 관련 RPC

### 신규 Edge Function

- `yoga-ask` — RAG 답변 생성 (text-embedding-3-small + gpt-4o-mini)
- `send-push` — Expo Push 발송 (DB trigger 호출용)
- `send-sms` — OTP 인증 발송

---

## 34. 변경되지 않은 핵심 가치

피벗의 방향(요가 선생님과 회원을 수업 밖에서도 연결하는 AI 클래스 케어 앱)은 그대로다.

v0.5 의 변화는 다음 한 줄로 요약된다:

> **요가원이라는 운영 단위를 명시화하고, 요가톡을 AI(옴) + DM 두 트랙으로 분리하며, 회원 셀프 신청과 푸시 알림으로 일상적 사용 빈도를 끌어올린다.**
