-- ================================================================
-- iTradeCoach Complete Database Schema (Fixed for All Issues)
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
  role TEXT CHECK (role IN ('student', 'coach', 'admin')),
  email TEXT,
  subscription_status text DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled')),
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
    subscription_active boolean DEFAULT false,
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

-- User settings and preferences (fixed: removed redundant id column)
CREATE TABLE IF NOT EXISTS user_settings (
    prof_id uuid PRIMARY KEY REFERENCES user_profiles(prof_id) ON DELETE CASCADE,
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
    status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
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
-- AI TUTOR LEARNING SYSTEM TABLES
-- ================================================================

-- Learning topics table
CREATE TABLE IF NOT EXISTS learning_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER, -- in minutes
    total_lessons INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    popularity_score INTEGER DEFAULT 0,
    created_by UUID REFERENCES coach_profiles(coach_id) ON DELETE SET NULL, -- coach who created this topic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES learning_topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('video', 'text', 'quiz')),
    content TEXT, -- for text lessons
    video_url TEXT, -- for video lessons
    duration INTEGER DEFAULT 0, -- in minutes
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic_id, order_index)
);

-- User lesson progress table
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES learning_topics(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Chat messages table for AI tutor
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    session_id UUID, -- optional: group messages by session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User learning statistics
CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    total_time_minutes INTEGER DEFAULT 0,
    completed_topics UUID[] DEFAULT '{}', -- array of completed topic IDs
    current_streak_days INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
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
    price numeric(10,2) DEFAULT 0 CHECK (price >= 0),
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
    day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'maybe')),
    notes text,
    is_recurring boolean NOT NULL DEFAULT true,
    specific_date date,
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
    duration integer,
    file_size bigint,
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
    UNIQUE(live_session_id, student_id)
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
    )
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
    question TEXT,
    topic TEXT DEFAULT 'General Trading Question',
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
    read_time integer DEFAULT 0,
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
    student_id uuid REFERENCES student_profiles(student_id) ON DELETE CASCADE, -- Made optional
    coach_id uuid NOT NULL REFERENCES coach_profiles(coach_id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    level text CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    category text,
    duration text,
    price decimal(10,2) DEFAULT 0,
    thumbnail text,
    learning_objectives text,
    prerequisites text,
    tags text[],
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
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
-- SECTION 9: DROP EXISTING FUNCTIONS, TRIGGERS AND POLICIES
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
        AND NOT t.tgisinternal
        AND t.tgname NOT LIKE 'RI_%'  -- Exclude referential integrity triggers
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', rec.trigger_name, rec.table_name);
        EXCEPTION
            WHEN insufficient_privilege THEN
                -- Skip triggers we don't own
                NULL;
        END;
    END LOOP;
    
    -- Drop all existing RLS policies from public schema tables
    FOR rec IN
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', rec.policyname, rec.tablename);
        EXCEPTION
            WHEN insufficient_privilege THEN
                -- Skip policies we don't own
                NULL;
        END;
    END LOOP;
    
    RAISE NOTICE 'Cleanup completed!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error during cleanup: %', SQLERRM;
END $$;

-- ================================================================
-- SECTION 10: UTILITY FUNCTIONS (FIXED FOR OWNERSHIP ISSUES)
-- ================================================================

-- Create our own update function to avoid ownership issues
CREATE OR REPLACE FUNCTION itradecoach_update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Handle new user registration (with defensive checks)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    user_role_value text;
    user_name text;
BEGIN
    -- Check if auth.uid() is not null
    IF NEW.id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;

    -- Get role or default to 'student'
    user_role_value := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'student'
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

    -- Insert into user_profiles table
    INSERT INTO public.user_profiles (prof_id)
    VALUES (NEW.id);

    -- Insert into user_settings table
    INSERT INTO public.user_settings (prof_id)
    VALUES (NEW.id);

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
        RAISE;
END;
$$;

-- Populate role-specific tables
CREATE OR REPLACE FUNCTION populate_role_specific_tables()
RETURNS TABLE(students_added integer, coaches_added integer) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_count integer := 0;
    coach_count integer := 0;
BEGIN
    -- Insert students
    WITH inserted_students AS (
        INSERT INTO student_profiles (student_id)
        SELECT up.prof_id FROM user_profiles up
        JOIN profiles p ON up.prof_id = p.id
        WHERE p.role = 'student' 
        AND up.prof_id NOT IN (SELECT student_id FROM student_profiles WHERE student_id IS NOT NULL)
        ON CONFLICT (student_id) DO NOTHING
        RETURNING student_id
    )
    SELECT COUNT(*) INTO student_count FROM inserted_students;

    -- Insert coaches
    WITH inserted_coaches AS (
        INSERT INTO coach_profiles (coach_id)
        SELECT up.prof_id FROM user_profiles up
        JOIN profiles p ON up.prof_id = p.id
        WHERE p.role = 'coach' 
        AND up.prof_id NOT IN (SELECT coach_id FROM coach_profiles WHERE coach_id IS NOT NULL)
        ON CONFLICT (coach_id) DO NOTHING
        RETURNING coach_id
    )
    SELECT COUNT(*) INTO coach_count FROM inserted_coaches;

    RETURN QUERY SELECT student_count, coach_count;
END;
$$;

-- Handle role changes
CREATE OR REPLACE FUNCTION handle_role_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles SET subscription_status = NEW.status WHERE id = NEW.prof_id;

    -- Update coach subscription status if this is a coach
    UPDATE coach_profiles 
    SET subscription_active = (NEW.status = 'active')
    WHERE coach_id = NEW.prof_id;

    RETURN NEW;
END;
$$;

-- Update session participant count
CREATE OR REPLACE FUNCTION update_session_participant_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Blog post utilities
CREATE OR REPLACE FUNCTION generate_slug(title text)
RETURNS text 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

CREATE OR REPLACE FUNCTION calculate_read_time(content text)
RETURNS integer 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 200 words per minute average reading speed
    RETURN GREATEST(1, (array_length(string_to_array(content, ' '), 1) / 200.0)::integer);
END;
$$;

CREATE OR REPLACE FUNCTION blog_post_before_insert_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Update lesson count when lessons are added/removed
CREATE OR REPLACE FUNCTION update_topic_lesson_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE learning_topics 
        SET total_lessons = total_lessons + 1 
        WHERE id = NEW.topic_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE learning_topics 
        SET total_lessons = total_lessons - 1 
        WHERE id = OLD.topic_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Update learning progress when lessons are completed
CREATE OR REPLACE FUNCTION update_learning_progress()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lesson_duration INTEGER;
BEGIN
    IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
        -- Get lesson duration
        SELECT duration INTO lesson_duration FROM lessons WHERE id = NEW.lesson_id;
        
        -- Update or insert learning progress
        INSERT INTO learning_progress (user_id, total_time_minutes, total_xp, last_activity_date)
        VALUES (NEW.user_id, COALESCE(lesson_duration, 0), 10, CURRENT_DATE)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            total_time_minutes = learning_progress.total_time_minutes + COALESCE(lesson_duration, 0),
            total_xp = learning_progress.total_xp + 10,
            last_activity_date = CURRENT_DATE,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

-- ================================================================
-- SECTION 11: TRIGGERS
-- ================================================================

-- Core triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER handle_role_change_trigger
    AFTER UPDATE OF role ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_role_change();

CREATE TRIGGER update_subscription_status_trigger
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_subscription_status();

CREATE TRIGGER update_participant_count_trigger
    AFTER INSERT OR DELETE ON session_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_session_participant_count();

CREATE TRIGGER blog_post_before_insert_update_trigger
    BEFORE INSERT OR UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION blog_post_before_insert_update();

CREATE TRIGGER update_topic_lesson_count_trigger
    AFTER INSERT OR DELETE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_topic_lesson_count();

CREATE TRIGGER update_learning_progress_trigger
    AFTER INSERT OR UPDATE ON user_lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_learning_progress();

-- Updated_at triggers using our custom function
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_coach_profiles_updated_at 
    BEFORE UPDATE ON coach_profiles FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_student_profiles_updated_at 
    BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_session_requests_updated_at
    BEFORE UPDATE ON session_requests FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_coach_availability_updated_at
    BEFORE UPDATE ON coach_availability FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_live_sessions_updated_at
    BEFORE UPDATE ON live_sessions FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_session_enrollments_updated_at
    BEFORE UPDATE ON session_enrollments FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_testimonials_updated_at 
    BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_video_templates_updated_at
    BEFORE UPDATE ON video_templates FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_video_responses_updated_at
    BEFORE UPDATE ON video_responses FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON blog_comments FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_learning_topics_updated_at
    BEFORE UPDATE ON learning_topics FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_user_lesson_progress_updated_at
    BEFORE UPDATE ON user_lesson_progress FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

CREATE TRIGGER update_learning_progress_updated_at
    BEFORE UPDATE ON learning_progress FOR EACH ROW EXECUTE FUNCTION itradecoach_update_updated_at();

-- ================================================================
-- SECTION 12: ROW LEVEL SECURITY
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
ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_feedback ENABLE ROW LEVEL SECURITY;

-- Profile policies (optimized with SELECT auth.uid())
CREATE POLICY "Profiles are viewable by authenticated users"
    ON profiles FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT 
    TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- User profile policies
CREATE POLICY "User profiles are viewable by authenticated users"
    ON user_profiles FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Users can update their own user profile"
    ON user_profiles FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = prof_id)
    WITH CHECK ((SELECT auth.uid()) = prof_id);

