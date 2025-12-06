-- studio_promotions.promotion_type 컬럼을 ENUM 타입으로 변경합니다.
-- 값은 'one_time' | 'recurring' 두 가지만 선택 가능하도록 제한합니다.

-- 1) ENUM 타입 생성 (이미 있다면 에러가 나므로 DO 블록으로 감쌉니다)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'promotion_type_enum'
  ) THEN
    CREATE TYPE promotion_type_enum AS ENUM ('one_time', 'recurring');
  END IF;
END$$;

-- 2) 기존 text 컬럼을 ENUM 타입으로 변경
ALTER TABLE public.studio_promotions
  ALTER COLUMN promotion_type DROP DEFAULT,
  ALTER COLUMN promotion_type TYPE promotion_type_enum
    USING (
      CASE
        WHEN promotion_type IN ('one_time', 'recurring')
          THEN promotion_type::promotion_type_enum
        ELSE 'one_time'::promotion_type_enum
      END
    ),
  ALTER COLUMN promotion_type SET DEFAULT 'one_time'::promotion_type_enum,
  ALTER COLUMN promotion_type SET NOT NULL;


