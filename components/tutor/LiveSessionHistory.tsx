// components/tutor/LiveSessionHistory.tsx - View past live sessions
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, Calendar, Video, User, Bot } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface LiveSession {
  id: string;
  coach_id: string;
  topic: string;
  session_type: string;
  status: string;
  duration_minutes: number;
  started_at: string;
  ended_at: string;
  context_metadata: any;
}

interface LiveSessionHistoryProps {
  onStartFollowUp?: (context: any) => void;
}

export function LiveSessionHistory({ onStartFollowUp }: LiveSessionHistoryProps) {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/tutor/live-sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        console.error('Failed to fetch live sessions');
      }
    } catch (error) {
      console.error('Error fetching live sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleFollowUpSession = (session: LiveSession) => {
    if (!onStartFollowUp) return;

    const context = {
      topic: session.topic,
      sessionType: 'follow_up',
      previousSession: session.id,
      context: `FOLLOW-UP LIVE TUTORING SESSION

PREVIOUS SESSION: The student had a ${session.session_type} session about "${session.topic}" that lasted ${session.duration_minutes || 0} minutes.

STUDENT REQUEST: They want to continue learning about this topic or ask follow-up questions.

YOUR INSTRUCTIONS:
1. IMMEDIATELY acknowledge their previous session when you start
2. Ask what specific aspects they'd like to explore further
3. Build on what was likely discussed in the previous session
4. Be enthusiastic about continuing their learning journey
5. Keep the conversation interactive and engaging

CONVERSATION STARTER: "Hi! Great to see you back! I see you previously had a session about ${session.topic}. What aspects would you like to dive deeper into today? Any specific questions that came up since our last discussion?"

Remember: BE PROACTIVE, START IMMEDIATELY, BUILD ON PREVIOUS LEARNING!`,
      coachId: 'itrader'
    };

    onStartFollowUp(context);
    toast({
      title: "Starting Follow-Up Session",
      description: `Continuing your learning about ${session.topic}`,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading your session history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Live Session History
        </CardTitle>
        {sessions.length > 0 && (
          <p className="text-sm text-muted-foreground">
            You've completed {sessions.filter(s => s.status === 'completed').length} live sessions with iTrader
          </p>
        )}
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No live sessions yet</h3>
            <p className="text-sm">Start your first live session with iTrader to see your history here!</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm">{session.topic}</h4>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="capitalize">{session.session_type} session</span>
                        {session.coach_id === 'itrader' && (
                          <>
                            <span>•</span>
                            <span>with iTrader</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(session.started_at), 'MMM d, HH:mm')}</span>
                    </div>
                    {session.duration_minutes > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{session.duration_minutes} min</span>
                      </div>
                    )}
                  </div>

                  {session.status === 'completed' && onStartFollowUp && (
                    <div className="pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2 text-xs"
                        onClick={() => handleFollowUpSession(session)}
                      >
                        <Video className="h-3 w-3" />
                        Continue This Topic
                      </Button>
                    </div>
                  )}

                  {session.status === 'active' && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-blue-600 font-medium">
                        🔴 Session in progress
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}