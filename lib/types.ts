// ================================================================
// iTradeCoach Complete TypeScript Types
// ================================================================
// 
// This file provides complete TypeScript types for the iTradeCoach platform
// Matches the PostgreSQL schema with Supabase extensions
// 
// Generated: 2025
// ================================================================

// ================================================================
// SECTION 1: ENUMS AND UNION TYPES
// ================================================================

export type UserRole = 'student' | 'coach' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';
export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled';
export type PaymentStatus = 'succeeded' | 'failed' | 'pending';
export type BlogPostStatus = 'draft' | 'published' | 'archived';
export type CommentStatus = 'pending' | 'approved' | 'rejected';
export type FileType = 'pdf' | 'video' | 'audio' | 'document' | 'link';
export type AvailabilityStatus = 'available' | 'busy' | 'maybe';
export type LiveSessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'enrolled' | 'attended' | 'missed' | 'cancelled';
export type UploadStatus = 'processing' | 'ready' | 'failed';
export type VideoResponseStatus = 'processing' | 'completed' | 'failed';
export type SessionRequestStatus = 'pending' | 'approved' | 'rejected' | 'scheduled';
export type SubscriptionInterval = 'month' | 'year';
export type Currency = 'USD';

// ================================================================
// SECTION 2: BASE INTERFACES
// ================================================================

export interface BaseTimestamps {
  created_at: string;
  updated_at: string;
}

export interface BaseEntity extends BaseTimestamps {
  id: string;
}

// ================================================================
// SECTION 3: USER TYPES
// ================================================================

