/**
 * ConversationInterface V2 - Streaming Chat with Vercel AI SDK
 *
 * Updated to work with useChat hook for streaming AI responses.
 * Displays messages with real-time streaming, handles tool calls, and
 * provides a clean chat interface.
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface OnboardingSession {
  sessionId: string;
  currentStage: number;
  totalStages: number;
  overallProgress: number;
  stageProgress: number;
  agentPersonality: any;
  isActive: boolean;
}

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface ConversationInterfaceProps {
  session: OnboardingSession;
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onComplete: () => Promise<void>;
}

// ============================================================================
// ConversationInterface Component
// ============================================================================

export function ConversationInterface({
  session,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onComplete,
}: ConversationInterfaceProps) {

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

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
  const formatTime = useCallback((timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Get stage name
  const getStageName = useCallback((stage: number) => {
    const stageNames = [
      'Welcome', 'Customer Discovery', 'Problem Definition',
      'Solution Validation', 'Competitive Analysis',
      'Resources & Constraints', 'Goals & Next Steps'
    ];
    return stageNames[stage - 1] || `Stage ${stage}`;
  }, []);

  // Extract text content from message
  const getMessageContent = useCallback((message: Message) => {
    return message.content;
  }, []);

  // Check if conversation is complete
  const isConversationComplete = session.currentStage >= session.totalStages && session.overallProgress >= 90;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {getStageName(session.currentStage)}
            </h1>
            <p className="text-sm text-muted-foreground">
              Stage {session.currentStage} of {session.totalStages} •
              {session.agentPersonality?.name || 'AI Consultant'} is here to help
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {Math.round(session.overallProgress)}% Complete
            </Badge>
            {isConversationComplete && (
              <Button onClick={onComplete} size="sm">
                Complete Onboarding
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* AI Avatar */}
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {session.agentPersonality?.name?.charAt(0) || 'AI'}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Message Content */}
              <div
                className={`
                  max-w-[80%] rounded-lg px-4 py-3 text-sm
                  ${message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                  }
                `}
                role={message.role === 'system' ? 'status' : undefined}
                aria-label={
                  message.role === 'assistant'
                    ? `AI response: ${getMessageContent(message)}`
                    : message.role === 'user'
                    ? `Your message: ${getMessageContent(message)}`
                    : `System message: ${getMessageContent(message)}`
                }
              >
                <p className="whitespace-pre-wrap">{getMessageContent(message)}</p>

                {/* Message metadata */}
                <div className={`
                  flex items-center justify-between mt-2 text-xs
                  ${message.role === 'user'
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                  }
                `}>
                  <span>{formatTime(new Date(message.timestamp))}</span>
                </div>
              </div>

              {/* User Avatar */}
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    You
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Streaming Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {session.agentPersonality?.name?.charAt(0) || 'AI'}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {session.agentPersonality?.name || 'AI'} is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            {/* Message Input */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your response here... (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] max-h-[120px] resize-none flex-1"
              disabled={isLoading}
              aria-label="Type your message"
            />

            {/* Send Button */}
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="default"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Input Help Text */}
          <div className="mt-2 text-xs text-muted-foreground">
            <p>
              Be specific and detailed in your responses to get the best strategic guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
