-- ================================================================
-- iTradeCoach Complete Database Schema
-- ================================================================
-- 
-- This schema provides a complete platform for trading education with:
-- - User management with role-based profiles (students, coaches, admins)
-- - Subscription system with payment tracking
-- - Coaching sessions and live sessions
-- - Blog system for content management
-- - Video templates and responses (Tavus integration)
-- - Session booking and availability management
-- - Testimonials and user settings
-- - Storage for avatars and other media
-- 
-- Created: 2025
-- Database: PostgreSQL with Supabase extensions
-- ================================================================

-- ================================================================
-- SECTION 1: CUSTOM TYPES AND ENUMS
-- ================================================================

DO $$ BEGIN
    -- User role types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'coach', 'admin');
    END IF;
    
    -- Verification status for coaches
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
    END IF;
    
    -- Session status types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');
    END IF;
    
    -- Student skill levels
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_level') THEN
        CREATE TYPE student_level AS ENUM ('beginner', 'intermediate', 'advanced');
    END IF;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE LOG 'Error creating custom types: %', SQLERRM;
        RAISE;
END $$;

-- ================================================================
-- SECTION 2: CORE USER TABLES
-- ================================================================

-- Main user profiles table

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  name TEXT,
  role TEXT CHECK (role IN ('student', 'coach')),
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles table 
CREATE TABLE IF NOT EXISTS user_profiles (
    prof_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    bio text,
    website text,
    twitter text,
    linkedin text,
    avatar_url text,
    profile_complete boolean NOT NULL DEFAULT false,
    subscription_status text DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Coach-specific profile extensions
CREATE TABLE IF NOT EXISTS coach_profiles (
    coach_id uuid PRIMARY KEY REFERENCES user_profiles(prof_id) ON DELETE CASCADE,
    expertise_areas text[] DEFAULT '{}',
    hourly_rate numeric(10,2) DEFAULT 0 CHECK (hourly_rate >= 0),
    video_intro_url text,
    verification_status verification_status DEFAULT 'pending',
    algorand_wallet text,
    rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_students integer DEFAULT 0 CHECK (total_students >= 0),
    earnings numeric(10,2) DEFAULT 0 CHECK (earnings >= 0),
    subscription_required boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Student-specific profile extensions
CREATE TABLE IF NOT EXISTS student_profiles (
    student_id uuid PRIMARY KEY REFERENCES user_profiles(prof_id) ON DELETE CASCADE,
    learning_goals text[] DEFAULT '{}',
    current_level student_level DEFAULT 'beginner',
    tokens_earned integer DEFAULT 0 CHECK (tokens_earned >= 0),
    courses_completed text[] DEFAULT '{}',
    selected_path text,
    selected_coach_id uuid REFERENCES coach_profiles(coach_id),
    subscription_required boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- User settings and preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id uuid PRIMARY KEY,
    prof_id uuid REFERENCES user_profiles(prof_id),
    notifications jsonb DEFAULT '{"email": true, "push": true, "marketing": false}'::jsonb,
    timezone text DEFAULT 'UTC',
    language text DEFAULT 'en',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- SECTION 3: SUBSCRIPTION SYSTEM
-- ================================================================

-- Available subscription plans
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
    prof_id uuid REFERENCES user_profiles(prof_id),
    plan_id text REFERENCES subscription_plans(id),
    --  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Payment history tracking
CREATE TABLE IF NOT EXISTS payment_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES subscriptions(id),
    prof_id uuid REFERENCES user_profiles(prof_id),
    amount numeric(10,2) NOT NULL CHECK (amount >= 0),
    currency text DEFAULT 'USD',
    status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),
    payment_method text,
    created_at timestamptz DEFAULT now()
);

-- ================================================================
-- SECTION 4: COACHING AND SESSIONS
-- ================================================================

-- 1-on-1 coaching sessions
CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id uuid NOT NULL REFERENCES coach_profiles(coach_id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    scheduled_time timestamptz NOT NULL,
    duration integer NOT NULL DEFAULT 60 CHECK (duration > 0),
    status session_status DEFAULT 'scheduled',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT different_participants CHECK (coach_id != student_id)
);

-- Session booking requests workflow
CREATE TABLE IF NOT EXISTS session_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id uuid NOT NULL REFERENCES coach_profiles(coach_id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    preferred_time timestamptz NOT NULL,
    duration integer NOT NULL CHECK (duration > 0),
    topic text NOT NULL,
    message text NOT NULL,
    learning_goals text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'scheduled')),
    coach_response text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT different_participants_requests CHECK (student_id != coach_id)
);

