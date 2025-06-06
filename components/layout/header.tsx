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
import { LineChart, BookOpen } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          await supabase.auth.signOut();
          if (pathname === '/dashboard') {
            router.push('/sign-in');
          }
          return;
        }
        
        // Fetch user profile to get avatar URL
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setAvatarUrl(profile.avatar_url);
          user.user_metadata.name = profile.name;
        }
        
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        await supabase.auth.signOut();
        if (pathname === '/dashboard') {
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between max-w-7xl">
        <div className="flex items-center gap-6">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <LineChart className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block text-xl">iTradeCoach</span>
          </Link>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {user && (
                <NavigationMenuItem>
                  <Link href="/dashboard\" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Dashboard
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )}
              {user && (
                <NavigationMenuItem>
                  <Link href="/coaches" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Find Coaches
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
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
                      <Link href="/learn/beginner" legacyBehavior passHref>
                        <NavigationMenuLink className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground")}>
                          <div className="text-sm font-medium leading-none">Beginner</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Start your trading journey here
                          </p>
                        </NavigationMenuLink>
                      </Link>
                    </li>
                    <li>
                      <Link href="/learn/intermediate" legacyBehavior passHref>
                        <NavigationMenuLink className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground")}>
                          <div className="text-sm font-medium leading-none">Intermediate</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Deepen your understanding
                          </p>
                        </NavigationMenuLink>
                      </Link>
                    </li>
                    <li>
                      <Link href="/learn/advanced" legacyBehavior passHref>
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
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost\" className="relative h-8 w-8 rounded-full">
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
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
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