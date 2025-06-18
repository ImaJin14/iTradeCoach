"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, AlertCircle, Sparkles, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  model?: string;
}

interface TutorChatProps {
  currentUser: any;
}

export function TutorChat({ currentUser }: TutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Show welcome message
    setMessages([{
      id: 'welcome',
      content: `Hi there! 👋 I'm your AI trading tutor, powered by ChatGPT. I'm here to help you master trading and investing!

I can help you with:
- **Technical Analysis** - Chart patterns, indicators, and price action
- **Risk Management** - Position sizing, stop losses, and portfolio protection  
- **Trading Psychology** - Mindset, discipline, and emotional control
- **Market Analysis** - Understanding trends, news, and market structure
- **Trading Strategies** - Day trading, swing trading, and long-term investing
- **Options & Derivatives** - Strategies and risk assessment

What would you like to learn about today? Feel free to ask specific questions or request explanations on any trading topic!`,
      sender: 'ai',
      timestamp: new Date().toISOString()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    setNewMessage("");
    setLoading(true);
    setIsTyping(true);

    // Auto-resize textarea back to original size
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          chatHistory: messages // Send recent messages for context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: `ai-${Date.now()}`,
          content: data.response,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          model: data.model
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 800 + Math.random() * 1000); // Random delay between 0.8-1.8 seconds

    } catch (error: any) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: `I apologize, but I'm having trouble responding right now. ${error.message.includes('quota') || error.message.includes('rate') ? 'The AI service is temporarily unavailable.' : 'Please try again in a moment.'} 

If you need immediate help, consider asking for a personalized video response in the Video tab, or try rephrasing your question.`,
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
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple formatting for better readability
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/•/g, '•') // Ensure bullet points display correctly
      .split('\n').map((line, index) => (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
          {index < content.split('\n').length - 1 && <br />}
        </span>
      ));
  };

  const quickQuestions = [
    "What's the difference between support and resistance?",
    "How do I manage risk in trading?",
    "What are the best indicators for beginners?",
    "Explain candlestick patterns",
    "How to develop a trading plan?"
  ];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Trading Tutor
          <Badge variant="outline" className="ml-auto flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by ChatGPT
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                {message.sender === 'user' ? (
                  <>
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id}`} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div
                className={`flex-1 max-w-[85%] p-3 rounded-lg text-sm ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {message.sender === 'ai' ? formatMessageContent(message.content) : message.content}
                </div>
                {message.model && (
                  <div className="text-xs opacity-70 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
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
                  <span className="text-xs text-muted-foreground ml-2">AI tutor is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && ( // Only show on welcome message
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">Quick questions to get started:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setNewMessage(question)}
                  disabled={loading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Ask about trading strategies, technical analysis, risk management, market psychology..."
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
            className="self-end"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Helper text */}
        <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
          <AlertCircle className="h-3 w-3" />
          <span>For complex visual topics, consider requesting a personalized video response</span>
        </div>
      </CardContent>
    </Card>
  );
}