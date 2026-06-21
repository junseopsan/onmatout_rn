-- 요가톡 목록/그룹방 실시간 동기화
-- 목록 화면에서 새 메시지(1:1·그룹)를 받으면 즉시 갱신하도록 chat_messages 도
-- realtime 퍼블리케이션에 추가. (yoga_talk_messages 는 앞선 마이그레이션에서 추가됨)

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
