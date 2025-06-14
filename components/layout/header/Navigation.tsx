"use client";

import { AdminNavigation } from "./AdminNavigation";
import { CoachNavigation } from "./CoachNavigation";
import { StudentNavigation } from "./StudentNavigation";

interface NavigationProps {
  user: any;
  userProfile: any;
}

export function Navigation({ user, userProfile }: NavigationProps) {
  if (!user) {
    return <StudentNavigation user={user} userProfile={userProfile} />;
  }

  switch (userProfile?.role) {
    case 'admin':
      return <AdminNavigation />;
    case 'coach':
      return <CoachNavigation />;
    default:
      return <StudentNavigation user={user} userProfile={userProfile} />;
  }
}