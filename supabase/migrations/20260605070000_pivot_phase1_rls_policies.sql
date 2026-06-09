-- ONMATOUT Pivot Phase 1: RLS 정책
-- 작성일: 2026-06-05
-- 전제: 20260605020000_pivot_phase1_schema 가 적용됨 (17개 신규 테이블 + user_favorite_asanas 확장)
--
-- 권한 모델 (PRD 6.1, 6.2 기준):
--   - 선생님(teacher): 본인의 클래스/회원/출석/루틴 전권
--   - 회원(student): 본인 정보 + 연결된 선생님이 공유한 콘텐츠 조회, 본인 thread 작성
--   - knowledge_documents / ai_answer_logs 의 쓰기는 service_role (Edge Function) 전담
--
-- 설계 원칙:
--   - RLS recursion 방지: 교차 테이블 검증은 SECURITY DEFINER helper 함수로 격리
--   - 모든 helper 는 STABLE + search_path 고정 (advisor function_search_path_mutable 동시 해소)
--   - 정책은 authenticated 만 대상 (anon 접근 금지)

-- =========================================
-- Helper 함수
-- =========================================

-- 내가 그 student 의 선생님인가?
CREATE OR REPLACE FUNCTION public.is_my_student(p_student_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = p_student_profile_id
      AND sp.teacher_id = auth.uid()
  );
$$;

-- 내가 그 student_profile 의 회원 본인인가?
CREATE OR REPLACE FUNCTION public.is_my_student_profile(p_student_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = p_student_profile_id
      AND sp.user_id = auth.uid()
  );
$$;

-- 내가 그 class 의 선생님인가?
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = p_class_id
      AND c.teacher_id = auth.uid()
  );
$$;

-- 내가 그 class 에 등록된 활성 회원인가?
CREATE OR REPLACE FUNCTION public.is_student_in_class(p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_students cs
    JOIN public.student_profiles sp ON sp.id = cs.student_id
    WHERE cs.class_id = p_class_id
      AND sp.user_id = auth.uid()
      AND cs.status = 'active'
  );
$$;

-- 내가 그 routine 을 공유받은 회원인가? (class 공유 또는 개인 공유)
CREATE OR REPLACE FUNCTION public.is_routine_shared_with_me(p_routine_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.routine_shares rs
    WHERE rs.routine_id = p_routine_id
      AND (
        (rs.student_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.student_profiles sp
          WHERE sp.id = rs.student_id AND sp.user_id = auth.uid()
        ))
        OR
        (rs.class_id IS NOT NULL AND EXISTS (
          SELECT 1
          FROM public.class_students cs
          JOIN public.student_profiles sp2 ON sp2.id = cs.student_id
          WHERE cs.class_id = rs.class_id
            AND sp2.user_id = auth.uid()
            AND cs.status = 'active'
        ))
      )
  );
$$;

-- 내가 그 yoga_talk_thread 에 접근 가능한가? (선생님 본인 또는 회원 본인)
CREATE OR REPLACE FUNCTION public.can_access_thread(p_thread_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.yoga_talk_threads t
    JOIN public.student_profiles sp ON sp.id = t.student_id
    WHERE t.id = p_thread_id
      AND (t.teacher_id = auth.uid() OR sp.user_id = auth.uid())
  );
$$;

-- =========================================
-- 1. user_roles — 본인 row 만
-- =========================================

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_insert_own" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_roles_delete_own" ON public.user_roles
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =========================================
-- 2. teacher_profiles — SELECT 는 authenticated 전체 (회원이 선생님 정보 조회), 쓰기는 본인만
-- =========================================

CREATE POLICY "teacher_profiles_select_all_authenticated" ON public.teacher_profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "teacher_profiles_insert_own" ON public.teacher_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "teacher_profiles_update_own" ON public.teacher_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "teacher_profiles_delete_own" ON public.teacher_profiles
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =========================================
-- 3. student_profiles — 선생님 본인 OR 회원 본인
-- =========================================

CREATE POLICY "student_profiles_select_teacher_or_self" ON public.student_profiles
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "student_profiles_insert_teacher" ON public.student_profiles
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- 회원 본인은 user_id 연결(초대 코드 사용 후) 시 본인 칸 업데이트 가능
CREATE POLICY "student_profiles_update_teacher_or_self" ON public.student_profiles
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR user_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "student_profiles_delete_teacher" ON public.student_profiles
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- =========================================
-- 4. teacher_students — 선생님 전권, 회원은 본인 row 조회
-- =========================================

