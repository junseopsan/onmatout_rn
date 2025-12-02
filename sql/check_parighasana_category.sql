-- 파리가아사나의 카테고리 확인
SELECT 
  id,
  sanskrit_name_kr,
  sanskrit_name_en,
  category_name_en,
  CASE 
    WHEN category_name_en IS NULL THEN 'NULL'
    WHEN category_name_en = '' THEN '빈 문자열'
    WHEN TRIM(category_name_en) = '' THEN '공백만'
    ELSE category_name_en
  END as category_status
FROM asanas
WHERE 
  sanskrit_name_kr LIKE '%파리가%' 
  OR sanskrit_name_en ILIKE '%parigha%'
  OR category_name_en = 'SideBend'
  OR category_name_en ILIKE '%side%';

-- 측굴 카테고리 전체 아사나 확인
SELECT 
  COUNT(*) as total_count,
  category_name_en
FROM asanas
WHERE category_name_en IS NOT NULL
  AND category_name_en != ''
  AND TRIM(category_name_en) != ''
GROUP BY category_name_en
ORDER BY total_count DESC;

