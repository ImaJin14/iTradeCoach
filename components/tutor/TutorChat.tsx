// components/tutor/TutorChat.tsx - Fixed conversation creation with better error handling
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Video, Sparkles, Clock, Lightbulb, TrendingUp, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  model?: string;
  topic?: string;
  suggested_video?: boolean;
}

interface TutorChatProps {
  currentUser: any;
  onRequestVideo?: (question: string, topic?: string) => void;
  conversationId?: string;
  onConversationCreated?: (conversationId: string, title: string) => void;
  initialMessages?: ChatMessage[];
}

export function TutorChat({ 
  currentUser, 
  onRequestVideo, 
  conversationId,
  onConversationCreated,
  initialMessages = []
}: TutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
      setMessageCount(initialMessages.length);
    } else {
      // Reset to welcome message for new conversations
      setMessages([{
        id: 'welcome',
        content: `👋 **Welcome! I'm iTrader, your personal AI trading tutor.**

I'm here to help you master trading and investing with personalized guidance. As your dedicated AI mentor, I can assist you with:

🔍 **Technical Analysis** - Chart patterns, indicators, and market timing
📊 **Risk Management** - Position sizing, stop losses, and portfolio protection  
🧠 **Trading Psychology** - Mindset, discipline, and emotional control
📈 **Market Analysis** - Trends, news impact, and market structure
💡 **Trading Strategies** - Day trading, swing trading, and investing approaches
📋 **Options & Derivatives** - Strategies and risk assessment

**What makes me unique:** I'm your consistent AI tutor who remembers our conversations and can create personalized video responses just for you!

What would you like to learn about today?`,
        sender: 'ai',
        timestamp: new Date().toISOString()
      }]);
      setMessageCount(0);
    }
  }, [initialMessages]);

  useEffect(() => {
    setCurrentConversationId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const saveMessageToDatabase = async (conversationId: string, content: string, sender: 'user' | 'ai', topic?: string, model?: string) => {
    try {
      const response = await fetch('/api/tutor/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content,
          sender,
          topic,
          model
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error saving message:', error);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const createNewConversation = async (firstMessage: string): Promise<string> => {
    try {
      // Generate title from first message (first 50 chars)
      const title = firstMessage.length > 50 
        ? firstMessage.substring(0, 47) + "..." 
        : firstMessage;

      console.log('Creating new conversation with title:', title);

      const response = await fetch('/api/tutor/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          firstMessage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create conversation');
      }

      const data = await response.json();
      const newConversationId = data.conversation.id;
      
      console.log('Conversation created successfully:', newConversationId);
      
      if (onConversationCreated) {
        onConversationCreated(newConversationId, title);
      }
      
      return newConversationId;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      
      // Show user-friendly error message
      toast({
        title: "Error Creating Conversation",
        description: "Unable to save your conversation. You can still chat, but messages won't be saved.",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = newMessage.trim();
    setNewMessage("");
    setLoading(true);
    setIsTyping(true);
    setMessageCount(prev => prev + 1);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Create conversation if this is the first message
      let activeConversationId = currentConversationId;
      if (!activeConversationId && messageCount === 0) {
        try {
          activeConversationId = await createNewConversation(currentQuestion);
          setCurrentConversationId(activeConversationId);
        } catch (conversationError) {
          // Continue without saving conversation if creation fails
          console.warn('Continuing without saving conversation');
        }
      } else if (activeConversationId) {
        // Save user message to existing conversation
        await saveMessageToDatabase(activeConversationId, userMessage.content, 'user');
      }

      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          chatHistory: messages.slice(-6),
          messageCount: messageCount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      
      setTimeout(async () => {
        const aiResponse: ChatMessage = {
          id: `ai-${Date.now()}`,
          content: data.response,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          model: data.model,
          topic: data.suggestedTopic,
          suggested_video: data.suggestVideo
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);

        // Save AI response to database if we have a conversation
        if (activeConversationId) {
          await saveMessageToDatabase(
            activeConversationId, 
            aiResponse.content, 
            'ai', 
            data.suggestedTopic, 
            data.model
          );
        }

        if (data.suggestVideo && onRequestVideo) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: `suggestion-${Date.now()}`,
              content: `💡 **Video Response Available**\n\nThis topic would be great for a personalized video explanation! I can create a detailed video response that covers visual examples and step-by-step guidance.\n\nWould you like me to create a video response for: "${currentQuestion}"?`,
              sender: 'ai',
              timestamp: new Date().toISOString(),
              suggested_video: true
            }]);
          }, 1000);
        }
      }, 800 + Math.random() * 1200);

    } catch (error: any) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: `I apologize, but I'm having trouble responding right now. ${getErrorMessage(error.message)}

**What you can do:**
- Try rephrasing your question
- Request a personalized video response instead
- Check your connection and try again

I'm here to help you succeed in trading, so please don't hesitate to try again! 🚀`,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Connection Issue",
        description: getErrorToastMessage(error.message),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorMessage: string): string => {
    if (errorMessage.includes('quota')) {
      return 'The AI service is temporarily at capacity.';
    }
    if (errorMessage.includes('rate')) {
      return 'Too many requests - please wait a moment.';
    }
    return 'There was a connection issue.';
  };

  const getErrorToastMessage = (errorMessage: string): string => {
    if (errorMessage.includes('quota')) {
      return 'AI service quota exceeded. Please try again later.';
    }
    if (errorMessage.includes('rate')) {
      return 'Too many requests. Please wait a moment.';
    }
    return 'Failed to send message. Please try again.';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const formatMessageContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
      .split('\n').map((line, index) => (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
          {index < content.split('\n').length - 1 && <br />}
        </span>
      ));
  };

  const suggestedQuestions = [
    { text: "How do I manage risk in trading?", topic: "Risk Management", icon: "🛡️" },
    { text: "What are support and resistance levels?", topic: "Technical Analysis", icon: "📊" },
    { text: "How do I control emotions while trading?", topic: "Psychology", icon: "🧠" },
    { text: "What's the best strategy for beginners?", topic: "Strategy", icon: "🎯" },
    { text: "How do options work?", topic: "Options", icon: "📋" }
  ];

  const requestVideoResponse = (question: string, topic?: string) => {
    if (onRequestVideo) {
      onRequestVideo(question, topic);
      toast({
        title: "Video Request Sent",
        description: "Creating your personalized video response...",
      });
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          iTrader - Your AI Trading Tutor
          <Badge variant="outline" className="ml-auto flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            GPT-4 Powered
          </Badge>
        </CardTitle>
        {currentConversationId && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span>Conversation saved automatically</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4 min-h-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((message) => (
            <div key={message.id}>
              <div className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {message.sender === 'user' ? (
                    <>
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id}`} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=itrader&backgroundColor=1e40af&accessories=prescription02&accessoriesColor=262e33&clothing=blazerShirt&clothingColor=3c4858&eyes=default&eyebrows=default&facialHair=none&hair=short01&hairColor=2c1b18&mouth=default&skin=f2d3b1" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                
                <div className={`flex-1 max-w-[85%] p-3 rounded-lg text-sm break-words ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}>
                  <div className="whitespace-pre-wrap">
                    {message.sender === 'ai' ? formatMessageContent(message.content) : message.content}
                  </div>
                  
                  {message.topic && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {message.topic}
                    </Badge>
                  )}
                  
                  {message.suggested_video && onRequestVideo && (
                    <div className="mt-3 pt-2 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          const lastUserMessage = messages.filter(m => m.sender === 'user').pop();
                          if (lastUserMessage) {
                            requestVideoResponse(lastUserMessage.content, message.topic);
                          }
                        }}
                      >
                        <Video className="h-3 w-3" />
                        Create Video Response
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=itrader&backgroundColor=1e40af&accessories=prescription02&accessoriesColor=262e33&clothing=blazerShirt&clothingColor=3c4858&eyes=default&eyebrows=default&facialHair=none&hair=short01&hairColor=2c1b18&mouth=default&skin=f2d3b1" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex gap-1 items-center">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions for New Conversations */}
        {(messages.length === 1 || messageCount === 0) && (
          <div className="flex-shrink-0">
            <Separator />
            <div className="space-y-3 py-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Popular Trading Questions</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto p-3"
                    onClick={() => setNewMessage(question.text)}
                    disabled={loading}
                  >
                    <span className="mr-2">{question.icon}</span>
                    <div>
                      <div className="font-medium">{question.text}</div>
                      <div className="text-xs text-muted-foreground">{question.topic}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2 flex-shrink-0">
          <Textarea
            ref={textareaRef}
            placeholder="Ask about trading strategies, market analysis, risk management..."
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            className="resize-none min-h-[60px] max-h-[120px]"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading}
            size="icon"
            className="self-end flex-shrink-0"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2 flex-shrink-0">
          <Video className="h-3 w-3" />
          <span>For visual topics, ask for a personalized video response</span>
        </div>
      </CardContent>
    </Card>
  );
}