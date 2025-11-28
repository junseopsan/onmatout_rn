-- 하루에 여러 번의 수련 기록을 허용하도록 스키마 수정
DROP TABLE IF EXISTS practice_records CASCADE;

CREATE TABLE practice_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_date DATE NOT NULL,
  practice_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 수련 시간 추가
  asanas JSONB NOT NULL DEFAULT '[]', -- Asana ID 배열
  memo TEXT,
  states JSONB NOT NULL DEFAULT '[]', -- 상태 배열
  photos JSONB NOT NULL DEFAULT '[]', -- 사진 URL 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- UNIQUE(user_id, practice_date) 제거 - 하루에 여러 기록 허용
);

-- RLS 활성화
ALTER TABLE practice_records ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
CREATE POLICY "Users can view their own records" ON practice_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records" ON practice_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records" ON practice_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records" ON practice_records
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 트리거 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_practice_records_updated_at
  BEFORE UPDATE ON practice_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
