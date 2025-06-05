import Link from "next/link";
import { LineChart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2">
              <LineChart className="h-6 w-6" />
              <span className="font-bold text-xl">iTradeCoach</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Expert trading coaching for all skill levels
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Platform</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/coaches" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Find Coaches
              </Link>
              <Link href="/become-a-coach" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Become a Coach
              </Link>
              <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            </nav>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Resources</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Learning Paths
              </Link>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
              <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Community
              </Link>
            </nav>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Company</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </Link>
              <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Careers
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="/press" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Press
              </Link>
            </nav>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2 md:col-span-1">
            <h3 className="font-medium">Legal</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cookie Policy
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-96 items-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} iTradeCoach. All rights reserved.
            </p>
            <Link 
              href="https://bolt.new"
              target="_blank"
              rel="noopener noreferrer" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Built with Bolt.new ⚡
            </Link>
          </div>
          <div className="flex gap-4">
            <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </Link>
            <Link href="https://linkedin.com" className="text-muted-foreground hover:text-foreground transition-colors">
              LinkedIn
            </Link>
            <Link href="https://discord.com" className="text-muted-foreground hover:text-foreground transition-colors">
              Discord
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}