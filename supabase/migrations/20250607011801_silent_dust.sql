-- Session requests table for student-coach session booking workflow
CREATE TABLE IF NOT EXISTS session_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_time timestamptz NOT NULL,
  duration integer NOT NULL CHECK (duration > 0), -- in minutes
  topic text NOT NULL,
  message text NOT NULL,
  learning_goals text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'scheduled')),
  coach_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT different_participants CHECK (student_id != coach_id)
);

-- Coach availability table for setting weekly schedule
CREATE TABLE IF NOT EXISTS coach_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'maybe')),
  notes text,
  is_recurring boolean NOT NULL DEFAULT true,
  specific_date date, -- for one-time availability changes
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Add is_hidden column to courses table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'is_hidden'
    ) THEN
        ALTER TABLE courses ADD COLUMN is_hidden boolean DEFAULT false;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_requests
CREATE POLICY "Students can manage their own requests"
  ON session_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view and respond to their requests"
  ON session_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- RLS Policies for coach_availability
CREATE POLICY "Coaches can manage their own availability"
  ON coach_availability
  FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Students can view coach availability"
  ON coach_availability
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_requests_student ON session_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_coach ON session_requests(coach_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_status ON session_requests(status);
CREATE INDEX IF NOT EXISTS idx_session_requests_preferred_time ON session_requests(preferred_time);

CREATE INDEX IF NOT EXISTS idx_coach_availability_coach ON coach_availability(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_availability_day ON coach_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_coach_availability_status ON coach_availability(status);

CREATE INDEX IF NOT EXISTS idx_courses_hidden ON courses(is_hidden);

-- Triggers for updated_at
CREATE TRIGGER update_session_requests_updated_at
  BEFORE UPDATE ON session_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_availability_updated_at
  BEFORE UPDATE ON coach_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();