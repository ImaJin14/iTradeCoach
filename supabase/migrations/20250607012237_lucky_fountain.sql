/*
  # Complete iTradeCoach Database Schema Migration
  
  This migration creates the complete database schema for the iTradeCoach application,
  including all features:
  
  1. User Management & Profiles
  2. Coach & Student Profiles
  3. Subscription System
  4. Course Management
  5. Session Management (1-on-1 and Live Sessions)
  6. Session Requests & Approval Workflow
  7. Coach Availability System
  8. Video Templates & Responses (Tavus integration)
  9. Testimonials & Reviews
  10. Community Features
  11. Storage for file uploads
  12. Row Level Security (RLS) policies
  13. Performance indexes
  14. Triggers and functions
*/

-- ================================================================
-- STEP 1: CREATE CUSTOM TYPES
-- ================================================================

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    -- Create user_role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'coach', 'admin');
    END IF;
    
    -- Create verification_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
    END IF;
    
    -- Create session_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');
    END IF;
    
    -- Create student_level enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_level') THEN
        CREATE TYPE student_level AS ENUM ('beginner', 'intermediate', 'advanced');
    END IF;
    
    -- Create course_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_status') THEN
        CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
    END IF;
    
    -- Create request_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'scheduled');
    END IF;
    
    -- Create availability_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
        CREATE TYPE availability_status AS ENUM ('available', 'busy', 'maybe');
    END IF;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE LOG 'Error creating custom types: %', SQLERRM;
        RAISE;
END $$;

-- ================================================================
-- STEP 2: CREATE CORE TABLES
-- ================================================================

-- Core profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(id),
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
  updated_at timestamptz NOT NULL DEFAULT now(),
  subscription_status text DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'suspended', 'banned'))
);

-- Coach-specific profile data
CREATE TABLE IF NOT EXISTS coach_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio text NOT NULL DEFAULT '',
  expertise_areas text[] DEFAULT '{}',
  hourly_rate numeric(10,2) DEFAULT 0 CHECK (hourly_rate >= 0),
  video_intro_url text,
  verification_status verification_status DEFAULT 'pending',
  algorand_wallet text,
  rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_students integer DEFAULT 0 CHECK (total_students >= 0),
  earnings numeric(10,2) DEFAULT 0 CHECK (earnings >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  subscription_required boolean DEFAULT true,
  subscription_active boolean DEFAULT false
);

-- Student-specific profile data
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  learning_goals text[] DEFAULT '{}',
  current_level student_level DEFAULT 'beginner',
  tokens_earned integer DEFAULT 0 CHECK (tokens_earned >= 0),
  courses_completed text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  selected_path text,
  selected_coach_id uuid REFERENCES profiles(id),
  subscription_required boolean DEFAULT false
);

-- ================================================================
-- STEP 3: SUBSCRIPTION SYSTEM
-- ================================================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  role user_role NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id text REFERENCES subscription_plans(id),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment history
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id),
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'USD',
  status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),
  payment_method text,
  created_at timestamptz DEFAULT now()
);

-- ================================================================
-- STEP 4: COURSE MANAGEMENT SYSTEM
-- ================================================================

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  level student_level NOT NULL,
  category text NOT NULL,
  duration text NOT NULL,
  price numeric(10,2) DEFAULT 0 CHECK (price >= 0),
  thumbnail text,
  learning_objectives text NOT NULL,
  prerequisites text,
  tags text[] DEFAULT '{}',
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status course_status DEFAULT 'draft',
  is_hidden boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- ================================================================
-- STEP 5: SESSION MANAGEMENT SYSTEM
-- ================================================================

-- 1-on-1 coaching sessions
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
  CONSTRAINT different_participants CHECK (coach_id != student_id)
);

-- Live group sessions
CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  learning_path student_level NOT NULL,
  scheduled_time timestamptz NOT NULL,
  duration integer NOT NULL CHECK (duration > 0), -- in minutes
  max_participants integer NOT NULL DEFAULT 10 CHECK (max_participants > 0),
  current_participants integer NOT NULL DEFAULT 0 CHECK (current_participants >= 0),
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  meeting_url text,
  recording_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_participants CHECK (current_participants <= max_participants)
);

