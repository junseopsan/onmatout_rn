-- 새로운 요가원 데이터 추가
INSERT INTO "public"."studios" (
  "id", 
  "name", 
  "address", 
  "phone", 
  "website", 
  "instagram", 
  "description", 
  "image_url", 
  "latitude", 
  "longitude", 
  "created_at", 
  "updated_at"
) VALUES (
  gen_random_uuid(), 
  '요가피플', 
  '서울특별시 마포구 와우산로21길 19-7 개나리빌딩 6층', 
  '0507-1372-2046', 
  'https://www.instagram.com/yoga_people_/', 
  'yoga_people_', 
  '홍대정문 레드로드 홍대요가 상수요가
당신의 삶과 가장 잘 어울리는 균형잡힌 요가클래스 :)
• 그룹요가/ 교육/ 요가지도자과정T.T.C
• Private 1:1 개인레슨/ 2:1 듀엣레슨
• 요가프로필/ 만삭요가/ 커플요가 촬영
• 산전산후요가/ 임산부요가지도자과정', 
  'https://lh3.googleusercontent.com/p/AF1QipPDXLR1TDrq94cPpGERG7xeearBCh-lIB227qU3=w408-h273-k-no', 
  37.552071, 
  126.922943, 
  NOW(), 
  NOW()
);
