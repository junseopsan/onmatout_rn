# ONMATOUT Pivot TODO

`new_onmatout_prd.md` v0.3 리뷰 결과 정리 TODO.
체크박스 채우면서 v0.4 PRD 업데이트 → 데이터 모델 확정 → 마이그레이션 작성 순으로 진행.

---

## 🔴 P0 — 데이터 모델 결정 (가장 먼저, 나중에 바꾸기 비쌈)

### 1. 역할 모델 재설계 ✅ 확정

**결정 사항:**

- 다중 역할 지원 — 한 사람이 선생님 + 회원 동시 가능
- 회원 ↔ 선생님 N:M — 회원이 여러 선생님과 연결 가능
- `users` ↔ `student_profiles` 분리 — 가입 후 `student_profiles.user_id`로 연결
- 앱 진입 시 역할 토글 UI (헤더/탭바에 "선생님 모드 / 회원 모드", 마지막 선택 기억)

**확정 스키마:**

```
users
  - id, name, phone, email, profile_image_url, ...
  (role 컬럼 없음)

user_roles                  -- 다중 역할
  - user_id, role ('teacher' | 'student')
  PK (user_id, role)

teacher_profiles            -- 선생님 부가 정보
  - user_id (FK), studio_name, bio, ...

student_profiles            -- 선생님이 관리하는 회원 카드
  - id, teacher_id (FK users), user_id nullable
  - name, phone, memo, status, ...

teacher_students            -- N:M 관계
  - teacher_id, student_profile_id, status
  PK (teacher_id, student_profile_id)
```

- [ ] PRD 10.1, 12장에 위 모델 반영 (v0.4 작성 시)
- [ ] 역할 토글 UI 위치/디자인 결정 (Phase 1 구현 시)

### 2. 클래스 스케줄 모델 보강 ✅ 확정

**결정 사항:**

- "월수금 오전 하타요가" = 1개 클래스, 스케줄로 [월, 수, 금] 묶음 표현
- 스케줄은 별도 테이블 `class_schedules`로 분리 — 요일별 다른 시간 가능 (평일/주말)
- 출석은 "오늘 어떤 수업에 누가 왔는지"만 보면 됨

**확정 스키마:**

```
classes
  - id, teacher_id, title, description, location, capacity, is_active, ...
  (day_of_week, start_time, end_time 컬럼 없음)

class_schedules
  - id, class_id (FK), day_of_week (0~6), start_time, end_time
```