-- Session enrollments for live sessions
CREATE TABLE IF NOT EXISTS session_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'attended', 'missed', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- ================================================================
-- STEP 6: SESSION REQUEST & APPROVAL WORKFLOW
-- ================================================================

-- Session requests table for student-coach booking workflow
CREATE TABLE IF NOT EXISTS session_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_time timestamptz NOT NULL,
  duration integer NOT NULL CHECK (duration > 0), -- in minutes
  topic text NOT NULL,
  message text NOT NULL,
  learning_goals text,
  status request_status DEFAULT 'pending',
  coach_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT different_request_participants CHECK (student_id != coach_id)
);

-- Coach availability system
CREATE TABLE IF NOT EXISTS coach_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  status availability_status DEFAULT 'available',
  notes text,
  is_recurring boolean NOT NULL DEFAULT true,
  specific_date date, -- for one-time availability changes
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- ================================================================
-- STEP 7: VIDEO SYSTEM (TAVUS INTEGRATION)
-- ================================================================

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

-- ================================================================
-- STEP 8: TESTIMONIALS & REVIEWS
-- ================================================================

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

-- ================================================================
-- STEP 9: COMMUNITY FEATURES
-- ================================================================

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  participants integer DEFAULT 0,
  prize text,
  end_date timestamptz NOT NULL,
  reddit_url text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  host_id uuid REFERENCES profiles(id),
  type text NOT NULL,
  reddit_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id),
  replies integer DEFAULT 0,
  category text NOT NULL,
  reddit_url text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- STEP 10: USER SETTINGS
-- ================================================================

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  notifications jsonb DEFAULT '{"email": true, "push": true, "marketing": false}'::jsonb,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- STEP 11: CREATE FUNCTIONS
-- ================================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value user_role;
  user_name text;
BEGIN
  -- Safely get the role or default to 'student'
  user_role_value := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'student'::user_role
  );

  -- Safely get the name, defaulting to email part if needed
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role_value
  );

  -- Insert into appropriate role-specific table
  IF user_role_value = 'coach' THEN
    INSERT INTO public.coach_profiles (user_id)
    VALUES (NEW.id);
  ELSE
    INSERT INTO public.student_profiles (user_id)
    VALUES (NEW.id);
  END IF;

  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
    -- Re-raise the error to prevent user creation if profile creation fails
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check subscription requirements
CREATE OR REPLACE FUNCTION check_subscription_requirements()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the role has changed or it's a new insert
  IF (TG_OP = 'INSERT') OR (NEW.role IS DISTINCT FROM OLD.role) THEN
    -- For coaches, subscription is always required
    IF NEW.role = 'coach' THEN
      UPDATE coach_profiles
      SET subscription_required = true
      WHERE user_id = NEW.id;
    END IF;

    -- For students, subscription becomes required when they select a path
    IF NEW.role = 'student' THEN
        UPDATE student_profiles
        SET subscription_required = EXISTS (
            SELECT 1
            FROM student_profiles
            WHERE user_id = NEW.id
            AND selected_path IS NOT NULL
        )
        WHERE user_id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET subscription_status = NEW.status
  WHERE id = NEW.user_id;

  IF NEW.status = 'active' THEN
    -- Update role-specific subscription flag
    IF EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = NEW.user_id) THEN
      UPDATE coach_profiles
      SET subscription_active = true
      WHERE user_id = NEW.user_id;
    END IF;
  ELSE
    -- Reset subscription flags when not active
    UPDATE coach_profiles
    SET subscription_active = false
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update participant count for live sessions
CREATE OR REPLACE FUNCTION update_session_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE live_sessions
    SET current_participants = current_participants + 1
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE live_sessions
    SET current_participants = current_participants - 1
    WHERE id = OLD.session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- STEP 12: CREATE TRIGGERS
