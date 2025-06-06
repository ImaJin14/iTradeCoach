/*
  # iTradeCoach Database Schema
  
  Complete schema setup including:
  - User profiles and role-based extensions
  - Coaching sessions and testimonials
  - Video templates and responses (Tavus integration)
  - Storage for avatars
  - Row Level Security policies
*/

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'coach', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE student_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Core profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  bio text,
  website text,
  twitter text,
  linkedin text,
  avatar_url text,
  profile_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Coach-specific profile data
CREATE TABLE IF NOT EXISTS coach_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio text NOT NULL DEFAULT '',
  expertise_areas text[] DEFAULT '{}',
  hourly_rate numeric(10,2) DEFAULT 0,
  video_intro_url text,
  verification_status verification_status DEFAULT 'pending',
  algorand_wallet text,
  rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_students integer DEFAULT 0 CHECK (total_students >= 0),
  earnings numeric(10,2) DEFAULT 0 CHECK (earnings >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Student-specific profile data
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  learning_goals text[] DEFAULT '{}',
  current_level student_level DEFAULT 'beginner',
  tokens_earned integer DEFAULT 0 CHECK (tokens_earned >= 0),
  courses_completed text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Coaching sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  duration integer NOT NULL DEFAULT 60 CHECK (duration > 0),
  status session_status DEFAULT 'scheduled',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  algorand_tx_hash text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure coach and student are different people
  CONSTRAINT different_participants CHECK (coach_id != student_id)
);

-- User testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_title text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  approved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  notifications jsonb DEFAULT '{"email": true, "push": true, "marketing": false}'::jsonb,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Video templates table (Tavus integration)
CREATE TABLE IF NOT EXISTS video_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tavus_template_id text NOT NULL,
  name text NOT NULL,
  description text,
  script text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Video responses table (Tavus integration)
CREATE TABLE IF NOT EXISTS video_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES video_templates(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tavus_video_id text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    (NEW.raw_user_meta_data->>'role')::user_role
  );

  IF (NEW.raw_user_meta_data->>'role')::text = 'coach' THEN
    INSERT INTO public.coach_profiles (user_id)
    VALUES (NEW.id);
  ELSE
    INSERT INTO public.student_profiles (user_id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers and recreate (to avoid conflicts)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coach_profiles_updated_at ON coach_profiles;
CREATE TRIGGER update_coach_profiles_updated_at BEFORE UPDATE ON coach_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for video tables
DROP TRIGGER IF EXISTS update_video_templates_updated_at ON video_templates;
CREATE TRIGGER update_video_templates_updated_at
  BEFORE UPDATE ON video_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_responses_updated_at ON video_responses;
CREATE TRIGGER update_video_responses_updated_at
  BEFORE UPDATE ON video_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate (to avoid conflicts)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

-- Coach profiles policies
DROP POLICY IF EXISTS "Coach profiles are publicly viewable" ON coach_profiles;
CREATE POLICY "Coach profiles are publicly viewable"
  ON coach_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Coaches can update own profile" ON coach_profiles;
CREATE POLICY "Coaches can update own profile"
  ON coach_profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert coach profiles" ON coach_profiles;
CREATE POLICY "System can insert coach profiles"
  ON coach_profiles FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Student profiles policies
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
CREATE POLICY "Students can view own profile"
  ON student_profiles FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update own profile" ON student_profiles;
CREATE POLICY "Students can update own profile"
  ON student_profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert student profiles" ON student_profiles;
CREATE POLICY "System can insert student profiles"
  ON student_profiles FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Sessions policies
DROP POLICY IF EXISTS "Session participants can view sessions" ON sessions;
CREATE POLICY "Session participants can view sessions"
  ON sessions FOR SELECT TO authenticated 
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "Session participants can update sessions" ON sessions;
CREATE POLICY "Session participants can update sessions"
  ON sessions FOR UPDATE TO authenticated 
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "Authenticated users can create sessions" ON sessions;
CREATE POLICY "Authenticated users can create sessions"
  ON sessions FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = coach_id OR auth.uid() = student_id);

-- Testimonials policies
DROP POLICY IF EXISTS "Approved testimonials are publicly viewable" ON testimonials;
CREATE POLICY "Approved testimonials are publicly viewable"
  ON testimonials FOR SELECT TO public 
  USING (approved = true);

DROP POLICY IF EXISTS "Users can view own testimonials" ON testimonials;
CREATE POLICY "Users can view own testimonials"
  ON testimonials FOR SELECT TO authenticated 
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can create testimonials" ON testimonials;
CREATE POLICY "Users can create testimonials"
  ON testimonials FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own testimonials" ON testimonials;
CREATE POLICY "Users can update own testimonials"
  ON testimonials FOR UPDATE TO authenticated 
  USING (auth.uid() = author_id);

-- User settings policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert user settings" ON user_settings;
CREATE POLICY "System can insert user settings"
  ON user_settings FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Video templates policies
DROP POLICY IF EXISTS "Coaches can create templates" ON video_templates;
CREATE POLICY "Coaches can create templates"
  ON video_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can view own templates" ON video_templates;
CREATE POLICY "Coaches can view own templates"
  ON video_templates FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can update own templates" ON video_templates;
CREATE POLICY "Coaches can update own templates"
  ON video_templates FOR UPDATE TO authenticated
  USING (auth.uid() = coach_id);

-- Video responses policies
DROP POLICY IF EXISTS "Coaches can create responses" ON video_responses;
CREATE POLICY "Coaches can create responses"
  ON video_responses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Participants can view responses" ON video_responses;
CREATE POLICY "Participants can view responses"
  ON video_responses FOR SELECT TO authenticated
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

-- Performance indexes (create only if they don't exist)
DO $$ BEGIN
    CREATE INDEX idx_profiles_email ON profiles(email);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_profiles_role ON profiles(role);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_coach_profiles_rating ON coach_profiles(rating DESC);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_coach_profiles_verification ON coach_profiles(verification_status);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_sessions_scheduled_time ON sessions(scheduled_time);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_sessions_coach_id ON sessions(coach_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_sessions_student_id ON sessions(student_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_sessions_status ON sessions(status);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_testimonials_approved ON testimonials(approved);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_testimonials_author ON testimonials(author_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_testimonials_created_at ON testimonials(created_at DESC);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Video-related indexes
DO $$ BEGIN
    CREATE INDEX idx_video_templates_coach ON video_templates(coach_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_video_responses_coach ON video_responses(coach_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_video_responses_student ON video_responses(student_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_video_responses_template ON video_responses(template_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Avatar files are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar files are publicly accessible"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');