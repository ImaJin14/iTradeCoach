"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export function BoltBadge() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder during SSR to avoid hydration mismatch
    return (
      <div className="fixed top-24 right-4 z-50 w-12 h-12 rounded-full bg-muted animate-pulse" />
    );
  }

  // Determine which badge to show based on theme
  const isDark = resolvedTheme === 'dark' || theme === 'dark';
  const badgeImage = isDark ? '/white_circle_360x360.png' : '/black_circle_360x360.png';
  const badgeAlt = isDark ? 'Built with Bolt.new - White Badge' : 'Built with Bolt.new - Black Badge';

  return (
    <Link
      href="https://bolt.new/"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed top-24 right-4 z-50 transition-all duration-300 hover:scale-110 hover:shadow-lg group"
      aria-label="Built with Bolt.new"
    >
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
        <Image
          src={badgeImage}
          alt={badgeAlt}
          fill
          className="object-contain transition-all duration-300 group-hover:rotate-12"
          sizes="(max-width: 640px) 48px, (max-width: 768px) 56px, 64px"
          priority
        />
        
        {/* Optional subtle shadow/glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md -z-10" />
      </div>
      
      {/* Tooltip */}
      <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        Built with Bolt.new
      </div>
    </Link>
  );
}