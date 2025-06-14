"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LineChart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { UserDropdown } from "./header/UserDropdown";
import { Navigation } from "./header/Navigation";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          await supabase.auth.signOut();
          if (pathname === '/dashboard' || pathname === '/admin') {
            router.push('/sign-in');
          }
          return;
        }
        
        // Fetch user profile to get role and avatar
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          user.user_metadata.name = profile.name;
          user.user_metadata.role = profile.role;
        }
        
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        await supabase.auth.signOut();
        if (pathname === '/dashboard' || pathname === '/admin') {
          router.push('/sign-in');
        }
      } finally {
        setLoading(false);
      }
    }
    getUser();
  }, [router, pathname]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user state
      setUser(null);
      setUserProfile(null);
      setAvatarUrl(null);

      // Show success message
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });

      // Redirect to home page
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between max-w-7xl">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <LineChart className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block text-xl">iTradeCoach</span>
          </Link>
          
          <Navigation user={user} userProfile={userProfile} />
        </div>
        
        <div className="flex items-center gap-2">
          <ModeToggle />
          {!loading && (
            user ? (
              <UserDropdown 
                user={user}
                userProfile={userProfile}
                avatarUrl={avatarUrl}
                onSignOut={handleSignOut}
                loading={loading}
              />
            ) : (
              <>
                <Link href="/sign-in" passHref>
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/sign-up" passHref className="hidden sm:block">
                  <Button>Get Started</Button>
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}