CREATE POLICY "System can insert user profiles"
    ON user_profiles FOR INSERT 
    TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = prof_id);

-- Coach profile policies
CREATE POLICY "Coach profiles are publicly viewable"
    ON coach_profiles FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Coaches can update own profile"
    ON coach_profiles FOR UPDATE 
    TO authenticated 
    USING ((SELECT auth.uid()) = coach_id);

CREATE POLICY "System can insert coach profiles"
    ON coach_profiles FOR INSERT 
    TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = coach_id);

-- Student profile policies
CREATE POLICY "Students can view own profile"
    ON student_profiles FOR SELECT 
    TO authenticated 
    USING ((SELECT auth.uid()) = student_id);

CREATE POLICY "Students can update own profile"
    ON student_profiles FOR UPDATE 
    TO authenticated 
    USING ((SELECT auth.uid()) = student_id);

CREATE POLICY "System can insert student profiles"
    ON student_profiles FOR INSERT 
    TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = student_id);

-- User settings policies
CREATE POLICY "Users can manage their own settings"
    ON user_settings FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = prof_id) 
    WITH CHECK ((SELECT auth.uid()) = prof_id);

-- Subscription policies
CREATE POLICY "Subscription plans are viewable by everyone"
    ON subscription_plans FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT 
    TO authenticated 
    USING ((SELECT auth.uid()) = prof_id);

