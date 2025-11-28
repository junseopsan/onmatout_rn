-- ONMATOUT Database Schema
-- Supabase SQL Editor에서 실행하세요

-- 1. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 설정 테이블
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  notifications BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'en')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 아사나 카테고리 테이블 (기존 테이블이 있다면 건너뛰기)
-- CREATE TABLE IF NOT EXISTS asana_category (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   name TEXT NOT NULL,
--   description TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 4. 아사나 테이블 (기존 테이블이 있다면 건너뛰기)
-- CREATE TABLE IF NOT EXISTS asanas (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   name_ko TEXT NOT NULL,
--   name_sanskrit TEXT,
--   name_english TEXT,
--   description TEXT,
--   benefits TEXT,
--   category_name_en TEXT, -- 실제 컬럼명
--   difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
--   meaning TEXT,
--   image_url TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 5. 수련 기록 테이블
CREATE TABLE IF NOT EXISTS practice_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asana_id UUID REFERENCES asanas(id) ON DELETE CASCADE,
  emotion TEXT CHECK (emotion IN ('happy', 'calm', 'energized', 'focused', 'relaxed', 'stressed', 'tired')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  focus_level INTEGER CHECK (focus_level BETWEEN 1 AND 5),
  memo TEXT,
  practice_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 요가원 테이블
CREATE TABLE IF NOT EXISTS studios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  description TEXT,
  image_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 요가원 운영시간 테이블
CREATE TABLE IF NOT EXISTS studio_operating_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=일요일, 6=토요일
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 사용자 즐겨찾기 아사나 테이블
CREATE TABLE IF NOT EXISTS user_favorite_asanas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asana_id UUID REFERENCES asanas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asana_id)
);

-- RLS (Row Level Security) 설정
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY; -- 주석 처리
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_asanas ENABLE ROW LEVEL SECURITY;

-- 기존 아사나 테이블들에 RLS 활성화
ALTER TABLE asanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE asanacategory ENABLE ROW LEVEL SECURITY;

-- 사용자 프로필 RLS 정책
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- UPSERT를 위한 추가 정책
CREATE POLICY "Users can upsert own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 사용자 설정 RLS 정책
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 수련 기록 RLS 정책
CREATE POLICY "Users can view own records" ON practice_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON practice_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON practice_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON practice_records
  FOR DELETE USING (auth.uid() = user_id);

-- 즐겨찾기 아사나 RLS 정책
CREATE POLICY "Users can view own favorites" ON user_favorite_asanas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON user_favorite_asanas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON user_favorite_asanas
  FOR DELETE USING (auth.uid() = user_id);

-- 기존 아사나 테이블들에 RLS 정책 추가
CREATE POLICY "Anyone can view asanas" ON asanas
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view asana categories" ON asanacategory
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view studios" ON studios
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view studio operating hours" ON studio_operating_hours
  FOR SELECT USING (true);

-- 함수: 새 사용자 생성 시 프로필 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email);
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: 새 사용자 생성 시 자동으로 프로필 생성
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_practice_records_user_date ON practice_records(user_id, practice_date);
CREATE INDEX IF NOT EXISTS idx_practice_records_asana ON practice_records(asana_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorite_asanas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_asana ON user_favorite_asanas(asana_id);

-- 기존 테이블 구조 확인 (참고용)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'asanas';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'asanacategory';

-- 기존 아사나 테이블의 실제 컬럼에 맞춰 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_asanas_category_name_en ON asanas(category_name_en);
-- CREATE INDEX IF NOT EXISTS idx_asanas_difficulty ON asanas(difficulty_level); 