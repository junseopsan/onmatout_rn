-- 요가톡 1:1 대화 실시간 동기화
-- 대화 화면이 마운트 시 1회만 로드해, 열어둔 채로 상대 메시지를 못 받던 문제 해결.
-- yoga_talk_messages 를 realtime 퍼블리케이션에 추가하면 클라이언트가 INSERT 를 구독 가능.
-- (전달은 기존 RLS 를 따르므로 대화 당사자만 수신)

ALTER PUBLICATION supabase_realtime ADD TABLE public.yoga_talk_messages;
