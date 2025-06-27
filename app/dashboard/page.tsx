"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import StudentDashboard from "./components/StudentDashboard";
import CoachDashboard from "./components/CoachDashboard";
import AdminDashboard from "./components/AdminDashboard";

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<'student' | 'coach' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function checkUserAndRole() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Get user profile with role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Since middleware handles profile completion checks, 
        // we can assume if we reach here, the profile is complete
        if (!profile.role) {
          // This should not happen due to middleware, but just in case
          router.replace('/profile/complete-profile');
          return;
        }

        setUserRole(profile.role as 'student' | 'coach' | 'admin');
      } catch (error: any) {
        console.error("Error checking user role:", error);
        toast({
          title: "Error",
          description: "Failed to load user data. Please try again.",
          variant: "destructive",
        });
        router.push('/sign-in');
      } finally {
        setLoading(false);
      }
    }

    checkUserAndRole();
  }, [toast, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary/40 rounded-full animate-spin animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard
  switch (userRole) {
    case 'student':
      return <StudentDashboard />;
    case 'coach':
      return <CoachDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center animate-fadeIn">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">Unable to determine your role.</p>
            <button 
              onClick={() => router.push('/profile/complete-profile')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 mr-2"
            >
              Complete Profile
            </button>
            <button 
              onClick={() => router.push('/sign-in')}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              Sign In Again
            </button>
          </div>
        </div>
      );
  }
}