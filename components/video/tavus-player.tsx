"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getVideoStatus, type VideoResponse } from '@/lib/tavus';
import { Loader2 } from 'lucide-react';

interface TavusPlayerProps {
  videoId: string;
}

export function TavusPlayer({ videoId }: TavusPlayerProps) {
  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getVideoStatus(videoId);
        setVideo(status);

        if (status.status === 'processing') {
          // Check again in 5 seconds
          setTimeout(checkStatus, 5000);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load video');
      }
    };

    checkStatus();
  }, [videoId]);

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!video || video.status === 'processing') {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing video...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (video.status === 'failed') {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">
            Video processing failed
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalized Video Response</CardTitle>
        <CardDescription>
          Watch your AI-generated video response
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video rounded-lg overflow-hidden">
          <video
            src={video.url}
            controls
            className="w-full h-full"
            poster="/video-thumbnail.jpg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </CardContent>
    </Card>
  );
}