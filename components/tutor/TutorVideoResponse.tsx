"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Clock, CheckCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VideoResponse {
  id: string;
  coach_id: string;
  student_id: string;
  status: string;
  url: string | null;
  created_at: string;
  coach: {
    name: string;
    avatar_url: string | null;
  };
}

interface TutorVideoResponseProps {
  videoResponses: VideoResponse[];
}

export function TutorVideoResponse({ videoResponses }: TutorVideoResponseProps) {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (videoResponses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 text-muted-foreground">
              <Play className="h-full w-full" />
            </div>
            <div>
              <h3 className="text-lg font-medium">No video responses yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Submit a question using the form on the right to get your first AI tutor video response.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {videoResponses.map((response) => (
        <Card key={response.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={response.coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${response.coach_id}`} 
                  />
                  <AvatarFallback>{response.coach.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{response.coach.name}</CardTitle>
                  <CardDescription>Trading Question Response</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(response.status)}>
                  {getStatusIcon(response.status)}
                  <span className="ml-1 capitalize">{response.status}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {response.status === 'ready' && response.url ? (
              <div className="space-y-3">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {playingVideo === response.id ? (
                    <video
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      onEnded={() => setPlayingVideo(null)}
                    >
                      <source src={response.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => setPlayingVideo(response.id)}
                    >
                      <Button size="lg" className="gap-2">
                        <Play className="h-5 w-5" />
                        Play Response
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : response.status === 'processing' ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Generating your personalized video response...
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Video response will be available soon
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}