CREATE POLICY "System can manage subscriptions"
    ON subscriptions FOR ALL 
    TO service_role 
    USING (true);

-- Payment policies
CREATE POLICY "Users can view own payment history"
    ON payment_history FOR SELECT 
    TO authenticated 
    USING ((SELECT auth.uid()) = prof_id);

CREATE POLICY "System can insert payments"
    ON payment_history FOR INSERT 
    TO service_role 
    WITH CHECK (true);

-- Session policies
CREATE POLICY "Session participants can view sessions"
    ON sessions FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = coach_id OR (SELECT auth.uid()) = student_id);

CREATE POLICY "Coaches can create sessions"
    ON sessions FOR INSERT 
    TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = coach_id);

CREATE POLICY "Session participants can update sessions"
    ON sessions FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = coach_id OR (SELECT auth.uid()) = student_id);

-- Session request policies
CREATE POLICY "Session request participants can view requests"
    ON session_requests FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = coach_id OR (SELECT auth.uid()) = student_id);

CREATE POLICY "Students can create session requests"
    ON session_requests FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = student_id);

CREATE POLICY "Session request participants can update requests"
    ON session_requests FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = coach_id OR (SELECT auth.uid()) = student_id);

-- Coach availability policies
CREATE POLICY "Anyone can view coach availability"
    ON coach_availability FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Coaches can manage their availability"
    ON coach_availability FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = coach_id)
    WITH CHECK ((SELECT auth.uid()) = coach_id);

-- Live session policies
CREATE POLICY "Live sessions are publicly viewable"
    ON live_sessions FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Coaches can manage their live sessions"
    ON live_sessions FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = coach_id)
    WITH CHECK ((SELECT auth.uid()) = coach_id);

-- Session enrollment policies
CREATE POLICY "Users can view their own enrollments"
    ON session_enrollments FOR SELECT 
    TO authenticated
    USING (
        (SELECT auth.uid()) = student_id OR 
        (SELECT auth.uid()) IN (SELECT coach_id FROM live_sessions WHERE id = session_id)
    );

CREATE POLICY "Students can enroll in sessions"
    ON session_enrollments FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = student_id);

CREATE POLICY "Students can update their enrollments"
    ON session_enrollments FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = student_id);

-- Session recording policies
CREATE POLICY "Session recordings viewable by enrolled students and coaches"
    ON session_recordings FOR SELECT 
    TO authenticated
    USING (
        (SELECT auth.uid()) IN (
            SELECT coach_id FROM live_sessions WHERE id = session_id
        ) OR
        (SELECT auth.uid()) IN (
            SELECT student_id FROM session_enrollments WHERE session_id = session_recordings.session_id
        )
    );

CREATE POLICY "Coaches can manage session recordings"
    ON session_recordings FOR ALL 
    TO authenticated
    USING (
        (SELECT auth.uid()) IN (SELECT coach_id FROM live_sessions WHERE id = session_id)
    );