-- Coach availability schedule
CREATE TABLE IF NOT EXISTS coach_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id uuid NOT NULL REFERENCES coach_profiles(coach_id) ON DELETE CASCADE,
    day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time time NOT NULL,
    end_time time NOT NULL,
    status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'maybe')),
    notes text,
    is_recurring boolean NOT NULL DEFAULT true,
    specific_date date, -- for one-time changes
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    UNIQUE(coach_id, day_of_week, start_time, specific_date) 
);

-- ================================================================
-- SECTION 5: LIVE SESSIONS (GROUP SESSIONS)
-- ================================================================

-- Scheduled live group sessions
CREATE TABLE IF NOT EXISTS live_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id uuid NOT NULL REFERENCES coach_profiles(coach_id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    learning_path text NOT NULL CHECK (learning_path IN ('beginner', 'intermediate', 'advanced')),
    scheduled_time timestamptz NOT NULL,
    duration integer NOT NULL CHECK (duration > 0),
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

-- Student enrollments in live sessions
CREATE TABLE IF NOT EXISTS session_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    enrolled_at timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'attended', 'missed', 'cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(session_id, student_id)
);

-- Session recordings storage
CREATE TABLE IF NOT EXISTS session_recordings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    recording_url text NOT NULL,
    duration integer, -- in seconds
    file_size bigint, -- in bytes
    upload_status text NOT NULL DEFAULT 'processing' CHECK (upload_status IN ('processing', 'ready', 'failed')),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Live session feedback
CREATE TABLE IF NOT EXISTS live_session_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    live_session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(live_session_id, student_id) -- One feedback per student per live session
);

