-- ONMATOUT Pivot Phase 1: 클래스 관리 MVP 스키마
-- 작성일: 2026-06-05
-- 전략: 순수 ADD only — 기존 테이블 무변경 (단 user_favorite_asanas 에 컬럼 2개 추가)
-- FK 기준: 모든 user 참조는 auth.users(id) 통일
-- RLS: ENABLE 만 하고 정책은 별도 마이그레이션에서 작성 (현재는 service_role 만 접근)

-- =========================================
-- 0. 확장
-- =========================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================
-- 공통: updated_at 자동 갱신 함수
-- =========================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 1. user_roles — 다중 역할 (teacher + student 동시 가능)
-- =========================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.user_roles IS '다중 역할 지원: 한 사용자가 teacher + student 동시 가능';

-- =========================================
-- 2. teacher_profiles — 선생님 부가 정보
-- =========================================

CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_name                 text,
  bio                         text,
  location                    text,
  instagram_url               text,
  website_url                 text,
  cancellation_hours_before   int  NOT NULL DEFAULT 24,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_teacher_profiles_updated_at
  BEFORE UPDATE ON public.teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 3. student_profiles — 선생님이 관리하는 회원 카드
-- =========================================

CREATE TABLE IF NOT EXISTS public.student_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name                  text NOT NULL,
  phone                 text,
  phone_consent_at      timestamptz,
  invite_code           text NOT NULL UNIQUE,
  invite_code_used_at   timestamptz,
  memo                  text,
  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'paused', 'archived')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_student_profiles_teacher ON public.student_profiles(teacher_id);
CREATE INDEX idx_student_profiles_user    ON public.student_profiles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_student_profiles_phone   ON public.student_profiles(phone)   WHERE phone   IS NOT NULL;

CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 초대 코드 자동 생성: ONM-XXXX (헷갈리는 0/O, 1/I/L 제외)
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text AS $$
DECLARE
  chars  text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := 'ONM-';
  i      int;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- INSERT 시 invite_code 가 비어있으면 자동 생성 + 충돌 시 재시도
CREATE OR REPLACE FUNCTION public.set_student_invite_code()
RETURNS trigger AS $$
DECLARE
  attempts int := 0;
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    LOOP
      NEW.invite_code := public.generate_invite_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.student_profiles WHERE invite_code = NEW.invite_code
      );
      attempts := attempts + 1;
      IF attempts > 10 THEN
        RAISE EXCEPTION 'invite_code generation failed after 10 attempts';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_profiles_invite_code
  BEFORE INSERT ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_student_invite_code();

-- =========================================
-- 4. teacher_students — 회원 ↔ 선생님 N:M 관계
-- =========================================

CREATE TABLE IF NOT EXISTS public.teacher_students (
  teacher_id          uuid NOT NULL REFERENCES auth.users(id)               ON DELETE CASCADE,
  student_profile_id  uuid NOT NULL REFERENCES public.student_profiles(id)  ON DELETE CASCADE,
  status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'paused', 'archived')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (teacher_id, student_profile_id)
);

ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 5. classes — 클래스 (요일/시간 컬럼 없음)
-- =========================================

CREATE TABLE IF NOT EXISTS public.classes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  location    text,
  capacity    int,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_classes_teacher ON public.classes(teacher_id);

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 6. class_schedules — 클래스별 요일/시간 (1:N)
-- =========================================

CREATE TABLE IF NOT EXISTS public.class_schedules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week  int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=일, 6=토 (ISO 호환)
  start_time   time NOT NULL,
  end_time     time NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_class_schedules_class ON public.class_schedules(class_id);

-- =========================================
-- 7. class_students — 클래스에 등록된 회원
-- =========================================

CREATE TABLE IF NOT EXISTS public.class_students (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   uuid NOT NULL REFERENCES public.classes(id)          ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  status     text NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'paused', 'archived')),
  UNIQUE (class_id, student_id)
);

ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_class_students_class   ON public.class_students(class_id);
CREATE INDEX idx_class_students_student ON public.class_students(student_id);

-- =========================================
-- 8. memberships — 수업권 (count / period_weekly / period_unlimited)
-- =========================================