-- Live session feedback policies
CREATE POLICY "Users can view feedback for sessions they're involved in"
    ON live_session_feedback FOR SELECT 
    TO authenticated
    USING (
        (SELECT auth.uid()) = student_id OR
        (SELECT auth.uid()) IN (SELECT coach_id FROM live_sessions WHERE id = live_session_id)
    );

CREATE POLICY "Students can create feedback"
    ON live_session_feedback FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = student_id);

CREATE POLICY "Students can update their own feedback"
    ON live_session_feedback FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = student_id);

-- Session materials policies
CREATE POLICY "Session materials viewable by participants"
    ON session_materials FOR SELECT 
    TO authenticated
    USING (
        (SELECT auth.uid()) = uploaded_by OR
        (session_id IS NOT NULL AND (SELECT auth.uid()) IN (
            SELECT coach_id FROM sessions WHERE id = session_id
            UNION
            SELECT student_id FROM sessions WHERE id = session_id
        )) OR
        (live_session_id IS NOT NULL AND (
            (SELECT auth.uid()) IN (SELECT coach_id FROM live_sessions WHERE id = live_session_id) OR
            (SELECT auth.uid()) IN (SELECT student_id FROM session_enrollments WHERE session_id = live_session_id)
        ))
    );

CREATE POLICY "Coaches can upload session materials"
    ON session_materials FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = uploaded_by);

CREATE POLICY "Uploaders can update their materials"
    ON session_materials FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = uploaded_by);

-- Video template policies
CREATE POLICY "Coaches can manage their video templates"
    ON video_templates FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = coach_id)
    WITH CHECK ((SELECT auth.uid()) = coach_id);

-- Video response policies
CREATE POLICY "Video responses viewable by involved parties"
    ON video_responses FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = coach_id OR (SELECT auth.uid()) = student_id);

CREATE POLICY "Coaches can create video responses"
    ON video_responses FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = coach_id);

CREATE POLICY "Coaches can update their video responses"
    ON video_responses FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = coach_id);

-- Blog policies
CREATE POLICY "Blog categories are publicly viewable"
    ON blog_categories FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Blog tags are publicly viewable"
    ON blog_tags FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Published blog posts are publicly viewable"
    ON blog_posts FOR SELECT 
    TO authenticated, anon
    USING (status = 'published');

CREATE POLICY "Authors can view their own blog posts"
    ON blog_posts FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "Authors can manage their blog posts"
    ON blog_posts FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = author_id)
    WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Blog post tags are publicly viewable"
    ON blog_post_tags FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Authors can manage their post tags"
    ON blog_post_tags FOR ALL 
    TO authenticated
    USING (
        (SELECT auth.uid()) IN (SELECT author_id FROM blog_posts WHERE id = post_id)
    );

CREATE POLICY "Approved blog comments are publicly viewable"
    ON blog_comments FOR SELECT 
    TO authenticated, anon
    USING (status = 'approved');

CREATE POLICY "Users can view their own comments"
    ON blog_comments FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can create blog comments"
    ON blog_comments FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can update their own comments"
    ON blog_comments FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = author_id);

-- Course policies
CREATE POLICY "Course participants can view courses"
    ON courses FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = student_id OR (SELECT auth.uid()) = coach_id);

CREATE POLICY "Coaches can create courses"
    ON courses FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = coach_id);

CREATE POLICY "Course participants can update courses"
    ON courses FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = student_id OR (SELECT auth.uid()) = coach_id);

-- Testimonial policies
CREATE POLICY "Approved testimonials are publicly viewable"
    ON testimonials FOR SELECT 
    TO authenticated, anon
    USING (approved = true);

CREATE POLICY "Users can view their own testimonials"
    ON testimonials FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can create testimonials"
    ON testimonials FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can update their own testimonials"
    ON testimonials FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = author_id);

-- Learning topics policies
CREATE POLICY "Learning topics are publicly viewable"
    ON learning_topics FOR SELECT 
    TO authenticated 
    USING (is_active = true);

CREATE POLICY "Coaches can manage learning topics"
    ON learning_topics FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = created_by OR (SELECT auth.uid()) IN (
        SELECT coach_id FROM coach_profiles WHERE verification_status = 'verified'
    ));

-- Lessons policies
CREATE POLICY "Lessons are viewable for active topics"
    ON lessons FOR SELECT 
    TO authenticated 
    USING (is_active = true AND topic_id IN (
        SELECT id FROM learning_topics WHERE is_active = true
    ));

CREATE POLICY "Topic creators can manage lessons"
    ON lessons FOR ALL 
    TO authenticated
    USING (topic_id IN (
        SELECT id FROM learning_topics WHERE created_by = (SELECT auth.uid())
    ));

-- User lesson progress policies
CREATE POLICY "Users can view their own progress"
    ON user_lesson_progress FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own progress"
    ON user_lesson_progress FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Chat messages policies