CREATE POLICY "teacher_students_select_teacher_or_student" ON public.teacher_students
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.is_my_student_profile(student_profile_id));

CREATE POLICY "teacher_students_insert_teacher" ON public.teacher_students
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "teacher_students_update_teacher" ON public.teacher_students
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "teacher_students_delete_teacher" ON public.teacher_students
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- =========================================
-- 5. classes — 선생님 전권, 등록된 회원은 SELECT
-- =========================================

CREATE POLICY "classes_select_teacher_or_enrolled" ON public.classes
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.is_student_in_class(id));

CREATE POLICY "classes_insert_teacher" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "classes_update_teacher" ON public.classes
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "classes_delete_teacher" ON public.classes
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- =========================================
-- 6. class_schedules — class 권한 따라감
-- =========================================

CREATE POLICY "class_schedules_select_class_member" ON public.class_schedules
  FOR SELECT TO authenticated
  USING (public.is_teacher_of_class(class_id) OR public.is_student_in_class(class_id));

CREATE POLICY "class_schedules_insert_teacher" ON public.class_schedules
  FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher_of_class(class_id));

CREATE POLICY "class_schedules_update_teacher" ON public.class_schedules
  FOR UPDATE TO authenticated
  USING (public.is_teacher_of_class(class_id))
  WITH CHECK (public.is_teacher_of_class(class_id));

CREATE POLICY "class_schedules_delete_teacher" ON public.class_schedules
  FOR DELETE TO authenticated
  USING (public.is_teacher_of_class(class_id));

-- =========================================
-- 7. class_students — class 선생님 전권, 회원은 본인 row 조회
-- =========================================

CREATE POLICY "class_students_select_teacher_or_self" ON public.class_students
  FOR SELECT TO authenticated
  USING (public.is_teacher_of_class(class_id) OR public.is_my_student_profile(student_id));

CREATE POLICY "class_students_insert_teacher" ON public.class_students
  FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher_of_class(class_id));

CREATE POLICY "class_students_update_teacher" ON public.class_students
  FOR UPDATE TO authenticated
  USING (public.is_teacher_of_class(class_id))
  WITH CHECK (public.is_teacher_of_class(class_id));

CREATE POLICY "class_students_delete_teacher" ON public.class_students
  FOR DELETE TO authenticated
  USING (public.is_teacher_of_class(class_id));

-- =========================================
-- 8. memberships — student 의 선생님 전권, 회원은 SELECT
-- =========================================

CREATE POLICY "memberships_select_teacher_or_self" ON public.memberships
  FOR SELECT TO authenticated
  USING (public.is_my_student(student_id) OR public.is_my_student_profile(student_id));

CREATE POLICY "memberships_insert_teacher" ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (public.is_my_student(student_id));

CREATE POLICY "memberships_update_teacher" ON public.memberships
  FOR UPDATE TO authenticated
  USING (public.is_my_student(student_id))
  WITH CHECK (public.is_my_student(student_id));

CREATE POLICY "memberships_delete_teacher" ON public.memberships
  FOR DELETE TO authenticated
  USING (public.is_my_student(student_id));

-- =========================================
-- 9. attendance — 선생님 전권, 회원은 본인 SELECT
-- =========================================

CREATE POLICY "attendance_select_teacher_or_self" ON public.attendance
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.is_my_student_profile(student_id));

CREATE POLICY "attendance_insert_teacher" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "attendance_update_teacher" ON public.attendance
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "attendance_delete_teacher" ON public.attendance
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- =========================================
-- 10. routines — 선생님 전권, 공유받은 회원은 SELECT
-- =========================================

CREATE POLICY "routines_select_teacher_or_shared" ON public.routines
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.is_routine_shared_with_me(id));

CREATE POLICY "routines_insert_teacher" ON public.routines
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "routines_update_teacher" ON public.routines
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "routines_delete_teacher" ON public.routines
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- =========================================
-- 11. routine_items — routine 권한 따라감
-- =========================================

CREATE POLICY "routine_items_select_teacher_or_shared" ON public.routine_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routines r
      WHERE r.id = routine_id
        AND (r.teacher_id = auth.uid() OR public.is_routine_shared_with_me(r.id))
    )
  );