CREATE TABLE IF NOT EXISTS public.memberships (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  class_id      uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  type          text NOT NULL CHECK (type IN ('count', 'period_weekly', 'period_unlimited')),
  total_count   int,
  used_count    int  NOT NULL DEFAULT 0,
  weekly_limit  int,
  start_date    date NOT NULL,
  end_date      date NOT NULL,
  status        text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'expired', 'paused')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  -- 타입별 필수 필드 보장
  CONSTRAINT memberships_count_total_required
    CHECK (type <> 'count' OR total_count IS NOT NULL),
  CONSTRAINT memberships_weekly_limit_required
    CHECK (type <> 'period_weekly' OR weekly_limit IS NOT NULL)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_memberships_student ON public.memberships(student_id);
CREATE INDEX idx_memberships_status  ON public.memberships(status);

CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 9. attendance — 출석
-- =========================================

CREATE TABLE IF NOT EXISTS public.attendance (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       uuid NOT NULL REFERENCES auth.users(id)                ON DELETE CASCADE,
  student_id       uuid NOT NULL REFERENCES public.student_profiles(id)   ON DELETE CASCADE,
  class_id         uuid NOT NULL REFERENCES public.classes(id)            ON DELETE CASCADE,
  attendance_date  date NOT NULL,
  status           text NOT NULL CHECK (status IN ('present', 'late', 'makeup', 'absent', 'canceled')),
  source           text NOT NULL DEFAULT 'teacher_manual'
                     CHECK (source IN ('teacher_manual', 'student_cancel', 'system_auto')),
  deducted         boolean NOT NULL DEFAULT false,
  memo             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id, attendance_date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_attendance_teacher ON public.attendance(teacher_id);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_date    ON public.attendance(attendance_date);

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 10. routines — 복습 루틴
-- =========================================

CREATE TABLE IF NOT EXISTS public.routines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  visibility  text NOT NULL DEFAULT 'private'
                CHECK (visibility IN ('private', 'class_shared', 'student_shared')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_routines_teacher ON public.routines(teacher_id);

CREATE TRIGGER trg_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 11. routine_items — 루틴 내 아사나
-- =========================================

CREATE TABLE IF NOT EXISTS public.routine_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id        uuid NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  asana_id          uuid NOT NULL REFERENCES public.asanas(id)   ON DELETE RESTRICT,
  order_index       int  NOT NULL,
  duration_seconds  int,
  memo              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.routine_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_routine_items_routine ON public.routine_items(routine_id);

CREATE TRIGGER trg_routine_items_updated_at
  BEFORE UPDATE ON public.routine_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 12. routine_shares — 루틴 공유 (클래스 OR 회원 1명)
-- =========================================

CREATE TABLE IF NOT EXISTS public.routine_shares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id  uuid NOT NULL REFERENCES public.routines(id)          ON DELETE CASCADE,
  teacher_id  uuid NOT NULL REFERENCES auth.users(id)               ON DELETE CASCADE,
  class_id    uuid REFERENCES public.classes(id)                    ON DELETE CASCADE,
  student_id  uuid REFERENCES public.student_profiles(id)           ON DELETE CASCADE,
  shared_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- 공유 대상은 class 또는 student 중 정확히 하나
  CONSTRAINT routine_shares_target_check CHECK (
    (class_id IS NOT NULL AND student_id IS NULL) OR
    (class_id IS NULL AND student_id IS NOT NULL)
  )
);

ALTER TABLE public.routine_shares ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_routine_shares_routine ON public.routine_shares(routine_id);
CREATE INDEX idx_routine_shares_class   ON public.routine_shares(class_id)   WHERE class_id   IS NOT NULL;
CREATE INDEX idx_routine_shares_student ON public.routine_shares(student_id) WHERE student_id IS NOT NULL;

-- =========================================
-- 13. yoga_talk_threads — 요가톡 스레드
-- =========================================

CREATE TABLE IF NOT EXISTS public.yoga_talk_threads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id        uuid NOT NULL REFERENCES auth.users(id)                ON DELETE CASCADE,
  student_id        uuid NOT NULL REFERENCES public.student_profiles(id)   ON DELETE CASCADE,
  class_id          uuid REFERENCES public.classes(id)                     ON DELETE SET NULL,
  category          text NOT NULL CHECK (category IN
                      ('pose_difficulty', 'discomfort', 'routine_request', 'class_question', 'condition', 'etc')),
  title             text NOT NULL,
  status            text NOT NULL DEFAULT 'ai_answered'
                      CHECK (status IN ('ai_answered', 'sent_to_teacher', 'teacher_answered', 'closed')),
  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  reminder_count    int NOT NULL DEFAULT 0,
  closed_at         timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.yoga_talk_threads ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_yoga_talk_threads_teacher ON public.yoga_talk_threads(teacher_id);
CREATE INDEX idx_yoga_talk_threads_student ON public.yoga_talk_threads(student_id);
CREATE INDEX idx_yoga_talk_threads_status  ON public.yoga_talk_threads(status);

CREATE TRIGGER trg_yoga_talk_threads_updated_at
  BEFORE UPDATE ON public.yoga_talk_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 14. yoga_talk_messages — 요가톡 메시지
-- =========================================

CREATE TABLE IF NOT EXISTS public.yoga_talk_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    uuid NOT NULL REFERENCES public.yoga_talk_threads(id) ON DELETE CASCADE,
  sender_type  text NOT NULL CHECK (sender_type IN ('student', 'ai', 'teacher')),
  sender_id    uuid,
  body         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.yoga_talk_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_yoga_talk_messages_thread ON public.yoga_talk_messages(thread_id);

CREATE TRIGGER trg_yoga_talk_messages_updated_at
  BEFORE UPDATE ON public.yoga_talk_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 15. yoga_talk_attachments — 요가톡 첨부 (아사나/루틴)
-- =========================================

CREATE TABLE IF NOT EXISTS public.yoga_talk_attachments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id       uuid NOT NULL REFERENCES public.yoga_talk_messages(id) ON DELETE CASCADE,
  attachment_type  text NOT NULL CHECK (attachment_type IN ('asana', 'routine')),
  attachment_id    uuid NOT NULL,  -- 다형성 FK (asanas.id 또는 routines.id) — 앱 레벨 검증
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.yoga_talk_attachments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_yoga_talk_attachments_message ON public.yoga_talk_attachments(message_id);

-- =========================================
-- 16. knowledge_documents — RAG 지식 문서 (embedding)
-- =========================================

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type  text NOT NULL CHECK (source_type IN ('asana', 'routine', 'teacher_note', 'faq')),
  source_id    uuid NOT NULL,
  title        text NOT NULL,
  content      text NOT NULL,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding    vector(1536),  -- OpenAI text-embedding-3-small / ada-002 dimension
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_knowledge_documents_source ON public.knowledge_documents(source_type, source_id);
-- vector index (ivfflat) 는 데이터 충분히 쌓인 후 별도 마이그레이션에서 추가

CREATE TRIGGER trg_knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 17. ai_answer_logs — AI 답변 로그
-- =========================================

CREATE TABLE IF NOT EXISTS public.ai_answer_logs (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id                   uuid REFERENCES public.yoga_talk_threads(id) ON DELETE SET NULL,
  question                    text NOT NULL,
  answer                      text NOT NULL,
  retrieved_document_ids      uuid[] NOT NULL DEFAULT '{}',
  related_asana_ids           uuid[] NOT NULL DEFAULT '{}',
  related_routine_ids         uuid[] NOT NULL DEFAULT '{}',
  safety_notice_required      boolean NOT NULL DEFAULT false,
  should_recommend_teacher    boolean NOT NULL DEFAULT false,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_answer_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ai_answer_logs_user ON public.ai_answer_logs(user_id);

-- =========================================
-- 18. user_favorite_asanas 확장 — save_type / memo 컬럼 추가
-- =========================================
-- 기존 5건은 default 'favorite' 로 자동 백필

ALTER TABLE public.user_favorite_asanas
  ADD COLUMN IF NOT EXISTS save_type text NOT NULL DEFAULT 'favorite'
    CHECK (save_type IN ('favorite', 'want_to_learn', 'difficult', 'class_pose', 'review_later')),
  ADD COLUMN IF NOT EXISTS memo text;
