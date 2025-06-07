/*
  # Live Sessions Schema

  Create tables for live session scheduling and management:
  - live_sessions: Main table for scheduled live sessions
  - session_enrollments: Track student enrollments in live sessions
  - session_recordings: Store session recordings (optional)
*/

-- Live sessions table
CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  learning_path text NOT NULL CHECK (learning_path IN ('beginner', 'intermediate', 'advanced')),
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

-- Session enrollments table
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

-- Session recordings table (optional)
CREATE TABLE IF NOT EXISTS session_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  recording_url text NOT NULL,
  duration integer, -- in seconds
  file_size bigint, -- in bytes
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_sessions
CREATE POLICY "Coaches can manage their own sessions"
  ON live_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Students can view published sessions"
  ON live_sessions
  FOR SELECT
  TO authenticated
  USING (status IN ('scheduled', 'live'));

-- RLS Policies for session_enrollments
CREATE POLICY "Students can manage their own enrollments"
  ON session_enrollments
  FOR ALL
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view enrollments for their sessions"
  ON session_enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE live_sessions.id = session_enrollments.session_id
      AND live_sessions.coach_id = auth.uid()
    )
  );

-- RLS Policies for session_recordings
CREATE POLICY "Coaches can manage recordings for their sessions"
  ON session_recordings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE live_sessions.id = session_recordings.session_id
      AND live_sessions.coach_id = auth.uid()
    )
  );

CREATE POLICY "Enrolled students can view recordings"
  ON session_recordings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM session_enrollments
      WHERE session_enrollments.session_id = session_recordings.session_id
      AND session_enrollments.student_id = auth.uid()
      AND session_enrollments.status = 'attended'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_sessions_coach ON live_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled_time ON live_sessions(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_live_sessions_learning_path ON live_sessions(learning_path);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);

CREATE INDEX IF NOT EXISTS idx_session_enrollments_session ON session_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_student ON session_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_status ON session_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_session_recordings_session ON session_recordings(session_id);

-- Triggers for updated_at
CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_enrollments_updated_at
  BEFORE UPDATE ON session_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update participant count
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

-- Trigger to automatically update participant count
CREATE TRIGGER update_participant_count_trigger
  AFTER INSERT OR DELETE ON session_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_session_participant_count();