// components/tutor/TutorVideoResponse.tsx - Complete updated file
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Play, Clock, CheckCircle, Loader2, MessageCircle, Video, 
  HelpCircle, ArrowRight, Mic, Camera, AlertCircle, RefreshCw, ExternalLink 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { LiveFollowUpDialog } from "./LiveFollowUpDialog";

interface VideoResponse {
  id: string;
  coach_id: string;
  student_id: string;
  status: string;
  url: string | null;
  stream_url?: string | null;
  download_url?: string | null;
  created_at: string;
  question: string;
  topic?: string;
  script_used?: string;
  coach: {
    name: string;
    avatar_url: string | null;
  };
}

interface TutorVideoResponseProps {
  videoResponses: VideoResponse[];
  onStartLiveSession?: (context: any) => void;
}

export function TutorVideoResponse({ videoResponses, onStartLiveSession }: TutorVideoResponseProps) {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [loadingVideos, setLoadingVideos] = useState<Set<string>>(new Set());
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [showLiveDialog, setShowLiveDialog] = useState<VideoResponse | null>(null);
  const { toast } = useToast();

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
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const isTavusHostedUrl = (url: string | null): boolean => {
    if (!url) return false;
    return url.includes('tavus.video/') && !url.includes('.mp4') && !url.includes('.webm');
  };

  const getVideoUrl = (response: VideoResponse): string | null => {
    if (response.stream_url) return response.stream_url;
    if (response.download_url) return response.download_url;
    if (response.url && !isTavusHostedUrl(response.url)) return response.url;
    return null;
  };

  const handleVideoStart = (videoId: string) => {
    setLoadingVideos(prev => new Set([...prev, videoId]));
    setVideoErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(videoId);
      return newSet;
    });
  };

  const handleVideoCanPlay = (videoId: string) => {
    setLoadingVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(videoId);
      return newSet;
    });
  };

  const handleVideoEnd = (videoId: string) => {
    setWatchedVideos(prev => new Set([...prev, videoId]));
    setPlayingVideo(null);
  };

  const handleTavusVideoError = (response: VideoResponse) => {
    console.error(`Failed to load Tavus video: ${response.url}`);
    setVideoErrors(prev => new Set([...prev, response.id]));
    setLoadingVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(response.id);
      return newSet;
    });
    setPlayingVideo(null);
    
    toast({
      title: "Video Error",
      description: "Unable to load the AI-generated video. Please try refreshing or contact support.",
      variant: "destructive"
    });
  };

  const handleRetryVideo = (videoId: string) => {
    setVideoErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(videoId);
      return newSet;
    });
    setPlayingVideo(videoId);
  };

  const handleIframeLoad = (videoId: string) => {
    setWatchedVideos(prev => new Set([...prev, videoId]));
    setLoadingVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(videoId);
      return newSet;
    });
  };

  const handleAskFollowUp = (videoResponse: VideoResponse) => {
    setShowLiveDialog(videoResponse);
  };

  const startLiveSessionWithContext = async (videoResponse: VideoResponse) => {
    if (!onStartLiveSession) return;

    const context = {
      previousQuestion: videoResponse.question,
      previousTopic: videoResponse.topic,
      videoWatched: true,
      coachId: 'itrader',
      sessionType: 'follow_up',
      context: `The student just watched a video response from iTrader about: "${videoResponse.question}". They may need clarification or have follow-up questions about this topic.`
    };

    onStartLiveSession(context);
    setShowLiveDialog(null);
    
    toast({
      title: "Starting Live Session",
      description: "Connecting you with iTrader for follow-up questions...",
    });
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
                Ask iTrader a question in the chat or use the question form to get your first personalized video response.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {videoResponses.map((response) => {
          const isWatched = watchedVideos.has(response.id);
          const isLoading = loadingVideos.has(response.id);
          const hasError = videoErrors.has(response.id);
          const canStartLiveSession = response.status === 'ready' && isWatched;
          const videoUrl = getVideoUrl(response);
          const shouldUseIframe = response.url && isTavusHostedUrl(response.url);

          return (
            <Card key={response.id} className={`transition-all ${isWatched ? 'border-green-200 bg-green-50/30' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=itrader&backgroundColor=1e40af&accessories=prescription02&accessoriesColor=262e33&clothing=blazerShirt&clothingColor=3c4858&eyes=default&eyebrows=default&facialHair=none&hair=short01&hairColor=2c1b18&mouth=default&skin=f2d3b1"
                      />
                      <AvatarFallback>IT</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-base">iTrader</CardTitle>
                      <CardDescription className="line-clamp-2">
                        "{response.question || 'Trading Question'}"
                      </CardDescription>
                      {response.topic && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {response.topic}
                        </Badge>
                      )}
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
              
              <CardContent className="space-y-3">
                {response.status === 'ready' && response.url ? (
                  <div className="space-y-3">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                      {hasError ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center space-y-3">
                            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                            <div>
                              <p className="text-sm font-medium text-red-700">
                                Failed to load video
                              </p>
                              <p className="text-xs text-red-600">
                                There was an issue loading your iTrader video
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRetryVideo(response.id)}
                              className="gap-2"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Retry
                            </Button>
                          </div>
                        </div>
                      ) : playingVideo === response.id ? (
                        <>
                          {isLoading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                              <div className="text-center text-white">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                <p className="text-sm">Loading video...</p>
                              </div>
                            </div>
                          )}
                          
                          {shouldUseIframe && response.url ? (
                            <iframe
                              className="w-full h-full"
                              src={response.url}
                              frameBorder="0"
                              allow="camera; microphone; autoplay; encrypted-media; fullscreen"
                              onLoad={() => handleIframeLoad(response.id)}
                              onError={() => handleTavusVideoError(response)}
                            />
                          ) : videoUrl ? (
                            <video
                              className="w-full h-full object-cover"
                              controls
                              autoPlay
                              preload="metadata"
                              crossOrigin="anonymous"
                              onLoadStart={() => handleVideoStart(response.id)}
                              onCanPlay={() => handleVideoCanPlay(response.id)}
                              onEnded={() => handleVideoEnd(response.id)}
                              onPause={() => setPlayingVideo(null)}
                              onError={() => handleTavusVideoError(response)}
                            >
                              <source src={videoUrl} type="video/mp4" />
                              <source src={videoUrl} type="video/webm" />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center space-y-3">
                                <AlertCircle className="h-8 w-8 mx-auto text-yellow-500" />
                                <div>
                                  <p className="text-sm font-medium text-yellow-700">
                                    No video URL available
                                  </p>
                                  <p className="text-xs text-yellow-600">
                                    Please check the video configuration
                                  </p>
                                </div>
                                {response.url && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(response.url!, '_blank')}
                                    className="gap-2"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Open in New Tab
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors group"
                          onClick={() => setPlayingVideo(response.id)}
                        >
                          <div className="text-center">
                            <Button size="lg" className="gap-2 group-hover:scale-105 transition-transform">
                              <Play className="h-5 w-5" />
                              {isWatched ? 'Watch Again' : 'Play iTrader Response'}
                            </Button>
                            {isWatched && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                Watched
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {isWatched && !hasError && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Need more help from iTrader?</span>
                        </div>
                        <p className="text-xs text-blue-700 mb-3">
                          If you need clarification or have follow-up questions about this topic, 
                          you can start a live conversation with iTrader.
                        </p>
                        <Button 
                          size="sm" 
                          className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleAskFollowUp(response)}
                        >
                          <MessageCircle className="h-3 w-3" />
                          Ask iTrader Follow-up Questions Live
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : response.status === 'processing' ? (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          iTrader is generating your personalized video...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Your AI tutor is creating a custom response just for you (2-3 minutes)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : response.status === 'failed' ? (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-700">
                          Video generation failed
                        </p>
                        <p className="text-xs text-red-600">
                          There was an issue creating your video. Please try asking iTrader your question again.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        iTrader video response will be available soon
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showLiveDialog && (
        <LiveFollowUpDialog
          videoResponse={showLiveDialog}
          onStartSession={() => startLiveSessionWithContext(showLiveDialog)}
          onClose={() => setShowLiveDialog(null)}
        />
      )}
    </>
  );
}