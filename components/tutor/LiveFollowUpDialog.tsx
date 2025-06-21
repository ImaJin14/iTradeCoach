// components/tutor/LiveFollowUpDialog.tsx - New file
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, MessageCircle, Clock, ArrowRight } from "lucide-react";

interface VideoResponse {
  id: string;
  question: string;
  topic?: string;
  coach: {
    name: string;
    avatar_url: string | null;
  };
}

interface LiveFollowUpDialogProps {
  videoResponse: VideoResponse;
  onStartSession: () => void;
  onClose: () => void;
}

export function LiveFollowUpDialog({ 
  videoResponse, 
  onStartSession, 
  onClose 
}: LiveFollowUpDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Start Live Follow-up Session
          </DialogTitle>
          <DialogDescription>
            Continue learning with a real-time conversation about this topic
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Context Card */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Previous Question</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">"{videoResponse.question}"</p>
            {videoResponse.topic && (
              <Badge variant="secondary" className="text-xs">
                {videoResponse.topic}
              </Badge>
            )}
          </div>

          {/* What to Expect */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">What happens next:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Live video call opens with {videoResponse.coach.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>AI tutor knows what video you just watched</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Ask follow-up questions or request clarification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Share your screen for chart analysis help</span>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Session setup takes ~30 seconds
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={onStartSession} className="flex-1 gap-2">
              Start Live Session
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}