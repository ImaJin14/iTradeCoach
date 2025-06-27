// components/CallWindow.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Minimize2, 
  Maximize2, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  Settings,
  Monitor,
  Volume2,
  VolumeX,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CallWindowProps {
  roomUrl: string;
  sessionTitle: string;
  sessionType: 'individual' | 'live';
  participantCount?: number;
  onClose: () => void;
  onSessionEnd?: () => void;
}

export function CallWindow({ 
  roomUrl, 
  sessionTitle, 
  sessionType,
  participantCount = 1,
  onClose, 
  onSessionEnd 
}: CallWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'connecting' | 'connected' | 'ended' | 'error'>('connecting');
  const [duration, setDuration] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    // Start duration timer when connected
    if (sessionStatus === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [sessionStatus]);

  useEffect(() => {
    // Listen for iframe load events
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setIsLoading(false);
        setIsConnected(true);
        setSessionStatus('connected');
        toast({
          title: "Connected!",
          description: `You're now in the ${sessionType === 'individual' ? '1-on-1' : 'live'} session.`,
        });
      };

      const handleError = () => {
        setIsLoading(false);
        setSessionStatus('error');
        toast({
          title: "Connection Error",
          description: "Failed to connect to the session.",
          variant: "destructive",
        });
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
      };
    }
  }, [toast, sessionType]);

  const handleEndSession = async () => {
    try {
      setSessionStatus('ended');
      
      // Notify parent component
      if (onSessionEnd) {
        onSessionEnd();
      }

      toast({
        title: "Session Ended",
        description: `Your ${sessionType === 'individual' ? '1-on-1' : 'live'} session lasted ${formatDuration(duration)}.`,
      });

      onClose();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleExpandSession = () => {
    setIsMinimized(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeDisplay = () => {
    return sessionType === 'individual' ? '1-on-1 Session' : 'Live Session';
  };

  const getSessionIcon = () => {
    return sessionType === 'individual' ? <Video className="h-4 w-4" /> : <Users className="h-4 w-4" />;
  };

  // Minimized view - clickable card in bottom right
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card 
          className="w-80 shadow-lg border-primary cursor-pointer hover:shadow-xl transition-shadow"
          onClick={handleExpandSession}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <CardTitle className="text-sm flex items-center gap-1">
                  {getSessionIcon()}
                  {getSessionTypeDisplay()}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(duration)}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(false);
                  }}
                  title="Expand session"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEndSession();
                  }}
                  title="End session"
                >
                  <Phone className="h-3 w-3 rotate-[135deg]" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent 
            className="pb-3 cursor-pointer"
            onClick={handleExpandSession}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  Click to expand your session
                </p>
                <p className="text-xs font-medium text-primary mt-1 truncate">
                  {sessionTitle}
                </p>
                {sessionType === 'live' && participantCount && (
                  <p className="text-xs text-muted-foreground">
                    {participantCount} participants
                  </p>
                )}
              </div>
              <Maximize2 className="h-4 w-4 text-muted-foreground ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full screen view
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="fixed inset-4 md:inset-8">
        <Card className="h-full flex flex-col shadow-2xl">
          <CardHeader className="flex-shrink-0 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${
                  sessionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  sessionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  sessionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getSessionIcon()}
                    {sessionTitle}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {sessionStatus === 'connecting' && 'Connecting to session...'}
                    {sessionStatus === 'connected' && `Connected • ${formatDuration(duration)}`}
                    {sessionStatus === 'error' && 'Connection failed'}
                    {sessionStatus === 'ended' && 'Session ended'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {sessionType === 'live' && participantCount && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {participantCount}
                  </Badge>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(true)}
                  disabled={sessionStatus !== 'connected'}
                  title="Minimize session"
                  className="hover:bg-muted"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Close session"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <div>
                    <p className="font-medium">Connecting to session...</p>
                    <p className="text-sm text-muted-foreground">
                      Joining your {sessionType === 'individual' ? '1-on-1' : 'live'} session
                    </p>
                  </div>
                </div>
              </div>
            )}

            {sessionStatus === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Connection Failed</p>
                    <p className="text-sm text-muted-foreground">
                      Unable to connect to the session
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={onClose} variant="outline">
                      Close Session
                    </Button>
                    <Button onClick={() => window.location.reload()} variant="default">
                      Retry Connection
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={roomUrl}
              className="w-full h-full border-0"
              allow="camera; microphone; autoplay; encrypted-media; fullscreen; display-capture"
              style={{ minHeight: '400px' }}
            />
          </CardContent>

          {/* Control Bar */}
          <div className="flex-shrink-0 border-t bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {sessionStatus === 'connected' && `Session: ${formatDuration(duration)}`}
                  {sessionStatus === 'connecting' && 'Connecting...'}
                  {sessionTitle && (
                    <span className="ml-2 text-primary font-medium">
                      • {sessionTitle}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  disabled
                  title="Controls available in video interface"
                >
                  <Settings className="h-3 w-3" />
                  Controls in video
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={handleEndSession}
                >
                  <Phone className="h-3 w-3 rotate-[135deg]" />
                  End Session
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}