- [ ] PRD 10.2, 12장에 위 모델 반영 (v0.4)
- [ ] 출석 모델: `attendance.attendance_date` 만으로 OK인지, `schedule_id` 참조도 추가할지 검토 (#4와 함께)

### 3. 회원 가입 전/후 연결 정책 ✅ 확정

**결정 사항:**

- 전화번호: **Optional** (선생님이 모를 수 있음)
- 모든 `student_profile`에 **전역 유니크 1회용 invite_code** 자동 생성
- 매칭 방식: 전화번호 자동 매칭 + 초대 코드 fallback (둘 다 지원)
- 매칭 충돌: 회원이 후보 보고 **수락/거절** (자동 연결 금지)
- PIPA 동의: 전화번호 입력 시에만 체크박스 노출 (이름만은 동의 불필요)
- 회원 권한: 가입 후 "선생님이 입력한 내 정보 보기/삭제" 메뉴 제공

**확정 스키마:**

```
student_profiles
  - id, teacher_id, user_id nullable
  - name (필수)
  - phone nullable
  - phone_consent_at nullable        ← PIPA, 전화번호 있을 때만
  - invite_code (전역 유니크)         ← 예: "ONM-A7K2"
  - invite_code_used_at nullable     ← 사용 시 채움 = 무효화
  - memo, status, created_at, updated_at
```

**초대 코드 규칙:**

- 전역 유니크 (시스템 전체에서 유일)
- 1회용 (`used_at` 채워지면 무효)
- 포맷: `ONM-XXXX` (헷갈리는 0/O, 1/I/L 제외)
- 회원당 1개, 동명이인도 별도 코드

**연결 방법 우선순위:**

| 순위 | 방법 | MVP 포함 |
|------|------|---------|
| 1 | 선생님이 코드 공유 (카톡/QR/직접 보여주기) | ✅ |
| 2 | 회원 셀프 신청 → 선생님 승인 | ❌ Phase 2 |
| 3 | 선생님 사후 매칭 (대시보드에서 신규 가입자 중 선택) | ❌ Phase 2 |

**회원 가입 → 매칭 흐름 (MVP):**

```
1. 회원 가입 (전화번호 + OTP)
2. 자동 매칭 시도:
   - student_profiles.phone == 가입 phone AND user_id IS NULL → 후보 추출
3. 후보 있음 → "00 요가원 김선생님이 회원님을 등록했어요. 맞으신가요?"
   - [수락] → student_profiles.user_id 채움, invite_code 무효화
   - [거절] → 매칭 안 함
4. 후보 없음 OR 거절 → "초대 코드 입력" 화면
   - 코드 입력 → 매칭 → user_id 채움
5. 프로필에 "선생님이 입력한 내 정보 보기/삭제" 메뉴 노출
```

**핵심 원리:** `attendance.student_id` → `student_profiles.id` 이므로 `user_id` 채우는 순간 그동안의 출석 내역이 회원에게 자동 노출. 별도 마이그레이션 불필요.

- [ ] PRD 10.3, 12장에 위 모델/흐름 반영 (v0.4)
- [ ] Phase 2 작업으로 셀프 신청/사후 매칭 추가

### 4. 출석 ↔ 횟수권 트랜잭션 ✅ 확정

**수업권 타입 (필드 조합으로 표현):**

- 횟수권: `total_count` 만 (기본 2개월 유효, 선생님 수정 가능)
- 기간권 + 주N회: `start_date` + `end_date` + `weekly_limit`
- 기간권 무제한: `start_date` + `end_date`

**차감 정책 (해석 A — 실제 참여만 차감):**

| 수업권 | present/late/makeup | absent | canceled |
|--------|--------------------|---------|---------|
| 횟수권 | ✅ 1회 | ❌ | ❌ |
| 기간권+주N회 | ✅ 슬롯 1개 | ✅ 슬롯 1개 | ✅ 슬롯 1개 |
| 기간권 무제한 | - | - | - |

**핵심 동작:**

- 주 단위 카운트 기준: **월요일 시작** (ISO 표준)
- 자동 결석 마감: 매주 일요일 23:59 cron이 **기간권+주N회**의 미처리 슬롯을 absent로 마감 (횟수권은 대상 아님)
- 회원 셀프 취소 가능: `teacher_profiles.cancellation_hours_before` (기본 24시간)
- 정책 시간 이후 취소 불가 → 못 오면 cron이 absent 자동 처리
- 출석 등록 + 차감은 Supabase RPC 한 트랜잭션
- 출석 취소(present → canceled)했을 때 차감 자동 복구
- 횟수권 만료 후 `status='expired'`, 추가 출석 등록 불가, 잔여 횟수 보존(기록용)

**확정 스키마:**

```
memberships
  - id, student_id (FK student_profiles), class_id nullable
  - type ('count' | 'period_weekly' | 'period_unlimited')
  - total_count nullable
  - used_count default 0
  - weekly_limit nullable
  - start_date
  - end_date / expires_at      -- 횟수권 기본=start+2개월
  - status ('active'|'expired'|'paused')
  - created_at, updated_at

attendance
  - id, teacher_id, student_id, class_id
  - attendance_date
  - status ('present'|'late'|'makeup'|'absent'|'canceled')
  - source ('teacher_manual'|'student_cancel'|'system_auto')
  - deducted boolean
  - memo
  - created_at, updated_at

teacher_profiles
  - ...
  - cancellation_hours_before INT default 24
```

- [ ] PRD 10.4, 10.5, 12장에 위 모델/정책 반영 (v0.4)
- [ ] Supabase RPC `mark_attendance()` 작성
- [ ] Supabase RPC `cancel_attendance()` 작성 (자동 차감 복구 포함)
- [ ] 매주 일요일 23:59 cron job 설계 (`pg_cron` 또는 edge function)
- [ ] 횟수권 만료 임박 알림 (Phase 2 알림과 연계)

### 5. 요가톡 status 흐름 정리 ✅ 확정

**결정 사항:**

- AI 답변은 회원에게 **즉시 노출** (선생님 검토 대기 없음)
- 선생님은 회원이 "선생님에게 이어서" 누른 경우에만 질문 + 회원이 받은 AI 답변을 함께 봄 (= 초안으로 활용)
- 위험 카테고리(discomfort/통증)도 즉시 노출되지만 PRD 15장 안전 문구 강제 표시
- 자동 종결: 회원 마지막 활동 + 7일 무활동 → `closed`
- 선생님 미응답 처리: 3일/7일 후 자동 리마인드 푸시. 자동 closed 안 함

**용어 통일 (v0.4 PRD에 반영):**

- "AI 답변 초안" 표현 제거 → "회원이 받은 AI 답변" 으로 통일
- 선생님 화면에서는 같은 답변을 "참고용 초안"으로 표시 가능

**status 전이 규칙:**

```
ai_answered          ← 질문 작성 + AI 답변 자동 생성 (즉시 회원 노출)
   ↓ 회원이 "선생님에게 이어서" 클릭
sent_to_teacher      ← 선생님 큐 진입, 3일 후 리마인드 푸시
   ↓ 선생님 답변 작성
teacher_answered     ← 회원 알림, 회원 마지막 활동 + 7일 후 closed
   ↓ 회원 활동 7일 없음 OR 회원이 "해결됐어요"
closed
```

**확정 스키마 추가:**

```
yoga_talk_threads
  - ...
  - last_activity_at        -- 자동 종결 판정용 (메시지/조회 시 갱신)
  - reminder_count default 0  -- 선생님 리마인드 발송 횟수
  - closed_at nullable
```

- [ ] PRD 8.4, 8.5, 10.8에 위 흐름 반영 + "AI 답변 초안" 용어 정리 (v0.4)
- [ ] status 자동 전이 cron job 설계 (마지막 활동 + 7일 → closed)
- [ ] 선생님 리마인드 알림 (3일/7일) — Phase 2 알림과 연계

---

## 🟡 P1 — UX/플로우 모호점 해결

### 6. 푸시 알림을 MVP에 포함시킬지 결정

- [ ] 알림 없으면 "AI 답변 도착", "선생님 답변 도착"을 회원이 인지할 방법 부재
- [ ] 결정: MVP 포함 vs Phase 2 이전으로 당기기
- [ ] 포함 시 16장 알림 정책 → MVP 섹션으로 이동

### 7. 회원 초대 흐름 디테일

- [ ] 초대 코드 vs 초대 링크 — 둘 다 지원할지 하나만 할지
- [ ] 앱 미설치 회원의 deferred deep link 흐름 명세
  - 링크 클릭 → 스토어 → 설치 → 자동 코드 채움
- [ ] 7.1 회원 MVP 첫 단계에 "초대 연결" 포함시키기

### 8. 결제 없는 상태에서 횟수권 발급 흐름

- [ ] 명시: MVP는 선생님 수동 입력 (오프라인 결제 가정)
- [ ] "10회권 등록" 폼 UI 정의
- [ ] PRD 10.4 "MVP 정책"에 추가

### 9. 선생님 검증 정책

- [ ] MVP는 자율 가입 OK인지 명시
- [ ] 회원이 잘못된 선생님에게 연결 시 사고 방지책 정의
  - 예: 회원 가입 시 선생님 정보 한 번 더 확인 UI
- [ ] Phase 5에 검증/자격 확인 기능 명시

### 10. 기존 데이터 처리 정책 (운영 사고 방지)

- [ ] 현재 onmatout 사용자의 `records`(요가 일지) 데이터 처리
  - 폐기 / 보존 / 회원 역할로 이전
- [ ] 기존 회원이 새 버전 진입 시 자동 역할 매핑 정책
- [ ] 마이그레이션 시점의 점검 매트릭스 작성
- [ ] PRD에 "기존 데이터 처리" 섹션 신설

---

## 🟢 P2 — 다듬기

### 11. 루틴 시간 단위 명확화

- [ ] `routine_items.duration_seconds` 의미 명시
  - 한 자세 유지 시간인지, 시퀀스 누적 시간인지

### 12. RAG hallucination 방지 메커니즘

- [ ] 답변 내 출처 인용 카드 표시 (어느 아사나 문서에서 왔는지)
- [ ] confidence threshold 정의 (검색 유사도 N 이하면 "확실하지 않다"로 답변)
- [ ] PRD 10.10에 구체 메커니즘 추가

### 13. AI 답변 로그 확장

- [ ] `ai_answer_logs`에 선생님 검토/수정/채택 여부 컬럼 추가
- [ ] 품질 개선을 위한 분석 가능하게

### 14. 프로젝트 구조 마이그레이션 전략

- [ ] 21장 제안 구조 vs 현재 코드 갭 정리
- [ ] 결정: 한 번에 갈아엎기 vs 점진적 이행
- [ ] 점진적이라면 마일스톤별 어느 부분부터 옮길지

### 15. MVP 범위 축소 검토

- [ ] Phase 1을 더 작게 자를 수 있는지 검토
  - 옵션: "선생님 1명 + 클래스 1개 + 회원 5명까지 출석 체크만"으로 최소화
- [ ] 6~8주 실행 가능 범위인지 자체 산정

---

## 📋 PRD v0.4 업데이트 체크리스트

위 P0~P2 결정 완료 후 PRD에 반영할 항목:

- [ ] 10.1 Auth — 다중 역할 모델 반영
- [ ] 10.2 클래스 — 스케줄 모델 반영
- [ ] 10.3 회원 — 가입 전/후 연결 정책 추가
- [ ] 10.4 수업권 — 차감 정책 / 결제 없는 수동 발급 명시
- [ ] 10.5 출석 — RPC 트랜잭션 명시
- [ ] 10.8 요가톡 — status 전이 규칙 추가
- [ ] 10.10 RAG — hallucination 방지 메커니즘 추가
- [ ] 12 데이터베이스 — 신규 테이블(`user_roles`, `class_schedules`, `teacher_students` 등) 반영
- [ ] 16 알림 — MVP 포함 여부 결정 반영
- [ ] 신규 섹션: **기존 데이터 처리 정책**
- [ ] 신규 섹션: **프로젝트 구조 마이그레이션 전략**

---

## 🛠️ 데이터 모델 확정 후 작업

PRD v0.4 확정 → 아래 순서로 실행:

- [ ] `supabase/migrations/0001_pivot_schema.sql` 작성 (신규 스키마)
- [ ] dev-onmatout 브랜치 DB에 적용 → 동작 확인
- [ ] 기존 데이터 처리 마이그레이션 작성 (보존 정책에 따라)
- [ ] RLS 정책 작성 (선생님/회원 역할별)
- [ ] Supabase RPC 작성 (출석+차감 트랜잭션, 회원 매칭 등)
- [ ] dev-onmatout → main merge → 운영 적용
- [ ] 앱 코드 마이그레이션 시작 (Phase 1부터)
