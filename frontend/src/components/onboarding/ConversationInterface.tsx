'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface QualitySignals {
  clarity: { label: 'high' | 'medium' | 'low'; score: number };
  completeness: { label: 'complete' | 'partial' | 'insufficient'; score: number };
  detailScore: number;
  overall: number;
  qualityTags?: string[];
  suggestions?: string[];
  encouragement?: string;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  stage: number;
  isPending?: boolean;
  qualitySignals?: QualitySignals;
  systemActions?: {
    triggerWorkflow?: boolean;
    requestClarification?: boolean;
    needsReview?: boolean;
  };
}

interface OnboardingSession {
  sessionId: string;
  currentStage: number;
  totalStages: number;
  overallProgress: number;
  stageProgress: number;
  agentPersonality: any;
  conversationHistory: ConversationMessage[];
  isActive: boolean;
}

interface ConversationInterfaceProps {
  session: OnboardingSession;
  onSendMessage: (message: string, messageType?: 'text' | 'voice_transcript') => Promise<void>;
  onComplete: () => Promise<void>;
}

// ============================================================================
// ConversationInterface Component
// ============================================================================

export function ConversationInterface({
  session,
  onSendMessage,
  onComplete,
}: ConversationInterfaceProps) {
  
  // State management
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAIHelp, setShowAIHelp] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setVoiceSupported(true);
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [session.conversationHistory]);

  useEffect(() => {
    setIsTyping(session.conversationHistory.some((msg) => msg.isPending));
  }, [session.conversationHistory]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || isSending) return;

    const message = currentMessage.trim();
    setCurrentMessage('');
    setIsSending(true);
    setIsTyping(true);

    try {
      await onSendMessage(message, 'text');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
      setIsTyping(false);
      
      // Refocus textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [currentMessage, isSending, onSendMessage]);

  // Handle voice input
  const handleVoiceInput = useCallback(() => {
    if (!voiceSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [voiceSupported, isListening]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Format timestamp for display
  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
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

  // Check if conversation is complete
  const isConversationComplete = session.currentStage >= session.totalStages && session.overallProgress >= 90;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full" data-testid="chat-interface">
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
            {session.conversationHistory.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* AI Avatar */}
                {message.type === 'ai' && (
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
                    ${message.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : message.type === 'ai'
                      ? 'bg-muted'
                      : 'bg-muted/50 text-muted-foreground text-center'
                    }
                  `}
                  role={message.type === 'system' ? 'status' : undefined}
                  aria-label={
                    message.type === 'ai'
                      ? `AI response: ${message.content}`
                      : message.type === 'user'
                      ? `Your message: ${message.content}`
                      : `System message: ${message.content}`
                  }
                  data-role={message.type === 'ai' ? 'assistant' : message.type}
                  data-testid={message.type === 'ai' ? 'ai-message' : `${message.type}-message`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {message.isPending && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                      <span>Analyzing your response…</span>
                    </div>
                  )}

                  {message.type === 'ai' && message.qualitySignals && !message.isPending && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="capitalize">
                        Clarity: {message.qualitySignals.clarity.label}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        Completeness: {message.qualitySignals.completeness.label}
                      </Badge>
                      <span>
                        Detail: {Math.round(message.qualitySignals.detailScore * 100)}%
                      </span>
                    </div>
                  )}

                  {message.type === 'ai' && message.qualitySignals?.qualityTags?.length && !message.isPending && (
                    <div className="mt-2 text-xs text-yellow-600">
                      {message.qualitySignals.qualityTags.includes('clarity_low') && (
                        <div>Tip: add concrete examples or specifics so we can refine the analysis.</div>
                      )}
                      {message.qualitySignals.qualityTags.includes('incomplete') && (
                        <div>We need a bit more information before we can advance to the next stage.</div>
                      )}
                    </div>
                  )}

                  {message.type === 'ai' && message.systemActions?.requestClarification && !message.isPending && (
                    <div className="mt-2 text-xs text-amber-600">
                      The AI flagged this response for clarification. Try expanding on the details above.
                    </div>
                  )}

                  {/* Message metadata */}
                  <div className={`
                    flex items-center justify-between mt-2 text-xs
                    ${message.type === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                    }
                  `}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.stage !== session.currentStage && (
                      <Badge variant="outline" className="text-xs">
                        {getStageName(message.stage)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {message.type === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      You
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start" data-testid="ai-loading">
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
            <div className="flex gap-2">
              {/* Message Input */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening 
                      ? "Listening... Speak now"
                      : "Type your response here... (Press Enter to send, Shift+Enter for new line)"
                  }
                  className="min-h-[60px] max-h-[120px] resize-none pr-20"
                  disabled={isSending || isListening}
                  aria-label="Type your message"
                  aria-describedby="input-help"
                />
                
                {/* Character count */}
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {currentMessage.length}/1000
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {/* Voice Input Button */}
                {voiceSupported && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVoiceInput}
                        disabled={isSending}
                        className={isListening ? 'bg-red-100 border-red-300' : ''}
                        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                      >
                        {isListening ? (
                          <MicOff className="h-4 w-4 text-red-600" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isListening ? 'Stop voice input' : 'Voice input'}</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* AI Help Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIHelp(true)}
                      disabled={isSending}
                      aria-label="Get AI help with your response"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get help with your response</p>
                  </TooltipContent>
                </Tooltip>

                {/* Send Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || isSending || currentMessage.length > 1000}
                      size="sm"
                      aria-label="Send message"
                      data-testid="send-button"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send message (Enter)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Input Help Text */}
            <div id="input-help" className="mt-2 text-xs text-muted-foreground">
              <p>
                Be specific and detailed in your responses to get the best strategic guidance. 
                {voiceSupported && ' You can use voice input or type your response.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Help Dialog */}
      <AlertDialog open={showAIHelp} onOpenChange={setShowAIHelp}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tips for Better Responses</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>To get the most value from this conversation:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Be specific:</strong> Include concrete examples and details</li>
                  <li><strong>Share context:</strong> Explain your situation and constraints</li>
                  <li><strong>Ask questions:</strong> If you're unsure about something, ask for clarification</li>
                  <li><strong>Think out loud:</strong> Share your thought process and concerns</li>
                  <li><strong>Be honest:</strong> Authentic responses lead to better guidance</li>
                </ul>
                <p className="text-sm">
                  Remember, this conversation is confidential and designed to help you succeed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction>Got it!</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
