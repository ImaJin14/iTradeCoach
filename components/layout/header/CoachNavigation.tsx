"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function CoachNavigation() {
  const customNavLinkStyle = cn(
    navigationMenuTriggerStyle(),
    "px-4 mx-1"
  );

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="gap-2">
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/dashboard" className={customNavLinkStyle}>
              Dashboard
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/students" className={customNavLinkStyle}>
              Students
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
        
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/sessions/schedule" className={customNavLinkStyle}>
              Live Sessions
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/sessions/requests" className={customNavLinkStyle}>
              Requests
            </Link>
          </NavigationMenuLink>
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
  );
}