-- Session materials and resources
CREATE TABLE IF NOT EXISTS session_materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
    live_session_id uuid REFERENCES live_sessions(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    file_url text NOT NULL,
    file_type text NOT NULL CHECK (file_type IN ('pdf', 'video', 'audio', 'document', 'link')),
    uploaded_by uuid NOT NULL REFERENCES coach_profiles(coach_id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT session_reference_check CHECK (
        (session_id IS NOT NULL AND live_session_id IS NULL) OR 
        (session_id IS NULL AND live_session_id IS NOT NULL)
    ) -- Material belongs to either 1-on-1 or live session, not both
);

-- ================================================================
-- SECTION 6: VIDEO SYSTEM (TAVUS INTEGRATION)
-- ================================================================

-- Video templates for personalized responses
CREATE TABLE IF NOT EXISTS video_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id uuid NOT NULL REFERENCES coach_profiles(coach_id) ON DELETE CASCADE,
    tavus_template_id text NOT NULL,
    name text NOT NULL,
    description text,
    script text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Generated video responses
CREATE TABLE IF NOT EXISTS video_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL REFERENCES video_templates(id) ON DELETE CASCADE,
    coach_id uuid NOT NULL REFERENCES coach_profiles(coach_id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    tavus_video_id text NOT NULL,
    status text NOT NULL DEFAULT 'processing',
    url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- SECTION 7: CONTENT MANAGEMENT (BLOG & COURSES)
-- ================================================================

-- Blog categories
CREATE TABLE IF NOT EXISTS blog_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Blog tags
CREATE TABLE IF NOT EXISTS blog_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    excerpt text,
    content text NOT NULL,
    featured_image_url text,
    author_id uuid NOT NULL REFERENCES user_profiles(prof_id) ON DELETE CASCADE,
    category_id uuid REFERENCES blog_categories(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured boolean NOT NULL DEFAULT false,
    read_time integer DEFAULT 0, -- in minutes
    views_count integer DEFAULT 0,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Blog post tags (many-to-many)
CREATE TABLE IF NOT EXISTS blog_post_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(post_id, tag_id)
);

-- Blog comments
CREATE TABLE IF NOT EXISTS blog_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES user_profiles(prof_id) ON DELETE CASCADE,
    content text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id uuid NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    coach_id uuid NOT NULL REFERENCES coach_profiles(coach_id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    is_hidden boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- SECTION 8: TESTIMONIALS
-- ================================================================

-- User testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    text text NOT NULL,
    author_id uuid NOT NULL REFERENCES user_profiles(prof_id) ON DELETE CASCADE,
    author_name text NOT NULL,
    author_title text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    approved boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- DROP ALL EXISTING TRIGGERS AND POLICIES (AFTER TABLES ARE CREATED)
-- ================================================================

DO $$ 
DECLARE 
    rec RECORD;
BEGIN
    -- Drop all existing triggers from public schema tables
    FOR rec IN 
        SELECT t.tgname as trigger_name, c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND NOT t.tgisinternal  -- exclude system triggers
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', rec.trigger_name, rec.table_name);
    END LOOP;
    
    -- Drop all existing RLS policies from public schema tables
    FOR rec IN
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', rec.policyname, rec.tablename);
    END LOOP;
    
    RAISE NOTICE 'All existing triggers and policies dropped successfully!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error during cleanup: %', SQLERRM;
        -- Continue execution even if cleanup fails
END $$;

-- ================================================================
-- SECTION 9: UTILITY FUNCTIONS
-- ================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_value user_role;
    user_name text;
BEGIN
    -- Get role or default to 'student'
    user_role_value := COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role,
        'student'::user_role
    );

    -- Get name or default to email prefix
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    -- Insert into profiles table
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (NEW.id, NEW.email, user_name, user_role_value);

    -- REMOVE OR COMMENT OUT THIS LINE:
    -- INSERT INTO public.user_settings (id) VALUES (NEW.id);

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Populate role-specific tables
CREATE OR REPLACE FUNCTION populate_role_specific_tables()
RETURNS TABLE(students_added integer, coaches_added integer) AS $$
DECLARE
    student_count integer := 0;
    coach_count integer := 0;
BEGIN
    -- Insert students
    WITH inserted_students AS (
        INSERT INTO student_profiles (student_id)
        SELECT prof_id FROM user_profiles 
        WHERE role = 'student' AND prof_id NOT IN (SELECT student_id FROM student_profiles WHERE student_id IS NOT NULL)
        ON CONFLICT (student_id) DO NOTHING
        RETURNING student_id
    )
    SELECT COUNT(*) INTO student_count FROM inserted_students;

    -- Insert coaches
    WITH inserted_coaches AS (
        INSERT INTO coach_profiles (coach_id)
        SELECT prof_id FROM profiles 
        WHERE role = 'coach' AND prof_id NOT IN (SELECT coach_id FROM coach_profiles WHERE coach_id IS NOT NULL)
        ON CONFLICT (coach_id) DO NOTHING
        RETURNING coach_id
    )
    SELECT COUNT(*) INTO coach_count FROM inserted_coaches;

    RETURN QUERY SELECT student_count, coach_count;
END;
$$ LANGUAGE plpgsql;

-- Handle role changes
CREATE OR REPLACE FUNCTION handle_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NEW.role = 'student' THEN
            INSERT INTO student_profiles (student_id) VALUES (NEW.id) ON CONFLICT (student_id) DO NOTHING;
            DELETE FROM coach_profiles WHERE coach_id = NEW.id;
        END IF;

        IF NEW.role = 'coach' THEN
            INSERT INTO coach_profiles (coach_id) VALUES (NEW.id) ON CONFLICT (coach_id) DO NOTHING;
            DELETE FROM student_profiles WHERE student_id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check subscription requirements
CREATE OR REPLACE FUNCTION check_subscription_requirements()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (NEW.role IS DISTINCT FROM OLD.role) THEN
        IF NEW.role = 'coach' THEN
            UPDATE coach_profiles SET subscription_required = true WHERE coach_id = NEW.id;
        END IF;

        IF NEW.role = 'student' THEN
            UPDATE student_profiles
            SET subscription_required = EXISTS (
                SELECT 1 FROM student_profiles
                WHERE student_id = NEW.id AND selected_path IS NOT NULL
            )
            WHERE student_id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET subscription_status = NEW.status WHERE id = NEW.id;

    IF NEW.status = 'active' THEN
        UPDATE coach_profiles SET subscription_active = true WHERE id = NEW.coach_id;
    ELSE
        UPDATE coach_profiles SET subscription_active = false WHERE id = NEW.coach_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update session participant count
CREATE OR REPLACE FUNCTION update_session_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE live_sessions SET current_participants = current_participants + 1 WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE live_sessions SET current_participants = current_participants - 1 WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Blog post utilities
CREATE OR REPLACE FUNCTION generate_slug(title text)
RETURNS text AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_read_time(content text)
RETURNS integer AS $$
BEGIN
    -- 200 words per minute average reading speed
    RETURN GREATEST(1, (array_length(string_to_array(content, ' '), 1) / 200.0)::integer);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION blog_post_before_insert_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate slug if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.title);
    END IF;
    
    -- Calculate read time
    NEW.read_time := calculate_read_time(NEW.content);
    
    -- Set published_at when status changes to published
    IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
        NEW.published_at := now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- SECTION 10: TRIGGERS
-- ================================================================

-- Core triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER handle_role_change_trigger
    AFTER UPDATE OF role ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_role_change();

CREATE TRIGGER check_subscription_requirements_trigger
    AFTER INSERT OR UPDATE OF role ON profiles
    FOR EACH ROW EXECUTE FUNCTION check_subscription_requirements();

CREATE TRIGGER update_student_subscription_required
    AFTER UPDATE OF selected_path ON student_profiles
    FOR EACH ROW WHEN (NEW.selected_path IS DISTINCT FROM OLD.selected_path)
    EXECUTE FUNCTION check_subscription_requirements();

CREATE TRIGGER update_subscription_status_trigger
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_subscription_status();

CREATE TRIGGER update_participant_count_trigger
    AFTER INSERT OR DELETE ON session_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_session_participant_count();

CREATE TRIGGER blog_post_before_insert_update_trigger
    BEFORE INSERT OR UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION blog_post_before_insert_update();

-- Updated_at triggers for all relevant tables
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at 
    BEFORE UPDATE ON coach_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at 
    BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_requests_updated_at
    BEFORE UPDATE ON session_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_availability_updated_at
    BEFORE UPDATE ON coach_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_sessions_updated_at
    BEFORE UPDATE ON live_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_enrollments_updated_at
    BEFORE UPDATE ON session_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at 
    BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_templates_updated_at
    BEFORE UPDATE ON video_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_responses_updated_at
    BEFORE UPDATE ON video_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON blog_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SECTION 11: ROW LEVEL SECURITY (CORRECTED)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Profiles are viewable by authenticated users"
    ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Coach profile policies
CREATE POLICY "Coach profiles are publicly viewable"
    ON coach_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches can update own profile"
    ON coach_profiles FOR UPDATE TO authenticated USING (auth.uid() = coach_id);

CREATE POLICY "System can insert coach profiles"
    ON coach_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = coach_id);

