/*
  # Initial Schema Setup for iTradeCoach

  1. New Tables
    - `profiles`
      - Core user profile data including authentication details
      - Social links and basic info
    - `coach_profiles`
      - Extended profile data for coaches
      - Expertise, rates, and verification status
    - `student_profiles`
      - Extended profile data for students
      - Learning progress and achievements
    - `sessions`
      - Coaching session records
      - Scheduling and payment details
    - `user_settings`
      - User preferences and configurations

  2. Storage
    - Create avatars bucket for profile pictures

  3. Security
    - Enable RLS on all tables
    - Add appropriate access policies
    - Set up storage bucket policies
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'coach', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE student_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create profiles table
CREATE TABLE profiles (
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

-- Create coach_profiles table
CREATE TABLE coach_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio text,
  expertise_areas text[] DEFAULT '{}',
  hourly_rate numeric(10,2) DEFAULT 0,
  video_intro_url text,
  verification_status verification_status DEFAULT 'pending',
  algorand_wallet text,
  rating numeric(3,2) DEFAULT 0,
  total_students integer DEFAULT 0,
  earnings numeric(10,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create student_profiles table
CREATE TABLE student_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  learning_goals text[] DEFAULT '{}',
  current_level student_level DEFAULT 'beginner',
  tokens_earned integer DEFAULT 0,
  courses_completed text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create sessions table
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  duration integer NOT NULL DEFAULT 60,
  status session_status DEFAULT 'scheduled',
  price numeric(10,2) NOT NULL,
  algorand_tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_settings table
CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  notifications jsonb DEFAULT '{"email": true, "push": true, "marketing": false}'::jsonb,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles are readable by authenticated users
CREATE POLICY "Profiles are readable by authenticated users"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profiles
CREATE POLICY "Users can update own profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profiles
CREATE POLICY "Users can insert own profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Coach profiles are publicly readable
CREATE POLICY "Coach profiles are public"
  ON coach_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Coaches can update their own profiles
CREATE POLICY "Coaches can update own profiles"
  ON coach_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Students can read their own profiles
CREATE POLICY "Students can read own profiles"
  ON student_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Students can update their own profiles
CREATE POLICY "Students can update own profiles"
  ON student_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sessions are readable by participants
CREATE POLICY "Sessions are readable by participants"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

-- Sessions can be updated by participants
CREATE POLICY "Sessions can be updated by participants"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

-- User settings policies
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX coach_profiles_rating_idx ON coach_profiles(rating);
CREATE INDEX sessions_scheduled_time_idx ON sessions(scheduled_time);
CREATE INDEX sessions_coach_id_idx ON sessions(coach_id);
CREATE INDEX sessions_student_id_idx ON sessions(student_id);
CREATE INDEX user_settings_user_id_idx ON user_settings(user_id);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatar files are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');