CREATE POLICY "Users can view their own chat messages"
    ON chat_messages FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own chat messages"
    ON chat_messages FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Learning progress policies
CREATE POLICY "Users can view their own learning progress"
    ON learning_progress FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "System can manage learning progress"
    ON learning_progress FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Additional policies for public stats
CREATE POLICY "Allow public read access for stats" 
    ON profiles FOR SELECT 
    TO anon 
    USING (true);

CREATE POLICY "Allow public read access for stats" 
    ON coach_profiles FOR SELECT 
    TO anon 
    USING (true);

CREATE POLICY "Allow public read access for stats" 
    ON sessions FOR SELECT 
    TO anon 
    USING (true);

-- Anonymous access policies
DO $$
BEGIN
    -- Check and create anonymous access policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'coach_profiles' 
        AND policyname = 'anon_read_verified_coaches'
    ) THEN
        CREATE POLICY "anon_read_verified_coaches"
          ON coach_profiles
          FOR SELECT
          TO anon
          USING (verification_status = 'verified');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'testimonials' 
        AND policyname = 'anon_read_approved_testimonials'
    ) THEN
        CREATE POLICY "anon_read_approved_testimonials"
          ON testimonials
          FOR SELECT
          TO anon
          USING (approved = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'courses' 
        AND policyname = 'anon_read_published_courses'
    ) THEN
        CREATE POLICY "anon_read_published_courses"
          ON courses
          FOR SELECT
          TO anon
          USING (status = 'published');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'live_sessions' 
        AND policyname = 'anon_read_scheduled_sessions'
    ) THEN
        CREATE POLICY "anon_read_scheduled_sessions"
          ON live_sessions
          FOR SELECT
          TO anon
          USING (status = 'scheduled');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'anon_read_public_user_profiles'
    ) THEN
        CREATE POLICY "anon_read_public_user_profiles"
          ON user_profiles
          FOR SELECT
          TO anon
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sessions' 
        AND policyname = 'anon_read_completed_sessions'
    ) THEN
        CREATE POLICY "anon_read_completed_sessions"
          ON sessions
          FOR SELECT
          TO anon
          USING (status = 'completed');
    END IF;
END $$;

-- ================================================================
-- SECTION 13: INDEXES FOR PERFORMANCE
-- ================================================================

-- User and profile indexes (including RLS performance indexes)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_prof_id ON user_profiles(prof_id);