-- Student profile policies
CREATE POLICY "Students can view own profile"
    ON student_profiles FOR SELECT TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Students can update own profile"
    ON student_profiles FOR UPDATE TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "System can insert student profiles"
    ON student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- User settings policies
CREATE POLICY "Users can manage their own settings"
    ON user_settings FOR ALL TO authenticated
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Subscription policies
CREATE POLICY "Subscription plans are viewable by everyone"
    ON subscription_plans FOR SELECT TO public USING (true);

CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT TO authenticated 
    USING (auth.uid() = coach_id OR auth.uid() = student_id);

CREATE POLICY "System can manage subscriptions"
    ON subscriptions FOR ALL TO service_role USING (true);

-- Payment policies
CREATE POLICY "Users can view own payment history"
    ON payment_history FOR SELECT TO authenticated 
    USING (auth.uid() = coach_id OR auth.uid() = student_id);

CREATE POLICY "System can insert payments"
    ON payment_history FOR INSERT TO service_role WITH CHECK (true);

-- Session policies
CREATE POLICY "Session participants can view sessions"
    ON sessions FOR SELECT TO authenticated
    USING (auth.uid() = coach_id OR auth.uid() = student_id);

CREATE POLICY "Coaches can manage their sessions"
    ON sessions FOR ALL TO authenticated
    USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Students can view their sessions"
    ON sessions FOR SELECT TO authenticated
    USING (auth.uid() = student_id);

