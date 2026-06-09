# ONMATOUT Pivot PRD v0.3

## 요가 선생님과 회원을 수업 밖에서도 연결하는 AI 클래스 케어 앱

문서 버전: v0.3  
작성일: 2026-06-04  
프로젝트명: ONMATOUT  
플랫폼: Mobile App  
기술 방향: React Native / Supabase / RAG / AI Chat

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
2. 질문을 입력한다. 예: “다운독 할 때 손목이 아파요.”
3. 앱은 질문을 임베딩으로 변환한다.
4. Supabase pgvector에서 관련 아사나 문서를 검색한다.
5. 검색된 문서를 기반으로 AI 답변을 생성한다.
6. 회원은 AI 답변과 관련 아사나 카드를 확인한다.
7. 더 궁금하면 “선생님에게 이어서 질문하기”를 누른다.
8. 선생님은 AI 답변과 회원 질문을 함께 보고 답변한다.

### 8.5 선생님: AI 답변 초안을 활용해 답변하기

1. 선생님이 회원 질문을 확인한다.
2. 회원이 받은 AI 답변 초안을 함께 본다.
3. 선생님은 AI 답변을 그대로 보내거나 수정한다.
4. 필요하면 아사나 카드 또는 루틴을 첨부한다.
5. 회원에게 선생님 답변이 전달된다.

---

## 9. 정보 구조 IA

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

- 사용자는 가입 시 역할을 선택할 수 있다.
  - 선생님
  - 회원
- 역할에 따라 홈 화면과 탭 구조가 다르게 보인다.
- 회원은 초대 코드 또는 링크를 통해 선생님/클래스와 연결될 수 있다.

#### User 필드

- id
- role
- name
- phone
- email
- profile_image_url
- created_at
- updated_at

---

### 10.2 클래스 관리

#### 기능

선생님은 클래스를 생성하고 관리할 수 있다.

#### Class 필드

- id
- teacher_id
- title
- description
- location
- day_of_week
- start_time
- end_time
- capacity
- is_active
- created_at
- updated_at

#### 주요 화면

- 클래스 목록
- 클래스 생성
- 클래스 상세
- 클래스 수정
- 클래스별 회원 목록
- 클래스별 출석 체크

---

### 10.3 회원 관리

#### 기능

선생님은 회원을 직접 등록할 수 있다.

#### StudentProfile 필드

- id
- teacher_id
- user_id nullable
- name
- phone
- memo
- status
- created_at
- updated_at

초기에는 회원이 앱에 가입하지 않아도 선생님이 회원을 등록할 수 있어야 한다.  
나중에 회원이 가입하면 전화번호 또는 초대 코드로 기존 회원 데이터와 연결한다.

#### 회원 상태

- active
- paused
- expired
- archived

---

### 10.4 수업권 / 횟수권 관리

#### 기능

선생님은 회원별로 수업권 정보를 관리할 수 있다.

#### Membership 필드

- id
- student_id
- class_id nullable
- type
  - count_pass
  - period_pass
- total_count
- used_count
- remaining_count
- start_date
- end_date
- status
- created_at
- updated_at

#### MVP 정책

- MVP에서는 횟수권 중심으로 구현한다.
- 출석 체크 시 remaining_count가 1 차감된다.
- 보강, 취소 등은 차감 여부를 선택할 수 있게 한다.

---

### 10.5 출석 체크

#### 기능

선생님은 클래스별로 회원 출석을 체크할 수 있다.

#### 출석 상태

- present: 출석
- absent: 결석
- late: 지각
- makeup: 보강
- canceled: 취소

#### Attendance 필드

- id
- teacher_id
- student_id
- class_id
- attendance_date
- status
- memo
- deducted_count
- created_at
- updated_at

#### 정책

- present 상태일 때 기본적으로 횟수권 1회 차감
- makeup은 차감 여부 선택 가능
- canceled는 차감하지 않음
- absent는 선생님 설정에 따라 차감 여부를 정할 수 있음
- MVP에서는 present만 자동 차감하고, 나머지는 수동 처리로 둔다.

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

#### 질문 상태

- ai_answered
- sent_to_teacher
- teacher_answered
- closed

#### YogaTalkThread 필드

- id
- teacher_id
- student_id
- class_id nullable
- category
- title
- status
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

### users

- id
- role
- name
- phone
- email
- profile_image_url
- created_at
- updated_at

### teacher_profiles

- id
- user_id
- studio_name
- bio
- location
- instagram_url
- website_url
- created_at
- updated_at

### student_profiles

- id
- teacher_id
- user_id nullable
- name
- phone
- memo
- status
- created_at
- updated_at

### classes

- id
- teacher_id
- title
- description
- location
- day_of_week
- start_time
- end_time
- capacity
- is_active
- created_at
- updated_at

### class_students

- id
- class_id
- student_id
- joined_at
- status

### memberships

- id
- student_id
- class_id nullable
- type
- total_count
- used_count
- remaining_count
- start_date
- end_date
- status
- created_at
- updated_at

### attendance

- id
- teacher_id
- student_id
- class_id
- attendance_date
- status
- memo
- deducted_count
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

### yoga_talk_threads

- id
- teacher_id
- student_id
- class_id nullable
- category
- title
- status
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

온매트아웃은 “요가를 혼자 기록하는 앱”에서 벗어나,  
**요가 선생님과 회원이 수업 밖에서도 이어지고, AI가 그 연결을 도와주는 앱**이 되어야 한다.
