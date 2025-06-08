// ================================================================
// CORE ENUMS AND TYPES (matching database enums)
// ================================================================

export type UserRole = 'student' | 'coach' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';
export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled';
export type PaymentStatus = 'succeeded' | 'failed' | 'pending';
export type BlogPostStatus = 'draft' | 'published' | 'archived';
export type CommentStatus = 'pending' | 'approved' | 'rejected';
export type EnrollmentStatus = 'enrolled' | 'attended' | 'missed' | 'cancelled';
export type LiveSessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'scheduled';
export type VideoResponseStatus = 'processing' | 'completed' | 'failed';
export type LearningPath = 'beginner' | 'intermediate' | 'advanced';

// ================================================================
// USER PROFILES
// ================================================================

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  bio?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  avatar_url?: string;
  profile_complete: boolean;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface CoachProfile {
  coach_id: string;
  bio: string;
  expertise_areas: string[];
  hourly_rate: number;
  video_intro_url?: string;
  verification_status: VerificationStatus;
  algorand_wallet?: string;
  rating: number;
  total_students: number;
  earnings: number;
  subscription_required: boolean;
  subscription_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  student_id: string;
  learning_goals: string[];
  current_level: StudentLevel;
  tokens_earned: number;
  courses_completed: string[];
  selected_path?: string;
  selected_coach_id?: string;
  subscription_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  coach_id?: string;
  student_id?: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

// ================================================================
// SUBSCRIPTION SYSTEM
// ================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  interval: 'month' | 'year';
  role: UserRole;
  features: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id: string;
  coach_id?: string;
  student_id?: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentHistory {
  id: string;
  coach_id?: string;
  student_id?: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  created_at?: string;
}

// ================================================================
// SESSIONS AND COACHING
// ================================================================

export interface Session {
  id: string;
  coach_id: string;
  student_id: string;
  scheduled_time: string;
  duration: number;
  status: SessionStatus;
  price: number;
  algorand_tx_hash?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRequest {
  id: string;
  student_id: string;
  coach_id: string;
  preferred_time: string;
  duration: number;
  topic: string;
  message: string;
  learning_goals?: string;
  status: RequestStatus;
  coach_response?: string;
  created_at: string;
  updated_at: string;
}

export interface CoachAvailability {
  id: string;
  coach_id: string;
  day_of_week: number; // 0 = Sunday
  start_time: string;
  end_time: string;
  status: 'available' | 'busy' | 'maybe';
  notes?: string;
  is_recurring: boolean;
  specific_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LiveSession {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  learning_path: LearningPath;
  scheduled_time: string;
  duration: number;
  max_participants: number;
  current_participants: number;
  price: number;
  status: LiveSessionStatus;
  meeting_url?: string;
  recording_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionEnrollment {
  id: string;
  session_id: string;
  student_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface SessionRecording {
  id: string;
  session_id: string;
  recording_url: string;
  duration?: number;
  file_size?: number;
  created_at: string;
}

// ================================================================
// VIDEO SYSTEM (TAVUS INTEGRATION)
// ================================================================

export interface VideoTemplate {
  id: string;
  coach_id: string;
  tavus_template_id: string;
  name: string;
  description?: string;
  script: string;
  created_at: string;
  updated_at: string;
}

export interface VideoResponse {
  id: string;
  template_id: string;
  coach_id: string;
  student_id: string;
  tavus_video_id: string;
  status: VideoResponseStatus;
  url?: string;
  created_at: string;
  updated_at: string;
}

// ================================================================
// BLOG AND CONTENT
// ================================================================

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  author_id: string;
  category_id?: string;
  status: BlogPostStatus;
  featured: boolean;
  read_time: number;
  views_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPostTag {
  id: string;
  post_id: string;
  tag_id: string;
  created_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  status: CommentStatus;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

// ================================================================
// TESTIMONIALS
// ================================================================

export interface Testimonial {
  id: string;
  text: string;
  author_id: string;
  author_name: string;
  author_title: string;
  rating: number;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

// ================================================================
// EXTENDED TYPES WITH RELATIONS
// ================================================================

export interface CoachWithProfile extends CoachProfile {
  profile: Profile;
  availability?: CoachAvailability[];
  live_sessions?: LiveSession[];
  testimonials?: Testimonial[];
}

export interface StudentWithProfile extends StudentProfile {
  profile: Profile;
  sessions?: Session[];
  enrollments?: SessionEnrollment[];
}

export interface SessionWithDetails extends Session {
  coach: {
    name: string;
    avatar_url?: string;
  };
  student: {
    name: string;
    avatar_url?: string;
  };
}

export interface LiveSessionWithDetails extends LiveSession {
  coach: {
    name: string;
    avatar_url?: string;
  };
  enrollments?: SessionEnrollment[];
}

export interface BlogPostWithDetails extends BlogPost {
  author: {
    name: string;
    avatar_url?: string;
  };
  category?: BlogCategory;
  tags?: BlogTag[];
  comments?: BlogComment[];
}

// ================================================================
// SEARCH AND FILTERING
// ================================================================

export interface CoachSearchFilters {
  expertise?: string[];
  price_range?: {
    min?: number;
    max?: number;
  };
  rating?: number;
  verification_status?: VerificationStatus;
  availability?: {
    day?: number;
    time_range?: {
      start?: string;
      end?: string;
    };
  };
  subscription_active?: boolean;
}

export interface SessionSearchFilters {
  coach_id?: string;
  student_id?: string;
  status?: SessionStatus;
  date_range?: {
    start?: string;
    end?: string;
  };
}

export interface BlogSearchFilters {
  category_id?: string;
  tag_ids?: string[];
  author_id?: string;
  status?: BlogPostStatus;
  featured?: boolean;
  search?: string;
}

// ================================================================
// API RESPONSE TYPES
// ================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ================================================================
// DASHBOARD STATS (matching views from schema)
// ================================================================

export interface CoachDashboardStats {
  coach_id: string;
  name: string;
  email: string;
  rating: number;
  total_students: number;
  earnings: number;
  verification_status: VerificationStatus;
  subscription_active: boolean;
  total_sessions: number;
  completed_sessions: number;
  total_live_sessions: number;
  unique_students_taught: number;
  avg_session_price: number;
}

export interface StudentDashboardStats {
  student_id: string;
  name: string;
  email: string;
  current_level: StudentLevel;
  tokens_earned: number;
  selected_path?: string;
  selected_coach_id?: string;
  coach_name?: string;
  total_sessions_booked: number;
  completed_sessions: number;
  live_sessions_attended: number;
  total_spent: number;
}

export interface PlatformStats {
  total_users: number;
  total_coaches: number;
  total_students: number;
  verified_coaches: number;
  active_subscriptions: number;
  total_sessions: number;
  total_live_sessions: number;
  total_revenue: number;
  avg_coach_rating: number;
}

// ================================================================
// FORM AND INPUT TYPES
// ================================================================

export interface CreateSessionRequest {
  coach_id: string;
  preferred_time: string;
  duration: number;
  topic: string;
  message: string;
  learning_goals?: string;
}

export interface CreateLiveSession {
  title: string;
  description: string;
  learning_path: LearningPath;
  scheduled_time: string;
  duration: number;
  max_participants: number;
  price: number;
}

export interface UpdateCoachProfile {
  bio?: string;
  expertise_areas?: string[];
  hourly_rate?: number;
  video_intro_url?: string;
  algorand_wallet?: string;
}

export interface UpdateStudentProfile {
  learning_goals?: string[];
  current_level?: StudentLevel;
  selected_path?: string;
  selected_coach_id?: string;
}

export interface CreateBlogPost {
  title: string;
  content: string;
  excerpt?: string;
  category_id?: string;
  tag_ids?: string[];
  featured_image_url?: string;
  status?: BlogPostStatus;
  featured?: boolean;
}

// ================================================================
// UTILITY TYPES
// ================================================================

export type TableNames = 
  | 'profiles'
  | 'coach_profiles'
  | 'student_profiles'
  | 'sessions'
  | 'session_requests'
  | 'live_sessions'
  | 'session_enrollments'
  | 'blog_posts'
  | 'testimonials'
  | 'subscriptions'
  | 'payment_history';

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

// ================================================================
// ERROR TYPES
// ================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: ValidationError[];
}