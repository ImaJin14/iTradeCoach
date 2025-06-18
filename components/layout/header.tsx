"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LineChart, Menu } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { UserDropdown } from "./header/UserDropdown";
import { Navigation } from "./header/Navigation";
import { MobileNavigation } from "./header/MobileNavigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

      // Close mobile menu
      setIsMobileMenuOpen(false);

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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between max-w-7xl">
        {/* Logo - Always visible */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <LineChart className="h-6 w-6" />
            <span className="font-bold text-xl">iTradeCoach</span>
          </Link>
        </div>
        
        {/* Desktop Navigation - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          <Navigation user={user} userProfile={userProfile} />
        </div>
        
        {/* Desktop Right Side - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
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
                <Link href="/sign-up" passHref>
                  <Button>Get Started</Button>
                </Link>
              </>
            )
          )}
        </div>

        {/* Mobile Hamburger Menu - Only visible on mobile */}
        <div className="flex md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <MobileNavigation 
                user={user}
                userProfile={userProfile}
                avatarUrl={avatarUrl}
                onSignOut={handleSignOut}
                loading={loading}
                onNavigate={closeMobileMenu}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}