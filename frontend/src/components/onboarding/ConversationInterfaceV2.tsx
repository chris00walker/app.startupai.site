/**
 * ConversationInterface V2 - Clean Professional Design
 *
 * Redesigned with Linear/Notion-inspired aesthetics:
 * - Minimal, clean message styling
 * - Subtle animations
 * - Refined typography and spacing
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onComplete: () => Promise<void>;
}

// ============================================================================
// ConversationInterface Component - Clean Professional Design
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
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
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
      minute: '2-digit',
    });
  }, []);

  // Get stage name
  const getStageName = useCallback((stage: number) => {
    const stageNames = [
      'Welcome',
      'Customer Discovery',
      'Problem Definition',
      'Solution Validation',
      'Competitive Analysis',
      'Resources & Constraints',
      'Goals & Next Steps',
    ];
    return stageNames[stage - 1] || `Stage ${stage}`;
  }, []);

  // Check if conversation is complete
  const isConversationComplete =
    session.currentStage >= session.totalStages && session.overallProgress >= 90;

  return (
    <div className="flex flex-col h-full onboarding-atmosphere">
      {/* Header - Bold brand presence with display font */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm reveal-1">
        <div>
          <h1 className="text-xl font-display font-normal text-foreground tracking-tight">{getStageName(session.currentStage)}</h1>
          <p className="text-sm font-body text-muted-foreground">
            Stage {session.currentStage} of {session.totalStages} &bull;{' '}
            <span className="text-primary font-medium">{session.agentPersonality?.name || 'Alex'}</span> is here to help
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-primary tabular-nums">
            {Math.round(session.overallProgress)}% Complete
          </span>
          {isConversationComplete && (
            <Button onClick={onComplete} size="sm">
              Complete
            </Button>
          )}
        </div>
      </header>

      {/* Conversation Area */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={cn(
                'onboarding-message-animate',
                message.role === 'user' ? 'flex justify-end' : ''
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {message.role === 'assistant' ? (
                // AI Message - Clean with left accent
                <div className="onboarding-message-ai space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-body font-medium">
                      {session.agentPersonality?.name || 'Alex'}
                    </span>
                    <span className="text-xs font-body text-muted-foreground">
                      {formatTime(new Date(message.timestamp))}
                    </span>
                  </div>
                  <div className="text-[15px] font-body leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              ) : (
                // User Message - Soft rounded bubble
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <span className="text-xs font-body text-muted-foreground">
                      {formatTime(new Date(message.timestamp))}
                    </span>
                    <span className="text-sm font-body font-medium">You</span>
                  </div>
                  <div className="onboarding-message-user">
                    <p className="text-[15px] font-body leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="onboarding-message-ai onboarding-message-animate">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {session.agentPersonality?.name || 'Alex'}
                </span>
              </div>
              <div className="flex items-center gap-2 py-2">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Completion Banner - More prominent than header button */}
      {isConversationComplete && (
        <div className="border-t border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10 p-6">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-display text-lg font-semibold text-accent flex items-center gap-2 justify-center sm:justify-start">
                <CheckCircle className="w-5 h-5" />
                You're all set!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                All stages complete. Ready to start your validation journey.
              </p>
            </div>
            <Button
              onClick={onComplete}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white min-w-[180px]"
            >
              Complete Onboarding
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area - Clean with floating send */}
      <div className="border-t border-border/50 bg-muted/30 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="onboarding-input-container p-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your response... (Enter to send)"
                className="onboarding-input min-h-[60px] max-h-[200px]"
                disabled={isLoading}
                rows={2}
                aria-label="Type your message"
                aria-describedby="input-instructions"
              />
              <div className="flex items-center justify-between mt-3">
                <p id="input-instructions" className="text-xs text-muted-foreground">
                  Be specific and detailed in your responses to get the best strategic guidance.
                </p>
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="h-8 px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span className="mr-2">Send</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
