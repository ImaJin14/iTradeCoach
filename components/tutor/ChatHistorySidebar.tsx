// components/tutor/ChatHistorySidebar.tsx - Chat history sidebar
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Trash2, 
  Calendar,
  Clock,
  Plus,
  Search,
  MoreVertical
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
}

interface ChatHistorySidebarProps {
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  isCollapsed?: boolean;
}

export function ChatHistorySidebar({ 
  currentConversationId, 
  onSelectConversation, 
  onNewConversation,
  isCollapsed = false 
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/tutor/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/tutor/chat/conversations/${conversationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        toast({
          title: "Conversation Deleted",
          description: "The conversation has been removed from your history.",
        });
        
        // If we deleted the current conversation, create a new one
        if (conversationId === currentConversationId) {
          onNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupConversationsByDate = (conversations: ChatConversation[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
      today: [] as ChatConversation[],
      yesterday: [] as ChatConversation[],
      thisWeek: [] as ChatConversation[],
      older: [] as ChatConversation[]
    };

    conversations.forEach(conv => {
      const convDate = new Date(conv.updated_at);
      if (convDate.toDateString() === today.toDateString()) {
        groups.today.push(conv);
      } else if (convDate.toDateString() === yesterday.toDateString()) {
        groups.yesterday.push(conv);
      } else if (convDate >= lastWeek) {
        groups.thisWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const groupedConversations = groupConversationsByDate(filteredConversations);

  const ConversationItem = ({ conversation }: { conversation: ChatConversation }) => (
    <div
      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
        currentConversationId === conversation.id ? 'bg-primary/10 border border-primary/20' : ''
      }`}
      onClick={() => onSelectConversation(conversation.id)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h4 className="text-sm font-medium truncate">{conversation.title}</h4>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
          </span>
          {conversation.message_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {conversation.message_count} msgs
            </Badge>
          )}
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => deleteConversation(conversation.id, e)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const ConversationGroup = ({ title, conversations }: { title: string; conversations: ChatConversation[] }) => {
    if (conversations.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">
          {title}
        </h3>
        <div className="space-y-1">
          {conversations.map(conversation => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
        </div>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r bg-card">
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewConversation}
            className="w-full h-10"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full border-0 border-r rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Chat History
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onNewConversation}
            className="gap-2"
          >
            <Plus className="h-3 w-3" />
            New
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[calc(100vh-200px)]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchTerm ? (
                <>
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No conversations found</p>
                  <p className="text-xs">Try a different search term</p>
                </>
              ) : (
                <>
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-xs">Start chatting with iTrader to see your history here</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-2">
              <ConversationGroup title="Today" conversations={groupedConversations.today} />
              <ConversationGroup title="Yesterday" conversations={groupedConversations.yesterday} />
              <ConversationGroup title="This Week" conversations={groupedConversations.thisWeek} />
              <ConversationGroup title="Older" conversations={groupedConversations.older} />
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}