"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { recordTemplateVideo, stopRecording } from '@/lib/tavus';
import { Video, VideoOff } from 'lucide-react';

interface TavusRecorderProps {
  templateId: string;
  onRecordingComplete?: () => void;
}

export function TavusRecorder({ templateId, onRecordingComplete }: TavusRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      setIsRecording(true);
      await recordTemplateVideo(templateId);
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
      setIsRecording(false);
      onRecordingComplete?.();
    } catch (err: any) {
      setError(err.message || 'Failed to stop recording');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Video</CardTitle>
        <CardDescription>
          Record your video for personalized responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="text-sm text-red-500 mb-4">
              {error}
            </div>
          )}
          
          <div className="flex justify-center">
            <Button
              onClick={isRecording ? handleStopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className="w-full max-w-xs"
            >
              {isRecording ? (
                <>
                  <VideoOff className="mr-2 h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
          </div>

          {isRecording && (
            <div className="text-center text-sm text-muted-foreground">
              Recording in progress...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}