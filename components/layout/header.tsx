"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { LineChart, BookOpen, Shield, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

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
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Custom navigation link style with more padding
  const customNavLinkStyle = cn(
    navigationMenuTriggerStyle(),
    "px-4 mx-1" // Add horizontal padding and margin for more spacing
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between max-w-7xl">
        <div className="flex items-center gap-8"> {/* Increased gap from 6 to 8 */}
          <Link href="/" className="flex items-center space-x-2">
            <LineChart className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block text-xl">iTradeCoach</span>
          </Link>
          
          {/* Admin users only see Dashboard in navigation */}
          {user && userProfile?.role === 'admin' ? (
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="gap-2"> {/* Add gap between list items */}
                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                    <Link href="/dashboard" className={customNavLinkStyle}>
                      Dashboard
                      </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                    <Link href="/classroom" className={customNavLinkStyle}>
                      Classroom
                      </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : user && userProfile?.role === 'coach' ? (
            /* Coach navigation - Dashboard, Students, Classroom, Sessions, Requests, and Pricing */
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="gap-2"> {/* Add gap between list items */}
                <NavigationMenuItem>
                    <NavigationMenuLink className={customNavLinkStyle}>
                    <Link href="/dashboard" >
                      Dashboard
                      </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink className={customNavLinkStyle}>
                    <Link href="/students" >
                      Students
                      </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink className={customNavLinkStyle}>
                    <Link href="/classroom" >
                      Classroom
                      </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink className={customNavLinkStyle}>
                    <Link href="/sessions/schedule" >
                      Live Sessions
                      </Link>
                    </NavigationMenuLink>
                  
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink className={customNavLinkStyle}>
                    <Link href="/sessions/requests" >
                    Requests
                      </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/pricing" passHref>
                    <NavigationMenuLink className={customNavLinkStyle}>
                      Pricing
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            /* Regular navigation for students and non-authenticated users */
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="gap-2"> {/* Add gap between list items */}
                {user && (
                  <NavigationMenuItem>
                    <Link href="/dashboard" passHref>
                      <NavigationMenuLink className={customNavLinkStyle}>
                        Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}
                {user && (
                  <NavigationMenuItem>
                    <Link href="/coaches" passHref>
                      <NavigationMenuLink className={customNavLinkStyle}>
                        Find Coaches
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}
                {user && (
                  <NavigationMenuItem>
                    <Link href="/classroom" passHref>
                      <NavigationMenuLink className={customNavLinkStyle}>
                        Classroom
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(customNavLinkStyle, "data-[state=open]:bg-accent/50")}>
                    Learn
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px] grid-cols-2">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/learn"
                          >
                            <BookOpen className="h-6 w-6 mb-2" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Learning Paths
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Structured learning experiences customized to your skill level
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <Link href="/learn" passHref>
                          <NavigationMenuLink className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground")}>
                            <div className="text-sm font-medium leading-none">Beginner</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Start your trading journey here
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link href="/learn" passHref>
                          <NavigationMenuLink className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground")}>
                            <div className="text-sm font-medium leading-none">Intermediate</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Deepen your understanding
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link href="/learn" passHref>
                          <NavigationMenuLink className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground")}>
                            <div className="text-sm font-medium leading-none">Advanced</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Master complex trading strategies
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link href="/pricing" className={customNavLinkStyle}>
                          Pricing
                        </Link>
                      </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
                      <AvatarFallback>{user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {userProfile?.role === 'admin' && (
                        <p className="text-xs leading-none text-primary font-medium">Admin User</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  {userProfile?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="text-primary">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    disabled={loading}
                    className="text-red-600 focus:text-red-600"
                  >
                    {loading ? "Signing out..." : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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