CREATE POLICY "routine_items_insert_teacher" ON public.routine_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routines r
      WHERE r.id = routine_id AND r.teacher_id = auth.uid()
    )
  );

CREATE POLICY "routine_items_update_teacher" ON public.routine_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routines r
      WHERE r.id = routine_id AND r.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routines r
      WHERE r.id = routine_id AND r.teacher_id = auth.uid()
    )
  );

CREATE POLICY "routine_items_delete_teacher" ON public.routine_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routines r
      WHERE r.id = routine_id AND r.teacher_id = auth.uid()
    )
  );

-- =========================================
-- 12. routine_shares — 선생님 전권, 공유 대상 회원은 SELECT
-- =========================================

CREATE POLICY "routine_shares_select_teacher_or_target" ON public.routine_shares
  FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid()
    OR (student_id IS NOT NULL AND public.is_my_student_profile(student_id))
    OR (class_id IS NOT NULL AND public.is_student_in_class(class_id))
  );

CREATE POLICY "routine_shares_insert_teacher" ON public.routine_shares
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "routine_shares_update_teacher" ON public.routine_shares
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "routine_shares_delete_teacher" ON public.routine_shares
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- =========================================
-- 13. yoga_talk_threads — 선생님 본인 OR 회원 본인
-- =========================================

CREATE POLICY "yoga_talk_threads_select_party" ON public.yoga_talk_threads
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.is_my_student_profile(student_id));

-- 회원이 본인 thread 생성 (teacher_id 는 student_profile 의 teacher 와 일치해야 정상 — 앱 레벨 검증)
CREATE POLICY "yoga_talk_threads_insert_student" ON public.yoga_talk_threads
  FOR INSERT TO authenticated
  WITH CHECK (public.is_my_student_profile(student_id));

CREATE POLICY "yoga_talk_threads_update_party" ON public.yoga_talk_threads
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR public.is_my_student_profile(student_id))
  WITH CHECK (teacher_id = auth.uid() OR public.is_my_student_profile(student_id));

CREATE POLICY "yoga_talk_threads_delete_teacher" ON public.yoga_talk_threads
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- =========================================
-- 14. yoga_talk_messages — thread 당사자
-- =========================================

CREATE POLICY "yoga_talk_messages_select_party" ON public.yoga_talk_messages
  FOR SELECT TO authenticated
  USING (public.can_access_thread(thread_id));

-- 메시지 작성: thread 의 선생님 또는 회원 본인. AI 메시지는 service_role 만.
CREATE POLICY "yoga_talk_messages_insert_party" ON public.yoga_talk_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type IN ('teacher', 'student')
    AND public.can_access_thread(thread_id)
    AND sender_id = auth.uid()
  );

CREATE POLICY "yoga_talk_messages_update_sender" ON public.yoga_talk_messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "yoga_talk_messages_delete_sender" ON public.yoga_talk_messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- =========================================
-- 15. yoga_talk_attachments — message 권한 따라감 (SELECT 만, 쓰기는 message 작성 트랜잭션 내에서 service_role)
-- =========================================

CREATE POLICY "yoga_talk_attachments_select_party" ON public.yoga_talk_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.yoga_talk_messages m
      WHERE m.id = message_id AND public.can_access_thread(m.thread_id)
    )
  );

CREATE POLICY "yoga_talk_attachments_insert_sender" ON public.yoga_talk_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.yoga_talk_messages m
      WHERE m.id = message_id AND m.sender_id = auth.uid()
    )
  );

CREATE POLICY "yoga_talk_attachments_delete_sender" ON public.yoga_talk_attachments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.yoga_talk_messages m
      WHERE m.id = message_id AND m.sender_id = auth.uid()
    )
  );

-- =========================================
-- 16. knowledge_documents — SELECT 만 authenticated, 쓰기는 service_role 전담
-- =========================================

CREATE POLICY "knowledge_documents_select_authenticated" ON public.knowledge_documents
  FOR SELECT TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE 정책 없음 = authenticated/anon 모두 차단, service_role 만 가능

-- =========================================
-- 17. ai_answer_logs — 본인 로그만 SELECT, 쓰기는 service_role 전담
-- =========================================

CREATE POLICY "ai_answer_logs_select_own" ON public.ai_answer_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE 정책 없음 = Edge Function (service_role) 만 기록