-- Coach profile indexes
CREATE INDEX IF NOT EXISTS idx_coach_profiles_coach_id ON coach_profiles(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_verification_status ON coach_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_rating ON coach_profiles(rating);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_hourly_rate ON coach_profiles(hourly_rate);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_subscription_active ON coach_profiles(subscription_active);

-- Student profile indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_student_id ON student_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_current_level ON student_profiles(current_level);
CREATE INDEX IF NOT EXISTS idx_student_profiles_selected_coach ON student_profiles(selected_coach_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_coach_student ON sessions(coach_id, student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_time ON sessions(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Session request indexes
CREATE INDEX IF NOT EXISTS idx_session_requests_coach_id ON session_requests(coach_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_student_id ON session_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_status ON session_requests(status);
CREATE INDEX IF NOT EXISTS idx_session_requests_preferred_time ON session_requests(preferred_time);

-- Coach availability indexes
CREATE INDEX IF NOT EXISTS idx_coach_availability_coach_id ON coach_availability(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_availability_day_of_week ON coach_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_coach_availability_specific_date ON coach_availability(specific_date);

-- Live session indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_coach_id ON live_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled_time ON live_sessions(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_learning_path ON live_sessions(learning_path);

-- Session enrollment indexes
CREATE INDEX IF NOT EXISTS idx_session_enrollments_session_id ON session_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_student_id ON session_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_status ON session_enrollments(status);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_prof_id ON subscriptions(prof_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Payment history indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_prof_id ON payment_history(prof_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);

-- Blog indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_author_id ON blog_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);

-- Video system indexes
CREATE INDEX IF NOT EXISTS idx_video_templates_coach_id ON video_templates(coach_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_coach_id ON video_responses(coach_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_student_id ON video_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_student_coach ON video_responses(student_id, coach_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_status ON video_responses(status);

-- Testimonial indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_author_id ON testimonials(author_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);

-- Learning system indexes
CREATE INDEX IF NOT EXISTS idx_learning_topics_level ON learning_topics(level);
CREATE INDEX IF NOT EXISTS idx_learning_topics_is_active ON learning_topics(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_topics_created_by ON learning_topics(created_by);

CREATE INDEX IF NOT EXISTS idx_lessons_topic_id ON lessons(topic_id);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(type);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(topic_id, order_index);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_topic_id ON user_lesson_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed ON user_lesson_progress(completed);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_last_activity ON learning_progress(last_activity_date);

-- User settings index
CREATE INDEX IF NOT EXISTS idx_user_settings_prof_id ON user_settings(prof_id);

-- ================================================================
-- SECTION 14: INITIAL DATA SETUP
-- ================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price, interval, role, features) VALUES
('student-monthly', 'Student Monthly', 'Monthly access to all coaching features', 29.99, 'month', 'student', 
 '["Unlimited 1-on-1 sessions", "Access to live group sessions", "Course materials", "Community access"]'::jsonb),
('student-yearly', 'Student Yearly', 'Yearly access to all coaching features', 299.99, 'year', 'student',
 '["Unlimited 1-on-1 sessions", "Access to live group sessions", "Course materials", "Community access", "2 months free"]'::jsonb),
('coach-monthly', 'Coach Monthly', 'Monthly coaching platform access', 49.99, 'month', 'coach',
 '["Create unlimited sessions", "Host live sessions", "Video response templates", "Analytics dashboard"]'::jsonb),
('coach-yearly', 'Coach Yearly', 'Yearly coaching platform access', 499.99, 'year', 'coach',
 '["Create unlimited sessions", "Host live sessions", "Video response templates", "Analytics dashboard", "2 months free"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert default blog categories
INSERT INTO blog_categories (name, slug, description) VALUES
('Trading Strategies', 'trading-strategies', 'Learn about different trading approaches and methodologies'),
('Market Analysis', 'market-analysis', 'Deep dives into market trends and analysis techniques'),
('Psychology', 'psychology', 'The mental game of trading and investment psychology'),
('Risk Management', 'risk-management', 'Strategies for managing and minimizing trading risks'),
('Technology', 'technology', 'Trading tools, platforms, and technological innovations'),
('Education', 'education', 'Learning resources and educational content for traders')
ON CONFLICT (slug) DO NOTHING;

-- Insert default blog tags
INSERT INTO blog_tags (name, slug) VALUES
('Beginner', 'beginner'),
('Intermediate', 'intermediate'),
('Advanced', 'advanced'),
('Day Trading', 'day-trading'),
('Swing Trading', 'swing-trading'),
('Options', 'options'),
('Forex', 'forex'),
('Crypto', 'crypto'),
('Technical Analysis', 'technical-analysis'),
('Fundamental Analysis', 'fundamental-analysis')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample learning topics
INSERT INTO learning_topics (id, title, description, level, estimated_duration, is_active) VALUES
('b1a2c3d4-e5f6-7890-1234-567890abcdef', 'Trading Basics', 'Learn the fundamental concepts of trading and market structure', 'beginner', 120, true),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Technical Analysis', 'Master chart patterns, indicators, and price action analysis', 'beginner', 180, true),
('d3c4e5f6-7a8b-9012-3456-789012abcdef', 'Risk Management', 'Advanced strategies for managing trading risk and capital preservation', 'intermediate', 90, true),
('e4d5f6e7-8a9b-0123-4567-890123abcdef', 'Options Trading', 'Complete guide to options strategies and derivatives', 'advanced', 240, true),
('f5e6f7e8-9a0b-1234-5678-901234abcdef', 'Market Psychology', 'Understanding trader psychology and market sentiment', 'intermediate', 150, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample lessons for Trading Basics
INSERT INTO lessons (topic_id, title, description, type, duration, order_index, content) VALUES
('b1a2c3d4-e5f6-7890-1234-567890abcdef', 'Introduction to Trading', 'Overview of financial markets and trading basics', 'video', 10, 1, NULL),
('b1a2c3d4-e5f6-7890-1234-567890abcdef', 'Understanding Markets', 'Different types of markets and how they function', 'text', 15, 2, 'Markets are venues where buyers and sellers come together to trade financial instruments...'),
('b1a2c3d4-e5f6-7890-1234-567890abcdef', 'Order Types', 'Learn about market orders, limit orders, and stop orders', 'video', 12, 3, NULL),
('b1a2c3d4-e5f6-7890-1234-567890abcdef', 'Reading Charts', 'Introduction to price charts and basic patterns', 'video', 18, 4, NULL),
('b1a2c3d4-e5f6-7890-1234-567890abcdef', 'Timeframes', 'Understanding different timeframes and their significance', 'text', 8, 5, 'Timeframes are crucial in trading as they determine your perspective on the market...'),
('b1a2c3d4-e5f6-7890-1234-567890abcdef', 'Basic Indicators', 'Introduction to technical indicators', 'video', 15, 6, NULL),
('b1a2c3d4-e5f6-7890-1234-567890abcdef', 'Risk Basics', 'Introduction to risk management principles', 'text', 10, 7, 'Risk management is the foundation of successful trading...'),
('b1a2c3d4-e5f6-7890-1234-567890abcdef', 'Knowledge Check', 'Test your understanding of trading basics', 'quiz', 15, 8, NULL)
ON CONFLICT DO NOTHING;

-- Insert lessons for Technical Analysis
INSERT INTO lessons (topic_id, title, description, type, duration, order_index, content) VALUES
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Introduction to Technical Analysis', 'Overview of technical analysis and its principles', 'video', 12, 1, NULL),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Support and Resistance', 'Identifying key price levels in the market', 'video', 15, 2, NULL),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Trend Lines', 'Drawing and using trend lines effectively', 'text', 10, 3, 'Trend lines are one of the most fundamental tools in technical analysis...'),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Chart Patterns', 'Common chart patterns and their significance', 'video', 20, 4, NULL),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Candlestick Patterns', 'Understanding Japanese candlestick patterns', 'video', 18, 5, NULL),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Moving Averages', 'Using moving averages for trend identification', 'text', 12, 6, 'Moving averages are trend-following indicators that smooth out price data...'),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Oscillators', 'RSI, MACD, and other momentum indicators', 'video', 15, 7, NULL),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Volume Analysis', 'Understanding volume and its relationship with price', 'text', 10, 8, 'Volume is a key component of technical analysis...'),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Fibonacci Retracements', 'Using Fibonacci tools for price projections', 'video', 15, 9, NULL),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Divergence Trading', 'Identifying and trading divergences', 'video', 18, 10, NULL),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Multiple Timeframe Analysis', 'Analyzing markets across different timeframes', 'text', 12, 11, 'Multiple timeframe analysis provides a comprehensive view of the market...'),
('c2b3d4e5-f6d7-8901-2345-678901bcdef0', 'Technical Analysis Quiz', 'Test your technical analysis knowledge', 'quiz', 20, 12, NULL)
ON CONFLICT DO NOTHING;

-- ================================================================
-- SECTION 15: UTILITY VIEWS (FIXED AGGREGATE FUNCTION ISSUE)
-- ================================================================

-- View for complete user information
CREATE OR REPLACE VIEW user_complete_profiles AS
SELECT 
    p.id,
    p.name,
    p.email,
    p.role,
    p.subscription_status,
    up.bio,
    up.website,
    up.twitter,
    up.linkedin,
    up.avatar_url,
    up.profile_complete,
    us.notifications,
    us.timezone,
    us.language,
    p.created_at,
    p.updated_at
FROM profiles p
JOIN user_profiles up ON p.id = up.prof_id
LEFT JOIN user_settings us ON p.id = us.prof_id;

-- View for coach statistics
CREATE OR REPLACE VIEW coach_statistics AS
SELECT 
    cp.coach_id,
    p.name,
    cp.rating,
    cp.total_students,
    cp.earnings,
    cp.hourly_rate,
    cp.verification_status,
    cp.subscription_active,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT ls.id) as total_live_sessions,
    COUNT(DISTINCT se.student_id) as enrolled_students
FROM coach_profiles cp
JOIN profiles p ON cp.coach_id = p.id
LEFT JOIN sessions s ON cp.coach_id = s.coach_id
LEFT JOIN live_sessions ls ON cp.coach_id = ls.coach_id
LEFT JOIN session_enrollments se ON ls.id = se.session_id
GROUP BY cp.coach_id, p.name, cp.rating, cp.total_students, cp.earnings, 
         cp.hourly_rate, cp.verification_status, cp.subscription_active;

-- View for student progress
CREATE OR REPLACE VIEW student_progress AS
SELECT 
    sp.student_id,
    p.name,
    sp.current_level,
    sp.tokens_earned,
    array_length(sp.courses_completed, 1) as courses_completed_count,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT se.session_id) as enrolled_live_sessions,
    sp.selected_coach_id
FROM student_profiles sp
JOIN profiles p ON sp.student_id = p.id
LEFT JOIN sessions s ON sp.student_id = s.student_id
LEFT JOIN session_enrollments se ON sp.student_id = se.student_id
GROUP BY sp.student_id, p.name, sp.current_level, sp.tokens_earned, 
         sp.courses_completed, sp.selected_coach_id;

-- View for public platform stats (FIXED - using subquery to handle unnest)
CREATE OR REPLACE VIEW public_platform_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM coach_profiles WHERE verification_status = 'verified') as expert_count,
  (SELECT COUNT(*) FROM sessions WHERE status = 'completed') as session_count,
  (SELECT ROUND(AVG(rating)::numeric, 2) FROM coach_profiles WHERE verification_status = 'verified' AND rating > 0) as avg_rating,
  (SELECT COUNT(DISTINCT expertise_area) 
   FROM (
     SELECT unnest(expertise_areas) as expertise_area 
     FROM coach_profiles 
     WHERE verification_status = 'verified' 
     AND expertise_areas IS NOT NULL 
     AND array_length(expertise_areas, 1) > 0
   ) expertise_subquery
  ) as topic_count;

-- View for upcoming sessions
CREATE OR REPLACE VIEW upcoming_sessions AS
SELECT 
    s.id,
    s.scheduled_time,
    s.duration,
    s.status,
    s.price,
    pc.name as coach_name,
    ps.name as student_name,
    s.notes
FROM sessions s
JOIN profiles pc ON s.coach_id = pc.id
JOIN profiles ps ON s.student_id = ps.id
WHERE s.scheduled_time > NOW()
    AND s.status = 'scheduled'
ORDER BY s.scheduled_time;

-- View for session analytics
CREATE OR REPLACE VIEW session_analytics AS
SELECT 
    DATE_TRUNC('month', s.scheduled_time) as month,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) as cancelled_sessions,
    AVG(s.price) as avg_price,
    SUM(s.price) as total_revenue
FROM sessions s
GROUP BY DATE_TRUNC('month', s.scheduled_time)
ORDER BY month DESC;

-- View for user learning dashboard
CREATE OR REPLACE VIEW user_learning_dashboard AS
SELECT 
    p.id as user_id,
    p.name,
    lp.total_time_minutes,
    lp.total_xp,
    lp.current_streak_days,
    lp.last_activity_date,
    COUNT(DISTINCT ulp.lesson_id) FILTER (WHERE ulp.completed = true) as completed_lessons,
    COUNT(DISTINCT ulp.topic_id) as topics_started,
    COUNT(DISTINCT lt.id) FILTER (WHERE ulp.completed = true AND lt.id = ulp.topic_id) as topics_completed
FROM profiles p
LEFT JOIN learning_progress lp ON p.id = lp.user_id
LEFT JOIN user_lesson_progress ulp ON p.id = ulp.user_id
LEFT JOIN learning_topics lt ON ulp.topic_id = lt.id
GROUP BY p.id, p.name, lp.total_time_minutes, lp.total_xp, lp.current_streak_days, lp.last_activity_date;

-- View for topic progress
CREATE OR REPLACE VIEW topic_progress_view AS
SELECT 
    lt.id as topic_id,
    lt.title,
    lt.description,
    lt.level,
    lt.estimated_duration,
    lt.total_lessons,
    COUNT(ulp.lesson_id) FILTER (WHERE ulp.completed = true) as completed_lessons,
    COUNT(DISTINCT ulp.user_id) as students_enrolled,
    ROUND(AVG(CASE WHEN ulp.completed THEN 1.0 ELSE 0.0 END) * 100, 2) as completion_rate
FROM learning_topics lt
LEFT JOIN user_lesson_progress ulp ON lt.id = ulp.topic_id
WHERE lt.is_active = true
GROUP BY lt.id, lt.title, lt.description, lt.level, lt.estimated_duration, lt.total_lessons;

-- Grant necessary permissions on views
GRANT SELECT ON user_complete_profiles TO authenticated;
GRANT SELECT ON coach_statistics TO authenticated;
GRANT SELECT ON student_progress TO authenticated;
GRANT SELECT ON public_platform_stats TO authenticated, anon;
GRANT SELECT ON upcoming_sessions TO authenticated;
GRANT SELECT ON session_analytics TO authenticated;
GRANT SELECT ON user_learning_dashboard TO authenticated;
GRANT SELECT ON topic_progress_view TO authenticated;

-- ================================================================
-- SECTION 16: FINAL SETUP AND CLEANUP
-- ================================================================

-- Run role-specific table population
SELECT * FROM populate_role_specific_tables();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Create storage bucket policies (fixed with ON CONFLICT)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES 
        ('avatars', 'avatars', true),
        ('session-materials', 'session-materials', false),
        ('video-recordings', 'video-recordings', false)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Storage buckets may already exist or storage schema not available: %', SQLERRM;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'iTradeCoach Database Schema Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: %', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    );
    RAISE NOTICE 'Functions created: %', (
        SELECT COUNT(*) 
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
    );
    RAISE NOTICE 'Triggers created: %', (
        SELECT COUNT(*) 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    );
    RAISE NOTICE 'Views created: %', (
        SELECT COUNT(*) 
        FROM information_schema.views 
        WHERE table_schema = 'public'
    );
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database is ready for use!';
    RAISE NOTICE '========================================';
END $$;

-- ================================================================
-- END OF SCHEMA
-- ================================================================