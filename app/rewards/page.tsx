"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Gift, Star } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Rewards</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle>Knowledge Tokens</CardTitle>
            </div>
            <CardDescription>Earn tokens by completing lessons and sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">240</div>
            <p className="text-sm text-muted-foreground">
              Tokens available to spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              <CardTitle>Available Rewards</CardTitle>
            </div>
            <CardDescription>Redeem your tokens for exclusive rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">1-on-1 Session</div>
                  <div className="text-sm text-muted-foreground">30 minutes with any coach</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">500</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Premium Course</div>
                  <div className="text-sm text-muted-foreground">Any course from our catalog</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">1000</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <CardTitle>Achievement Progress</CardTitle>
            </div>
            <CardDescription>Track your learning milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">First Session</span>
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Complete 5 Lessons</span>
                  <span className="text-sm text-muted-foreground">3/5</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-full bg-primary rounded-full" style={{ width: "60%" }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}