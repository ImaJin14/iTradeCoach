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

export function AdminNavigation() {
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
            <Link href="/classroom" className={customNavLinkStyle}>
              Classroom
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}