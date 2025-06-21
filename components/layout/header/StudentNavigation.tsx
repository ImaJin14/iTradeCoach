"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { BookOpen, Bot } from "lucide-react";

interface StudentNavigationProps {
  user: any;
  userProfile: any;
}

export function StudentNavigation({ user, userProfile }: StudentNavigationProps) {
  const customNavLinkStyle = cn(
    navigationMenuTriggerStyle(),
    "px-4 mx-1"
  );

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="gap-2">
        {user && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/dashboard" className={customNavLinkStyle}>
                Dashboard
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
        
        {user && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/coaches" className={customNavLinkStyle}>
                Find Coaches
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
        
        {user && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/classroom" className={customNavLinkStyle}>
                Classroom
              </Link>
            </NavigationMenuLink>
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
                  <Link
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
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link href="/learn" className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground")}>
                    <div className="text-sm font-medium leading-none">Beginner</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Start your trading journey here
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link href="/learn" className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground")}>
                    <div className="text-sm font-medium leading-none">Intermediate</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Deepen your understanding
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link href="/learn" className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground")}>
                    <div className="text-sm font-medium leading-none">Advanced</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Master complex trading strategies
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/tutor" className={cn(customNavLinkStyle, "flex items-center gap-2")}>
              <Bot className="h-4 w-4" />
              iTrader
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