-- ================================================================

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS check_subscription_requirements_trigger ON profiles;
DROP TRIGGER IF EXISTS update_student_subscription_required ON student_profiles;
DROP TRIGGER IF EXISTS update_subscription_status_trigger ON subscriptions;
DROP TRIGGER IF EXISTS update_participant_count_trigger ON session_enrollments;

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_coach_profiles_updated_at ON coach_profiles;
DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_course_enrollments_updated_at ON course_enrollments;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;
DROP TRIGGER IF EXISTS update_session_enrollments_updated_at ON session_enrollments;
DROP TRIGGER IF EXISTS update_session_requests_updated_at ON session_requests;
DROP TRIGGER IF EXISTS update_coach_availability_updated_at ON coach_availability;
DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_video_templates_updated_at ON video_templates;
DROP TRIGGER IF EXISTS update_video_responses_updated_at ON video_responses;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER check_subscription_requirements_trigger
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_requirements();

CREATE TRIGGER update_student_subscription_required
  AFTER UPDATE OF selected_path ON student_profiles
  FOR EACH ROW
  WHEN (NEW.selected_path IS DISTINCT FROM OLD.selected_path)
  EXECUTE FUNCTION check_subscription_requirements();

CREATE TRIGGER update_subscription_status_trigger
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_status();

CREATE TRIGGER update_participant_count_trigger
  AFTER INSERT OR DELETE ON session_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_session_participant_count();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at 
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at 
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at 
  BEFORE UPDATE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_enrollments_updated_at
  BEFORE UPDATE ON session_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_requests_updated_at
  BEFORE UPDATE ON session_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_availability_updated_at
  BEFORE UPDATE ON coach_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at 
  BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_templates_updated_at
  BEFORE UPDATE ON video_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_responses_updated_at
  BEFORE UPDATE ON video_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- STEP 13: ENABLE ROW LEVEL SECURITY AND CREATE POLICIES
-- ================================================================

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Coach profiles are publicly viewable" ON coach_profiles;
DROP POLICY IF EXISTS "Coaches can update own profile" ON coach_profiles;
DROP POLICY IF EXISTS "System can insert coach profiles" ON coach_profiles;
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can update own profile" ON student_profiles;
DROP POLICY IF EXISTS "System can insert student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Subscription plans are viewable by everyone" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own payment history" ON payment_history;
DROP POLICY IF EXISTS "Courses are viewable by authenticated users" ON courses;
DROP POLICY IF EXISTS "Coaches can manage own courses" ON courses;
DROP POLICY IF EXISTS "Students can view enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Students can manage own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Session participants can view sessions" ON sessions;
DROP POLICY IF EXISTS "Session participants can update sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON sessions;
DROP POLICY IF EXISTS "Coaches can manage their own sessions" ON live_sessions;
DROP POLICY IF EXISTS "Students can view published sessions" ON live_sessions;
DROP POLICY IF EXISTS "Students can manage their own enrollments" ON session_enrollments;
DROP POLICY IF EXISTS "Coaches can view enrollments for their sessions" ON session_enrollments;
DROP POLICY IF EXISTS "Students can manage their own requests" ON session_requests;
DROP POLICY IF EXISTS "Coaches can view and respond to their requests" ON session_requests;
DROP POLICY IF EXISTS "Coaches can manage their own availability" ON coach_availability;
DROP POLICY IF EXISTS "Students can view coach availability" ON coach_availability;
DROP POLICY IF EXISTS "Approved testimonials are publicly viewable" ON testimonials;
DROP POLICY IF EXISTS "Users can view own testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can create testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can update own testimonials" ON testimonials;
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON challenges;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Discussions are viewable by everyone" ON discussions;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "System can insert user settings" ON user_settings;
DROP POLICY IF EXISTS "Coaches can create templates" ON video_templates;
DROP POLICY IF EXISTS "Coaches can view own templates" ON video_templates;
DROP POLICY IF EXISTS "Coaches can update own templates" ON video_templates;
DROP POLICY IF EXISTS "Coaches can create responses" ON video_responses;
DROP POLICY IF EXISTS "Participants can view responses" ON video_responses;

-- Profile policies
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Coach profiles policies
CREATE POLICY "Coach profiles are publicly viewable"
  ON coach_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches can update own profile"
  ON coach_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert coach profiles"
  ON coach_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Student profiles policies
CREATE POLICY "Students can view own profile"
  ON student_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile"
  ON student_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert student profiles"
  ON student_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Subscription plans policies
CREATE POLICY "Subscription plans are viewable by everyone"
  ON subscription_plans FOR SELECT TO public USING (true);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Payment history policies
CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Courses policies
CREATE POLICY "Courses are viewable by authenticated users"
  ON courses FOR SELECT TO authenticated
  USING (status = 'published' OR auth.uid() = coach_id);

CREATE POLICY "Coaches can manage own courses"
  ON courses FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Course enrollments policies
CREATE POLICY "Students can view enrollments"
  ON course_enrollments FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR auth.uid() IN (
    SELECT coach_id FROM courses WHERE courses.id = course_enrollments.course_id
  ));

CREATE POLICY "Students can manage own enrollments"
  ON course_enrollments FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Sessions policies
CREATE POLICY "Session participants can view sessions"
  ON sessions FOR SELECT TO authenticated
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

CREATE POLICY "Session participants can update sessions"
  ON sessions FOR UPDATE TO authenticated
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

CREATE POLICY "Authenticated users can create sessions"
  ON sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = coach_id OR auth.uid() = student_id);

-- Live sessions policies
CREATE POLICY "Coaches can manage their own sessions"
  ON live_sessions FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Students can view published sessions"
  ON live_sessions FOR SELECT TO authenticated
  USING (status IN ('scheduled', 'live'));

-- Session enrollments policies
CREATE POLICY "Students can manage their own enrollments"
  ON session_enrollments FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view enrollments for their sessions"
  ON session_enrollments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE live_sessions.id = session_enrollments.session_id
      AND live_sessions.coach_id = auth.uid()
    )
  );

-- Session requests policies
CREATE POLICY "Students can manage their own requests"
  ON session_requests FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view and respond to their requests"
  ON session_requests FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Coach availability policies
CREATE POLICY "Coaches can manage their own availability"
  ON coach_availability FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Students can view coach availability"
  ON coach_availability FOR SELECT TO authenticated
  USING (true);

-- Testimonials policies
CREATE POLICY "Approved testimonials are publicly viewable"
  ON testimonials FOR SELECT TO public
  USING (approved = true);

CREATE POLICY "Users can view own testimonials"
  ON testimonials FOR SELECT TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can create testimonials"
  ON testimonials FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own testimonials"
  ON testimonials FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

-- Community features policies
CREATE POLICY "Challenges are viewable by everyone"
  ON challenges FOR SELECT TO public USING (true);

CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT TO public USING (true);

CREATE POLICY "Discussions are viewable by everyone"
  ON discussions FOR SELECT TO public USING (true);

-- User settings policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert user settings"
  ON user_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Video templates policies
CREATE POLICY "Coaches can create templates"
  ON video_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can view own templates"
  ON video_templates FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own templates"
  ON video_templates FOR UPDATE TO authenticated
  USING (auth.uid() = coach_id);

-- Video responses policies
CREATE POLICY "Coaches can create responses"
  ON video_responses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Participants can view responses"
  ON video_responses FOR SELECT TO authenticated
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

-- ================================================================
-- STEP 14: CREATE INDEXES FOR PERFORMANCE
-- ================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Coach profile indexes
CREATE INDEX IF NOT EXISTS idx_coach_profiles_rating ON coach_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_verification ON coach_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_subscription ON coach_profiles(subscription_active);

-- Student profile indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_level ON student_profiles(current_level);
CREATE INDEX IF NOT EXISTS idx_student_profiles_subscription ON student_profiles(subscription_required);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON payment_history(subscription_id);