-- Session request policies
CREATE POLICY "Students can create session requests"
    ON session_requests FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can manage their own requests"
    ON session_requests FOR ALL TO authenticated
    USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can respond to session requests"
    ON session_requests FOR UPDATE TO authenticated
    USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can view their requests"
    ON session_requests FOR SELECT TO authenticated
    USING (auth.uid() = coach_id OR auth.uid() = student_id);

-- Coach availability policies
CREATE POLICY "Public can view coach availability"
    ON coach_availability FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches can manage their own availability"
    ON coach_availability FOR ALL TO authenticated
    USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- Live session policies
CREATE POLICY "Public can view scheduled sessions"
    ON live_sessions FOR SELECT TO authenticated
    USING (status IN ('scheduled', 'live'));

CREATE POLICY "Coaches can manage their own sessions"
    ON live_sessions FOR ALL TO authenticated
    USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- Session enrollment policies
CREATE POLICY "Students can enroll in sessions"
    ON session_enrollments FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can manage their own enrollments"
    ON session_enrollments FOR ALL TO authenticated
    USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view enrollments for their sessions"
    ON session_enrollments FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM live_sessions
            WHERE live_sessions.id = session_enrollments.session_id
            AND live_sessions.coach_id = auth.uid()
        )
    );

-- Recording policies
CREATE POLICY "Session participants can access recordings"
    ON session_recordings FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM live_sessions ls
            WHERE ls.id = session_recordings.session_id
            AND (
                ls.coach_id = auth.uid() OR -- Coach can always access
                EXISTS ( -- Student can access if they attended
                    SELECT 1 FROM session_enrollments se
                    WHERE se.session_id = ls.id
                    AND se.student_id = auth.uid()
                    AND se.status = 'attended'
                )
            )
        )
    );

CREATE POLICY "Coaches can manage recordings for their sessions"
    ON session_recordings FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM live_sessions
            WHERE live_sessions.id = session_recordings.session_id
            AND live_sessions.coach_id = auth.uid()
        )
    );

-- Video template policies
CREATE POLICY "Coaches can view their templates"
    ON video_templates FOR SELECT TO authenticated
    USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create video templates"
    ON video_templates FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can manage their own video templates"
    ON video_templates FOR ALL TO authenticated
    USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- Video response policies
CREATE POLICY "Students can view their video responses"
    ON video_responses FOR SELECT TO authenticated
    USING (auth.uid() = coach_id OR auth.uid() = student_id);

CREATE POLICY "Coaches can create video responses"
    ON video_responses FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = coach_id);

-- Testimonial policies
CREATE POLICY "Public can view approved testimonials"
    ON testimonials FOR SELECT TO public USING (approved = true);

CREATE POLICY "Users can create testimonials"
    ON testimonials FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can manage their testimonials"
    ON testimonials FOR ALL TO authenticated
    USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

-- Blog policies
CREATE POLICY "Public can view blog categories"
    ON blog_categories FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage blog categories"
    ON blog_categories FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Public can view blog tags"
    ON blog_tags FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage blog tags"
    ON blog_tags FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Public can view published posts"
    ON blog_posts FOR SELECT TO public USING (status = 'published');

CREATE POLICY "Authors can create blog posts"
    ON blog_posts FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their posts"
    ON blog_posts FOR UPDATE TO authenticated
    USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can manage all blog content"
    ON blog_posts FOR ALL TO authenticated
    USING (
        auth.uid() = author_id OR 
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Public can view post tags"
    ON blog_post_tags FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = blog_post_tags.post_id
            AND blog_posts.status = 'published'
        )
    );