export interface Profile {
  id: string;
  name: string | null;
  role: UserRole | null;
  email: string | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends BaseTimestamps {
  prof_id: string;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  avatar_url: string | null;
  profile_complete: boolean;
}

export interface UserSettings extends BaseTimestamps {
  id: string;
  prof_id: string | null;
  notifications: NotificationSettings;
  timezone: string;
  language: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  marketing: boolean;
}

export interface CoachProfile extends BaseTimestamps {
  coach_id: string;
  expertise_areas: string[];
  hourly_rate: number;
  video_intro_url: string | null;
  verification_status: VerificationStatus;
  algorand_wallet: string | null;
  rating: number;
  total_students: number;
  earnings: number;
  subscription_required: boolean;
  subscription_active: boolean;
}

export interface StudentProfile extends BaseTimestamps {
  student_id: string;
  learning_goals: string[];
  current_level: StudentLevel;
  tokens_earned: number;
  courses_completed: string[];
  selected_path: string | null;
  selected_coach_id: string | null;
  subscription_required: boolean;
}

// ================================================================
// SECTION 4: SUBSCRIPTION TYPES
// ================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: SubscriptionInterval;
  role: UserRole;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface Subscription extends BaseTimestamps {
  id: string;
  prof_id: string | null;
  plan_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface PaymentHistory {
  id: string;
  subscription_id: string | null;
  prof_id: string | null;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  payment_method: string | null;
  created_at: string;
}

// ================================================================
// SECTION 5: SESSION TYPES
// ================================================================

export interface Session extends BaseTimestamps {
  id: string;
  coach_id: string;
  student_id: string;
  scheduled_time: string;
  duration: number;
  status: SessionStatus;
  price: number;
  notes: string | null;
}

export interface SessionRequest extends BaseTimestamps {
  id: string;
  coach_id: string;
  student_id: string;
  preferred_time: string;
  duration: number;
  topic: string;
  message: string;
  learning_goals: string | null;
  status: SessionRequestStatus;
  coach_response: string | null;
}

export interface CoachAvailability extends BaseTimestamps {
  id: string;
  coach_id: string;
  day_of_week: number; // 0-6, Sunday to Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  status: AvailabilityStatus;
  notes: string | null;
  is_recurring: boolean;
  specific_date: string | null; // YYYY-MM-DD format
}

// ================================================================
// SECTION 6: LIVE SESSION TYPES
// ================================================================

export interface LiveSession extends BaseTimestamps {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  learning_path: StudentLevel;
  scheduled_time: string;
  duration: number;
  max_participants: number;
  current_participants: number;
  price: number;
  status: LiveSessionStatus;
  meeting_url: string | null;
  recording_url: string | null;
}

export interface SessionEnrollment extends BaseTimestamps {
  id: string;
  session_id: string;
  student_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
}

export interface SessionRecording {
  id: string;
  session_id: string;
  recording_url: string;
  duration: number | null;
  file_size: number | null;
  upload_status: UploadStatus;
  created_at: string;
}

export interface LiveSessionFeedback {
  id: string;
  live_session_id: string;
  student_id: string;
  rating: number; // 1-5
  feedback_text: string | null;
  created_at: string;
}

export interface SessionMaterial {
  id: string;
  session_id: string | null;
  live_session_id: string | null;
  title: string;
  description: string | null;
  file_url: string;
  file_type: FileType;
  uploaded_by: string;
  created_at: string;
}

// ================================================================
// SECTION 7: VIDEO SYSTEM TYPES
// ================================================================

export interface VideoTemplate extends BaseTimestamps {
  id: string;
  coach_id: string;
  tavus_template_id: string;
  name: string;
  description: string | null;
  script: string;
}

export interface VideoResponse extends BaseTimestamps {
  id: string;
  template_id: string;
  coach_id: string;
  student_id: string;
  tavus_video_id: string;
  status: VideoResponseStatus;
  url: string | null;
}

// ================================================================
// SECTION 8: BLOG TYPES
// ================================================================

export interface BlogCategory extends BaseTimestamps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogPost extends BaseTimestamps {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  author_id: string;
  category_id: string | null;
  status: BlogPostStatus;
  featured: boolean;
  read_time: number;
  views_count: number;
  published_at: string | null;
}

export interface BlogPostTag {
  id: string;
  post_id: string;
  tag_id: string;
  created_at: string;
}

export interface BlogComment extends BaseTimestamps {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  status: CommentStatus;
}

// ================================================================
// SECTION 9: COURSE AND TESTIMONIAL TYPES
// ================================================================

export interface Course extends BaseTimestamps {
  id: number;
  student_id: string;
  coach_id: string;
  title: string;
  description: string | null;
  is_hidden: boolean;
}

export interface Testimonial extends BaseTimestamps {
  id: string;
  text: string;
  author_id: string;
  author_name: string;
  author_title: string;
  rating: number; // 1-5
  approved: boolean;
}

// ================================================================
// SECTION 10: VIEW TYPES (For analytics and aggregated data)
// ================================================================

export interface UserCompleteProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  subscription_status: SubscriptionStatus;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  avatar_url: string | null;
  profile_complete: boolean;
  notifications: NotificationSettings;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface CoachStatistics {
  coach_id: string;
  name: string | null;
  rating: number;
  total_students: number;
  earnings: number;
  hourly_rate: number;
  verification_status: VerificationStatus;
  subscription_active: boolean;
  total_sessions: number;
  total_live_sessions: number;
  enrolled_students: number;
}

export interface StudentProgress {
  student_id: string;
  name: string | null;
  current_level: StudentLevel;
  tokens_earned: number;
  courses_completed_count: number;
  total_sessions: number;
  enrolled_live_sessions: number;
  selected_coach_id: string | null;
}

export interface UpcomingSession {
  id: string;
  scheduled_time: string;
  duration: number;
  status: SessionStatus;
  price: number;
  coach_name: string | null;
  student_name: string | null;
  notes: string | null;
}

export interface SessionAnalytics {
  month: string;
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  avg_price: number;
  total_revenue: number;
}

// ================================================================
// SECTION 11: API RESPONSE TYPES
// ================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ================================================================
// SECTION 12: FORM TYPES
// ================================================================

export interface CreateSessionRequest {
  coach_id: string;
  preferred_time: string;
  duration: number;
  topic: string;
  message: string;
  learning_goals?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  avatar_url?: string;
}

export interface CreateLiveSessionRequest {
  title: string;
  description: string;
  learning_path: StudentLevel;
  scheduled_time: string;
  duration: number;
  max_participants: number;
  price: number;
}

export interface CreateBlogPostRequest {
  title: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  category_id?: string;
  tag_ids?: string[];
  status?: BlogPostStatus;
  featured?: boolean;
}

export interface CreateTestimonialRequest {
  text: string;
  author_name: string;
  author_title: string;
  rating: number;
}

// ================================================================
// SECTION 13: FILTER AND QUERY TYPES
// ================================================================

export interface SessionFilters {
  coach_id?: string;
  student_id?: string;
  status?: SessionStatus;
  date_from?: string;
  date_to?: string;
}

export interface CoachFilters {
  expertise_areas?: string[];
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  rating_min?: number;
  verification_status?: VerificationStatus;
  subscription_active?: boolean;
}

export interface BlogPostFilters {
  category_id?: string;
  tag_ids?: string[];
  author_id?: string;
  status?: BlogPostStatus;
  featured?: boolean;
  search?: string;
}

export interface LiveSessionFilters {
  coach_id?: string;
  learning_path?: StudentLevel;
  status?: LiveSessionStatus;
  date_from?: string;
  date_to?: string;
  available_spots?: boolean;
}

// ================================================================
// SECTION 14: UTILITY TYPES
// ================================================================

export type DatabaseTables = 
  | 'profiles'
  | 'user_profiles'
  | 'coach_profiles'
  | 'student_profiles'
  | 'subscription_plans'
  | 'subscriptions'
  | 'payment_history'
  | 'sessions'
  | 'session_requests'
  | 'coach_availability'
  | 'live_sessions'
  | 'session_enrollments'
  | 'session_recordings'
  | 'live_session_feedback'
  | 'session_materials'
  | 'video_templates'
  | 'video_responses'
  | 'blog_categories'
  | 'blog_tags'
  | 'blog_posts'
  | 'blog_post_tags'
  | 'blog_comments'
  | 'courses'
  | 'testimonials'
  | 'user_settings';

// Helper types for creating and updating records
export type CreateRecord<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateRecord<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

// Role-specific user types
export type CoachUser = Profile & {
  role: 'coach';
  coach_profile?: CoachProfile;
};

export type StudentUser = Profile & {
  role: 'student';
  student_profile?: StudentProfile;
};

export type AdminUser = Profile & {
  role: 'admin';
};

// ================================================================
// SECTION 15: SUPABASE SPECIFIC TYPES
// ================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: CreateRecord<Profile>;
        Update: UpdateRecord<Profile>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: CreateRecord<UserProfile>;
        Update: UpdateRecord<UserProfile>;
      };
      coach_profiles: {
        Row: CoachProfile;
        Insert: CreateRecord<CoachProfile>;
        Update: UpdateRecord<CoachProfile>;
      };
      student_profiles: {
        Row: StudentProfile;
        Insert: CreateRecord<StudentProfile>;
        Update: UpdateRecord<StudentProfile>;
      };
      sessions: {
        Row: Session;
        Insert: CreateRecord<Session>;
        Update: UpdateRecord<Session>;
      };
      live_sessions: {
        Row: LiveSession;
        Insert: CreateRecord<LiveSession>;
        Update: UpdateRecord<LiveSession>;
      };
      blog_posts: {
        Row: BlogPost;
        Insert: CreateRecord<BlogPost>;
        Update: UpdateRecord<BlogPost>;
      };
      // Add other tables as needed...
    };
    Views: {
      user_complete_profiles: {
        Row: UserCompleteProfile;
      };
      coach_statistics: {
        Row: CoachStatistics;
      };
      student_progress: {
        Row: StudentProgress;
      };
      upcoming_sessions: {
        Row: UpcomingSession;
      };
      session_analytics: {
        Row: SessionAnalytics;
      };
    };
    Functions: {
      populate_role_specific_tables: {
        Args: Record<PropertyKey, never>;
        Returns: {
          students_added: number;
          coaches_added: number;
        };
      };
    };
    Enums: {
      user_role: UserRole;
      verification_status: VerificationStatus;
      session_status: SessionStatus;
      student_level: StudentLevel;
    };
  };
}

// Export the Database type for use with Supabase client
export type SupabaseDatabase = Database;

// ================================================================
// END OF TYPES
// ================================================================