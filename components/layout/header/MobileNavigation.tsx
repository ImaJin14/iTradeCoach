"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Shield, 
  User, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  MessageSquare,
  DollarSign,
  Search
} from "lucide-react";

interface MobileNavigationProps {
  user: any;
  userProfile: any;
  avatarUrl: string | null;
  onSignOut: () => void;
  loading: boolean;
  onNavigate: () => void;
}

export function MobileNavigation({ 
  user, 
  userProfile, 
  avatarUrl, 
  onSignOut, 
  loading, 
  onNavigate 
}: MobileNavigationProps) {
  
  const handleLinkClick = () => {
    onNavigate();
  };

  const handleSignOut = () => {
    onSignOut();
    onNavigate();
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!user) {
      return [
        { href: "/learn", label: "Learn", icon: BookOpen },
        { href: "/tutor", label: "AI Tutor", icon: GraduationCap },
        { href: "/pricing", label: "Pricing", icon: DollarSign },
      ];
    }

    const baseItems = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ];

    switch (userProfile?.role) {
      case 'admin':
        return [
          ...baseItems,
          { href: "/classroom", label: "Classroom", icon: GraduationCap },
        ];
      
      case 'coach':
        return [
          ...baseItems,
          { href: "/students", label: "Students", icon: Users },
          { href: "/classroom", label: "Classroom", icon: GraduationCap },
          { href: "/sessions/schedule", label: "Live Sessions", icon: Calendar },
          { href: "/sessions/requests", label: "Requests", icon: MessageSquare },
          { href: "/pricing", label: "Pricing", icon: DollarSign },
        ];
      
      default: // student
        return [
          ...baseItems,
          { href: "/coaches", label: "Find Coaches", icon: Search },
          { href: "/classroom", label: "Classroom", icon: GraduationCap },
          { href: "/learn", label: "Learn", icon: BookOpen },
          { href: "/tutor", label: "AI Tutor", icon: GraduationCap },
          { href: "/pricing", label: "Pricing", icon: DollarSign },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="text-lg font-semibold">Menu</div>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
              <AvatarFallback>{user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.user_metadata?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              {userProfile?.role === 'admin' && (
                <p className="text-xs text-primary font-medium">Admin User</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 p-6 space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
            className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="p-6 border-t space-y-4">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Theme</span>
          <ModeToggle />
        </div>

        <Separator />

        {user ? (
          <div className="space-y-2">
            {/* User Actions */}
            <Link
              href="/profile"
              onClick={handleLinkClick}
              className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full"
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
            
            <Link
              href="/settings"
              onClick={handleLinkClick}
              className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>

            {userProfile?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={handleLinkClick}
                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full text-primary"
              >
                <Shield className="h-5 w-5" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            <Separator />

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-left text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>{loading ? "Signing out..." : "Log out"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="/sign-in" onClick={handleLinkClick} className="w-full">
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up" onClick={handleLinkClick} className="w-full">
              <Button className="w-full">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}