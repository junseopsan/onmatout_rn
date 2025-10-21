-- 기존 아사나 데이터에 샘플 산스크리트어 정보 업데이트

-- 바라드바자아사나 2 업데이트 (기존 데이터 기반)
UPDATE asanas 
SET 
    sanskrit_name_kr = '바라드바자아사나 2',
    sanskrit_name_en = 'Bharadvajasana II',
    sanskrit_pronunciation_kr = '바라드바자아사나',
    sanskrit_pronunciation_en = 'Bharadvajasana',
    sanskrit_meaning = 'Bharadvaja (현자 바라드바자)'
WHERE id = '0094b10d-f926-49d9-848e-4904d7fb5706';

-- 다른 샘플 아사나들도 업데이트 (예시)
-- UPDATE asanas 
-- SET 
--     sanskrit_name_kr = '아도무카스바나사나',
--     sanskrit_name_en = 'Adho Mukha Svanasana',
--     sanskrit_pronunciation_kr = '아도무카스바나사나',
--     sanskrit_pronunciation_en = 'Adho Mukha Svanasana',
--     sanskrit_meaning = 'Adho (아래로) + Mukha (얼굴) + Svana (개) + Asana (자세)'
-- WHERE image_number = '001';

-- 업데이트된 데이터 확인
SELECT 
    id,
    image_number,
    sanskrit_name_kr,
    sanskrit_name_en,
    sanskrit_pronunciation_kr,
    sanskrit_pronunciation_en,
    sanskrit_meaning,
    asana_meaning
FROM asanas 
WHERE sanskrit_name_kr IS NOT NULL
LIMIT 10;
