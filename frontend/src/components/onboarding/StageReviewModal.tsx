'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface StageReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageNumber: number;
  stageName: string;
  messages: Message[];
  /** Optional agent name for display (defaults to "Alex") */
  agentName?: string;
}

// ============================================================================
// Stage Review Modal Component
// ============================================================================

export function StageReviewModal({
  isOpen,
  onClose,
  stageNumber,
  stageName,
  messages,
  agentName = 'Alex',
}: StageReviewModalProps) {
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-sm">
              {stageNumber}
            </span>
            {stageName}
          </DialogTitle>
          <DialogDescription>
            Review your conversation from this stage. This is read-only.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 mt-4 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages recorded for this stage.
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.timestamp}-${index}`}
                  className={cn(
                    message.role === 'user' ? 'flex justify-end' : ''
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="space-y-1 max-w-[90%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary">{agentName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap pl-3 border-l-2 border-primary/30">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                        <span className="text-xs font-medium">You</span>
                      </div>
                      <div className="bg-primary/10 rounded-xl rounded-br-sm px-4 py-2">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
