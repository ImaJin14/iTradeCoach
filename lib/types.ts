// User-related types
export type UserRole = "coach" | "student" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileComplete: boolean;
  createdAt: Date;
}

export interface CoachProfile {
  user_id: string;
  bio: string;
  expertiseAreas: string[];
  hourlyRate: number;
  videoIntroUrl?: string;
  availabilitySchedule: AvailabilitySlot[];
  verificationStatus: "pending" | "verified" | "rejected";
  algorandWallet?: string;
  rating: number;
  totalStudents: number;
  earnings: number;
  users: {
    name: string;
    email: string;
  };
}

export interface StudentProfile extends User {
  learningGoals: string[];
  currentLevel: "beginner" | "intermediate" | "advanced";
  tokensEarned: number;
  coursesCompleted: string[];
}

// Session-related types
export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Session {
  id: string;
  coachId: string;
  studentId: string;
  scheduledTime: Date;
  duration: number; // in minutes
  status: "scheduled" | "completed" | "cancelled";
  price: number;
  algorandTxHash?: string;
}

// Subscription-related types
export type SubscriptionTier = "basic" | "premium" | "pro";

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  startDate: Date;
  endDate: Date;
  active: boolean;
}

// Search and filtering types
export interface CoachSearchFilters {
  expertise?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  rating?: number;
  availability?: {
    day?: string;
    timeRange?: {
      start?: string;
      end?: string;
    };
  };
}