-- Course indexes
CREATE INDEX IF NOT EXISTS idx_courses_coach ON courses(coach_id);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_hidden ON courses(is_hidden);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_time ON sessions(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Live session indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_coach ON live_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled_time ON live_sessions(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_live_sessions_learning_path ON live_sessions(learning_path);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_session ON session_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_student ON session_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_status ON session_enrollments(status);

-- Session request indexes
CREATE INDEX IF NOT EXISTS idx_session_requests_student ON session_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_coach ON session_requests(coach_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_status ON session_requests(status);
CREATE INDEX IF NOT EXISTS idx_session_requests_preferred_time ON session_requests(preferred_time);

-- Coach availability indexes
CREATE INDEX IF NOT EXISTS idx_coach_availability_coach ON coach_availability(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_availability_day ON coach_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_coach_availability_status ON coach_availability(status);

-- Testimonial indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_author ON testimonials(author_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);

-- Video indexes
CREATE INDEX IF NOT EXISTS idx_video_templates_coach ON video_templates(coach_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_coach ON video_responses(coach_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_student ON video_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_template ON video_responses(template_id);

-- ================================================================
-- STEP 15: INSERT DEFAULT DATA
-- ================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price, interval, role, features) VALUES
  ('coach_monthly', 'Coach Monthly', 'Monthly subscription for coaches', 49.99, 'month', 'coach',
   '[
      "Unlimited student sessions",
      "Profile verification",
      "Analytics dashboard",
      "Priority support",
      "Live session scheduling",
      "Course creation tools"
    ]'::jsonb),
  ('coach_yearly', 'Coach Yearly', 'Yearly subscription for coaches', 499.99, 'year', 'coach',
   '[
      "Unlimited student sessions",
      "Profile verification",
      "Analytics dashboard",
      "Priority support",
      "Live session scheduling",
      "Course creation tools",
      "20% discount"
    ]'::jsonb),
  ('student_monthly', 'Student Monthly', 'Monthly subscription for students', 29.99, 'month', 'student',
   '[
      "Access to all learning paths",
      "1-on-1 coaching sessions",
      "Live group sessions",
      "Community access",
      "Practice exercises",
      "Course enrollment"
    ]'::jsonb),
  ('student_yearly', 'Student Yearly', 'Yearly subscription for students', 299.99, 'year', 'student',
   '[
      "Access to all learning paths",
      "1-on-1 coaching sessions",
      "Live group sessions",
      "Community access",
      "Practice exercises",
      "Course enrollment",
      "20% discount"
    ]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert sample testimonials
INSERT INTO testimonials (text, author_id, author_name, author_title, rating, approved) VALUES
  ('iTradeCoach transformed my understanding of cryptocurrency trading. The personalized coaching approach helped me develop confidence and practical skills.', 
   gen_random_uuid(), 'Sarah Johnson', 'Marketing Manager', 5, true),
  ('The live sessions and community support made learning enjoyable and effective. I went from complete beginner to confident trader in just 3 months.',
   gen_random_uuid(), 'Michael Chen', 'Software Engineer', 5, true),
  ('Excellent platform with knowledgeable coaches. The structured learning paths and real-world examples made complex concepts easy to understand.',
   gen_random_uuid(), 'Emma Rodriguez', 'Business Analyst', 4, true),
  ('Outstanding coaching experience! The personalized feedback and practical strategies helped me achieve my trading goals faster than I expected.',
   gen_random_uuid(), 'David Thompson', 'Financial Advisor', 5, true)
ON CONFLICT DO NOTHING;

-- ================================================================
-- STEP 16: SETUP STORAGE (Avatar and Course Thumbnails)
-- ================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can upload course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can update course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Course thumbnail files are publicly accessible" ON storage.objects;

-- Storage policies for avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatar files are publicly accessible"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Storage policies for course thumbnails
CREATE POLICY "Coaches can upload course thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'course-thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Coaches can update course thumbnails"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'course-thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Coaches can delete course thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'course-thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Course thumbnail files are publicly accessible"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'course-thumbnails');

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'iTradeCoach complete database schema migration completed successfully!';
  RAISE NOTICE 'Created tables: profiles, coach_profiles, student_profiles, subscription_plans, subscriptions, payment_history, courses, course_enrollments, sessions, live_sessions, session_enrollments, session_requests, coach_availability, video_templates, video_responses, testimonials, challenges, events, discussions, user_settings';
  RAISE NOTICE 'Created functions: handle_new_user, check_subscription_requirements, update_subscription_status, update_session_participant_count, update_updated_at_column';
  RAISE NOTICE 'Created triggers for user registration, subscription management, and timestamp updates';
  RAISE NOTICE 'Enabled Row Level Security with comprehensive policies';
  RAISE NOTICE 'Created performance indexes for all major query patterns';
  RAISE NOTICE 'Set up storage buckets for avatars and course thumbnails';
  RAISE NOTICE 'Inserted default subscription plans and sample testimonials';
END $$;