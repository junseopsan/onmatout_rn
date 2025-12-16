-- app_versions 테이블에 Android 버전 데이터 추가
-- Supabase SQL Editor에서 실행하세요
-- (테이블은 이미 존재하며 iOS 데이터만 있는 상태)

-- Android 버전 데이터 삽입
INSERT INTO "public"."app_versions" ("platform", "min_version", "store_url") 
VALUES ('android', '1.0.9', 'https://play.google.com/store/apps/details?id=com.onmatout.app');

