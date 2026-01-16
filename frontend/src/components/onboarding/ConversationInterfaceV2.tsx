/**
 * ConversationInterface V2 - Clean Professional Design
 *
 * Redesigned with Linear/Notion-inspired aesthetics:
 * - Minimal, clean message styling
 * - Subtle animations
 * - Refined typography and spacing
 */

'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// ============================================================================
// Simple Markdown Renderer with Question Highlighting
// ============================================================================

/**
 * Renders basic markdown (bold, italic) to React elements
 * Handles: **bold**, *italic*, `code`
 */
function renderMarkdownBasic(text: string, keyOffset: number = 0): { nodes: React.ReactNode[]; keyCount: number } {
  if (!text) return { nodes: [], keyCount: 0 };

  const parts: React.ReactNode[] = [];
  let key = keyOffset;

  // Process bold (**text**), italic (*text*), and code (`text`)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add formatted text
    if (match[2]) {
      // Bold: **text**
      parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      // Italic: *text*
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      // Code: `text`
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">
          {match[4]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return { nodes: parts.length > 0 ? parts : [text], keyCount: key - keyOffset };
}

/**
 * Renders markdown with question highlighting
 * Questions (sentences ending with ?) are visually emphasized
 */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split text into paragraphs (preserve double newlines)
  const paragraphs = text.split(/\n\n+/);
  const result: React.ReactNode[] = [];
  let globalKey = 0;

  paragraphs.forEach((paragraph, pIndex) => {
    if (pIndex > 0) {
      result.push(<br key={`br-${globalKey++}`} />);
      result.push(<br key={`br-${globalKey++}`} />);
    }

    // Split paragraph into sentences, keeping the punctuation
    // Match sentences ending with ? ! or .
    const sentenceRegex = /([^.!?]*[.!?]+\s*)/g;
    const sentences: string[] = [];
    let lastEnd = 0;
    let sentenceMatch;

    while ((sentenceMatch = sentenceRegex.exec(paragraph)) !== null) {
      sentences.push(sentenceMatch[1]);
      lastEnd = sentenceRegex.lastIndex;
    }

    // Add any remaining text that doesn't end with punctuation
    if (lastEnd < paragraph.length) {
      sentences.push(paragraph.slice(lastEnd));
    }

    // If no sentences found, treat whole paragraph as one
    if (sentences.length === 0) {
      sentences.push(paragraph);
    }

    sentences.forEach((sentence, sIndex) => {
      const trimmed = sentence.trim();
      const isQuestion = trimmed.endsWith('?');

      // Process markdown within the sentence
      const { nodes, keyCount } = renderMarkdownBasic(sentence, globalKey);
      globalKey += keyCount || 1;

      if (isQuestion && trimmed.length > 0) {
        // Highlight questions with accent color and slightly bolder
        result.push(
          <span
            key={`q-${globalKey++}`}
            className="text-primary font-medium"
          >
            {nodes}
          </span>
        );
      } else {
        result.push(...nodes);
      }
    });
  });

  return result;
}

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
  isSaving?: boolean;
  savedVersion?: number | null;
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
  isSaving = false,
  savedVersion = null,
  onComplete,
}: ConversationInterfaceProps) {
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated before scrolling
    requestAnimationFrame(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector(
          '[data-radix-scroll-area-viewport]'
        );
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth',
          });
        }
      }
    });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set height to scrollHeight, capped at max-height (200px)
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

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

  // Handle button click explicitly to avoid race condition with disabled state
  const handleButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Use requestSubmit for consistent behavior with Enter key
    const form = e.currentTarget.closest('form');
    if (form && input.trim() && !isLoading) {
      // Let form's onSubmit handle the actual submission
      form.requestSubmit();
    }
  }, [input, isLoading]);

  // Format timestamp for display - handles missing/invalid timestamps gracefully
  const formatTime = useCallback((timestamp: Date | string | undefined) => {
    if (!timestamp) {
      return '--:--'; // Fallback for legacy messages without timestamps
    }
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '--:--'; // Fallback for invalid dates
    }
    return date.toLocaleTimeString([], {
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
      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.map((message, index) => (
            <div
              key={`msg-${index}-${message.timestamp || 'legacy'}`}
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
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="text-[15px] font-body leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {renderMarkdown(message.content)}
                  </div>
                </div>
              ) : (
                // User Message - Soft rounded bubble
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <span className="text-xs font-body text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                    <span className="text-sm font-body font-medium">You</span>
                  </div>
                  <div className="onboarding-message-user">
                    <div className="text-[15px] font-body leading-relaxed whitespace-pre-wrap">
                      {renderMarkdown(message.content)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator with time estimate */}
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
                <span className="text-sm text-muted-foreground">
                  Thinking... <span className="text-xs opacity-70">(usually 3-5 seconds)</span>
                </span>
              </div>
            </div>
          )}

          {/* Save Status Indicator (ADR-005: "Saved v{X}" UX) */}
          {(isSaving || savedVersion) && !isLoading && (
            <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-xs">Saving progress...</span>
                </>
              ) : savedVersion ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">Saved v{savedVersion}</span>
                </>
              ) : null}
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
                  onClick={handleButtonClick}
                  size="sm"
                  className="h-8 px-4"
                >
                  <span className="mr-2">Send</span>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