CREATE POLICY "Authors can manage tags for their posts"
    ON blog_post_tags FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = blog_post_tags.post_id
            AND blog_posts.author_id = auth.uid()
        )
    );

-- Blog comment policies
CREATE POLICY "Public can view approved comments"
    ON blog_comments FOR SELECT TO public USING (status = 'approved');

CREATE POLICY "Users can create comments"
    ON blog_comments FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can manage their comments"
    ON blog_comments FOR ALL TO authenticated
    USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can moderate comments"
    ON blog_comments FOR ALL TO authenticated
    USING (
        auth.uid() = author_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Course policies
CREATE POLICY "Public can view courses"
    ON courses FOR SELECT TO public USING (is_hidden = false);

CREATE POLICY "Authenticated users can view courses"
    ON courses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage courses"
    ON courses FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ================================================================
-- SECTION 12: INDEXES FOR PERFORMANCE
-- ================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles (subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);

-- Coach profile indexes
CREATE INDEX IF NOT EXISTS idx_coach_profiles_verification ON coach_profiles (verification_status);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_rating ON coach_profiles (rating DESC);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_subscription ON coach_profiles (subscription_active);

-- Student profile indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_level ON student_profiles (current_level);
CREATE INDEX IF NOT EXISTS idx_student_profiles_coach ON student_profiles (selected_coach_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_coach ON sessions (coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON sessions (student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_time ON sessions (scheduled_time);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status);

-- Session request indexes
CREATE INDEX IF NOT EXISTS idx_session_requests_coach ON session_requests (coach_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_student ON session_requests (student_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_status ON session_requests (status);
CREATE INDEX IF NOT EXISTS idx_session_requests_time ON session_requests (preferred_time);

-- Coach availability indexes
CREATE INDEX IF NOT EXISTS idx_coach_availability_coach ON coach_availability (coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_availability_day ON coach_availability (day_of_week);
CREATE INDEX IF NOT EXISTS idx_coach_availability_date ON coach_availability (specific_date);

-- Live session indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_coach ON live_sessions (coach_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_time ON live_sessions (scheduled_time);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions (status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_path ON live_sessions (learning_path);

-- Enrollment indexes
CREATE INDEX IF NOT EXISTS idx_session_enrollments_session ON session_enrollments (session_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_student ON session_enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_status ON session_enrollments (status);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON subscriptions (current_period_end);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history (id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history (status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON payment_history (created_at DESC);

-- Video indexes
CREATE INDEX IF NOT EXISTS idx_video_templates_coach ON video_templates (coach_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_coach ON video_responses (coach_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_student ON video_responses (student_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_template ON video_responses (template_id);

-- Blog indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts (category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts (status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts (featured, published_at DESC);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts 
    USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles 
    USING gin(to_tsvector('english', name || ' ' || COALESCE(bio, '')));

-- Testimonial indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials (approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_author ON testimonials (author_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials (rating DESC);

-- ================================================================
-- SECTION 13: INITIAL DATA
-- ================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price, interval, role, features) VALUES
('student_monthly', 'Student Monthly', 'Access to all trading courses and basic features', 29.99, 'month', 'student', 
 '["Access to all courses", "Community access", "Basic support"]'::jsonb),
('student_yearly', 'Student Yearly', 'Access to all trading courses and basic features (yearly)', 299.99, 'year', 'student', 
 '["Access to all courses", "Community access", "Basic support", "2 months free"]'::jsonb),
('coach_monthly', 'Coach Monthly', 'Full coaching platform access', 99.99, 'month', 'coach', 
 '["Create live sessions", "1-on-1 coaching", "Video responses", "Analytics dashboard", "Priority support"]'::jsonb),
('coach_yearly', 'Coach Yearly', 'Full coaching platform access (yearly)', 999.99, 'year', 'coach', 
 '["Create live sessions", "1-on-1 coaching", "Video responses", "Analytics dashboard", "Priority support", "2 months free"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert default blog categories
INSERT INTO blog_categories (name, slug, description) VALUES
('Trading Basics', 'trading-basics', 'Fundamental concepts and principles of trading'),
('Technical Analysis', 'technical-analysis', 'Chart patterns, indicators, and technical trading strategies'),
('Risk Management', 'risk-management', 'Managing risk and protecting your capital'),
('Market Psychology', 'market-psychology', 'Understanding emotions and psychology in trading'),
('Cryptocurrency', 'cryptocurrency', 'Digital assets and crypto trading strategies'),
('Forex', 'forex', 'Foreign exchange market insights and strategies'),
('Stocks', 'stocks', 'Stock market analysis and investment strategies'),
('News & Updates', 'news-updates', 'Latest market news and platform updates')
ON CONFLICT (slug) DO NOTHING;

-- Insert default blog tags
INSERT INTO blog_tags (name, slug) VALUES
('beginner', 'beginner'),
('intermediate', 'intermediate'),
('advanced', 'advanced'),
('strategy', 'strategy'),
('analysis', 'analysis'),
('psychology', 'psychology'),
('risk', 'risk'),
('profit', 'profit'),
('loss', 'loss'),
('momentum', 'momentum'),
('swing-trading', 'swing-trading'),
('day-trading', 'day-trading'),
('scalping', 'scalping'),
('long-term', 'long-term'),
('technical', 'technical'),
('fundamental', 'fundamental')
ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- SECTION 14: UTILITY VIEWS
-- ================================================================

-- View for coach dashboard statistics
CREATE OR REPLACE VIEW coach_dashboard_stats AS
SELECT 
    cp.coach_id,  -- Change cp.id to cp.coach_id
    p.name,
    p.email,
    cp.rating,
    cp.total_students,
    cp.earnings,
    cp.verification_status,
    cp.subscription_active,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions,
    COUNT(DISTINCT ls.id) as total_live_sessions,
    COUNT(DISTINCT se.student_id) as unique_students_taught,
    AVG(CASE WHEN s.status = 'completed' THEN s.price END) as avg_session_price
FROM coach_profiles cp
JOIN profiles p ON cp.coach_id = p.id
LEFT JOIN sessions s ON cp.coach_id = s.coach_id
LEFT JOIN live_sessions ls ON cp.coach_id = ls.coach_id
LEFT JOIN session_enrollments se ON ls.id = se.session_id AND se.status = 'attended'
GROUP BY cp.coach_id, p.name, p.email, cp.rating, cp.total_students, cp.earnings, cp.verification_status, cp.subscription_active;

-- View for student dashboard statistics
CREATE OR REPLACE VIEW student_dashboard_stats AS
SELECT 
    sp.student_id,
    p.name,
    p.email,
    sp.current_level,
    sp.tokens_earned,
    sp.selected_path,
    sp.selected_coach_id,
    coach.name as coach_name,
    COUNT(DISTINCT s.id) as total_sessions_booked,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions,
    COUNT(DISTINCT se.session_id) as live_sessions_attended,
    COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.price END), 0) as total_spent
FROM student_profiles sp
JOIN profiles p ON sp.student_id = p.id
LEFT JOIN profiles coach ON sp.selected_coach_id = coach.id
LEFT JOIN sessions s ON sp.Student_id = s.student_id
LEFT JOIN session_enrollments se ON sp.student_id = se.student_id AND se.status = 'attended'
GROUP BY sp.student_id, p.name, p.email, sp.current_level, sp.tokens_earned, sp.selected_path, sp.selected_coach_id, coach.name;

-- View for upcoming sessions
CREATE OR REPLACE VIEW upcoming_sessions AS
SELECT 
    s.id,
    s.scheduled_time,
    s.duration,
    s.status,
    s.price,
    coach.name as coach_name,
    coach.avatar_url as coach_avatar,
    student.name as student_name,
    student.avatar_url as student_avatar,
    s.notes
FROM sessions s
JOIN profiles coach ON s.coach_id = coach.id
JOIN profiles student ON s.student_id = student.id
WHERE s.scheduled_time > now() AND s.status = 'scheduled'
ORDER BY s.scheduled_time;

-- View for popular blog posts
CREATE OR REPLACE VIEW popular_blog_posts AS
SELECT 
    bp.id,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.featured_image_url,
    bp.views_count,
    bp.read_time,
    bp.published_at,
    p.name as author_name,
    bc.name as category_name,
    bc.slug as category_slug,
    array_agg(DISTINCT bt.name) as tags
FROM blog_posts bp
JOIN profiles p ON bp.author_id = p.id
LEFT JOIN blog_categories bc ON bp.category_id = bc.id
LEFT JOIN blog_post_tags bpt ON bp.id = bpt.post_id
LEFT JOIN blog_tags bt ON bpt.tag_id = bt.id
WHERE bp.status = 'published'
GROUP BY bp.id, bp.title, bp.slug, bp.excerpt, bp.featured_image_url, bp.views_count, bp.read_time, bp.published_at, p.name, bc.name, bc.slug
ORDER BY bp.views_count DESC, bp.published_at DESC;

-- ================================================================
-- SECTION 15: BACKUP AND MAINTENANCE FUNCTIONS
-- ================================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep integer DEFAULT 365)
RETURNS TABLE(
    deleted_sessions integer,
    deleted_payments integer,
    deleted_recordings integer
) AS $$
DECLARE
    session_count integer := 0;
    payment_count integer := 0;
    recording_count integer := 0;
BEGIN
    -- Delete old completed sessions (keep for specified days)
    WITH deleted_sessions AS (
        DELETE FROM sessions 
        WHERE status = 'completed' 
        AND created_at < (now() - (days_to_keep || ' days')::interval)
        RETURNING id
    )
    SELECT COUNT(*) INTO session_count FROM deleted_sessions;

    -- Delete old payment history (keep for specified days)
    WITH deleted_payments AS (
        DELETE FROM payment_history 
        WHERE created_at < (now() - (days_to_keep || ' days')::interval)
        RETURNING id
    )
    SELECT COUNT(*) INTO payment_count FROM deleted_payments;

    -- Delete old session recordings (keep for specified days)
    WITH deleted_recordings AS (
        DELETE FROM session_recordings sr
        USING live_sessions ls
        WHERE sr.session_id = ls.id
        AND ls.status = 'completed'
        AND sr.created_at < (now() - (days_to_keep || ' days')::interval)
        RETURNING sr.id
    )
    SELECT COUNT(*) INTO recording_count FROM deleted_recordings;

    RETURN QUERY SELECT session_count, payment_count, recording_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate platform statistics
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE(
    total_users integer,
    total_coaches integer,
    total_students integer,
    verified_coaches integer,
    active_subscriptions integer,
    total_sessions integer,
    total_live_sessions integer,
    total_revenue numeric,
    avg_coach_rating numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::integer FROM profiles),
        (SELECT COUNT(*)::integer FROM profiles WHERE role = 'coach'),
        (SELECT COUNT(*)::integer FROM profiles WHERE role = 'student'),
        (SELECT COUNT(*)::integer FROM coach_profiles WHERE verification_status = 'verified'),
        (SELECT COUNT(*)::integer FROM subscriptions WHERE status = 'active'),
        (SELECT COUNT(*)::integer FROM sessions),
        (SELECT COUNT(*)::integer FROM live_sessions),
        (SELECT COALESCE(SUM(amount), 0) FROM payment_history WHERE status = 'succeeded'),
        (SELECT ROUND(AVG(rating), 2) FROM coach_profiles WHERE rating > 0);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- SECTION 16: COMPLETION MESSAGE
-- ================================================================

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE 'iTradeCoach database schema created successfully!';
    RAISE NOTICE 'Total tables created: %', (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    );
    RAISE NOTICE 'Total functions created: %', (
        SELECT COUNT(*) FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
    );
    RAISE NOTICE 'Total views created: %', (
        SELECT COUNT(*) FROM information_schema.views 
        WHERE table_schema = 'public'
    );
END $$;

-- Final verification - populate role-specific tables for existing users
SELECT * FROM populate_role_specific_tables();

-- ================================================================
-- END OF SCHEMA
-- ================================================================