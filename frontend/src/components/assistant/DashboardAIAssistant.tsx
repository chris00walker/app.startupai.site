/**
 * @story US-CP09
 */
/**
 * DashboardAIAssistant - Persistent AI Assistant for Ongoing Strategic Support
 *
 * This component provides a conversational AI interface in the founder/consultant
 * dashboards that can:
 * - Discuss CrewAI analysis reports
 * - Answer questions about project status
 * - Dispatch new CrewAI workflows via tool calling
 * - Maintain conversation context across sessions
 *
 * Based on proven patterns from OnboardingWizardV2 and ConversationInterfaceV2.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, X, MessageSquare, Brain, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface DashboardAIAssistantProps {
  userId: string;
  userRole: 'founder' | 'consultant';
  projectId?: string;
  clientId?: string; // For consultants managing specific client
  className?: string;
}

// ============================================================================
// DashboardAIAssistant Component
// ============================================================================

export function DashboardAIAssistant({
  userId,
  userRole,
  projectId,
  clientId,
  className = '',
}: DashboardAIAssistantProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && !isMinimized) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isMinimized]);

  // Focus textarea when opening
  useEffect(() => {
    if (isOpen && !isMinimized && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Load conversation history on mount
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadConversationHistory();
    }
  }, [isOpen]);

  // Load conversation history from API
  const loadConversationHistory = async () => {
    try {
      const params = new URLSearchParams({
        userId,
        userRole,
        ...(projectId && { projectId }),
        ...(clientId && { clientId }),
      });

      const response = await fetch(`/api/assistant/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // Add welcome message if no history
          setMessages([
            {
              role: 'assistant',
              content: getWelcomeMessage(),
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('[DashboardAIAssistant] Failed to load history:', error);
      // Add welcome message on error
      setMessages([
        {
          role: 'assistant',
          content: getWelcomeMessage(),
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  // Get context-aware welcome message
  const getWelcomeMessage = () => {
    if (userRole === 'founder') {
      return `Hi! I'm your AI Strategic Assistant. I'm here to help you:\n\n• Discuss your CrewAI analysis reports\n• Answer questions about your validation progress\n• Run new strategic analysis when needed\n• Provide guidance on next steps\n\nWhat would you like to explore today?`;
    } else {
      return `Hi! I'm your AI Practice Assistant. I'm here to help you:\n\n• Analyze client projects and opportunities\n• Generate strategic recommendations\n• Discuss findings and next steps\n• Manage your consulting workflow\n\nWhat can I help you with?`;
    }
  };

  // Handle form submit - stream AI response
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId,
          userRole,
          projectId,
          clientId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response (Vercel AI SDK UI stream format)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events (lines starting with "data: ")
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6); // Remove "data: " prefix

            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              // Extract text from text-delta events
              if (event.type === 'text-delta' && event.textDelta) {
                accumulatedText += event.textDelta;

                // Update AI message in real-time
                setMessages((prev) => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage?.role === 'assistant') {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMessage, content: accumulatedText },
                    ];
                  } else {
                    return [
                      ...prev,
                      {
                        role: 'assistant',
                        content: accumulatedText,
                        timestamp: new Date().toISOString(),
                      },
                    ];
                  }
                });
              }

              // Handle tool calls - show status message
              if (event.type === 'tool-input-start') {
                const toolMessage = `🔧 Checking ${event.toolName}...`;
                setMessages((prev) => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage?.role === 'assistant') {
                    return prev;
                  }
                  return [
                    ...prev,
                    {
                      role: 'assistant',
                      content: toolMessage,
                      timestamp: new Date().toISOString(),
                    },
                  ];
                });
              }
            } catch {
              // Ignore parse errors for malformed JSON
            }
          }
        }

        // If no text was accumulated but we had tool calls, the model may not have responded
        if (!accumulatedText) {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant' && lastMessage.content.startsWith('🔧')) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: "I checked the project status but couldn't find the project. Could you make sure you have an active project selected?" },
              ];
            }
            return prev;
          });
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[DashboardAIAssistant] Chat error:', error);
        toast.error(`Failed to send message: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  }, []);

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Toggle open/close
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnreadNotification(false);
    }
  };

  // Toggle minimize/maximize
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) {
    // Floating trigger button
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={toggleOpen}
          size="lg"
          className="rounded-full shadow-lg h-14 w-14 p-0 relative"
        >
          <Brain className="h-6 w-6" />
          {hasUnreadNotification && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white" />
          )}
        </Button>
      </div>
    );
  }

  // Full chat interface
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className="w-[400px] h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarFallback className="bg-blue-500 text-white">
                <Brain className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">AI Strategic Assistant</h3>
              <p className="text-xs text-blue-100">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMinimize}
              className="h-7 w-7 p-0 text-white hover:bg-white/20"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleOpen}
              className="h-7 w-7 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Conversation Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          <Brain className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`flex flex-col gap-1 max-w-[80%] ${
                        message.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground px-1">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-gray-300">
                          U
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        <Brain className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 bg-gray-50">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your project..."
                  className="min-h-[44px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Powered by AI • Press Enter to send
              </p>
            </div>
          </>
        )}

        {isMinimized && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Chat minimized. Click to expand.
          </div>
        )}
      </Card>
    </div>
  );
}
