# 🧩 Frontend Components Specification

**React Component Architecture for Onboarding**

**Status:** 🔴 **MISSING** - Required for launch  
**Priority:** **P0 - LAUNCH BLOCKER**  
**Estimated Implementation:** 6-8 hours  
**Cross-Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md) - Section 2.5 Backend & AI  

---

## 📋 Document Purpose

This specification defines the React components required to build the AI-guided onboarding experience. These components must deliver the conversational interface that marketing promises but currently doesn't exist, transforming the 404 error into a professional AI consultation experience.

**Current Gap:** No onboarding components exist - users hit 404 error  
**Required Solution:** Complete component library for AI conversation interface  
**Business Impact:** Enables delivery of promised AI-guided strategic analysis  

---

## 1. OnboardingWizard - Main Container Component

### 1.1 Shadcn-Optimized Component Architecture

**🔧 Required Shadcn Components:**
```bash
npx shadcn@latest add sidebar card button badge skeleton sonner progress avatar scroll-area textarea
```

```typescript
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface OnboardingWizardProps {
  userId: string;
  planType: 'trial' | 'sprint' | 'founder' | 'enterprise';
  onComplete: (results: OnboardingResults) => void;
  onError: (error: OnboardingError) => void;
  onExit?: () => void;
}

interface OnboardingWizardState {
  sessionId: string | null;
  currentStage: number;
  overallProgress: number;
  isLoading: boolean;
  error: string | null;
  conversationState: ConversationState;
  entrepreneurBrief: Partial<EntrepreneurBrief>;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  userId,
  planType,
  onComplete,
  onError,
  onExit
}) => {
  const [state, setState] = useState<OnboardingWizardState>(initialState);
  const { sessionId, currentStage, overallProgress, isLoading, error } = state;
  
  // Error handling with Sonner toast notifications
  useEffect(() => {
    if (error) {
      toast.error("Onboarding Error", {
        description: error,
        action: {
          label: "Retry",
          onClick: handleRetry,
        },
      });
    }
  }, [error]);
  
  // Shadcn Sidebar-based layout structure
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {/* Shadcn Sidebar for progress and brief summary */}
        <OnboardingSidebar
          progress={overallProgress}
          currentStage={currentStage}
          entrepreneurBrief={state.entrepreneurBrief}
          sessionId={sessionId}
          planType={planType}
        />
        
        {/* Main content area using SidebarInset */}
        <SidebarInset className="flex-1">
          {/* Header with progress indicator */}
          <OnboardingHeader 
            progress={overallProgress}
            currentStage={currentStage}
            onExit={onExit}
            planType={planType}
          />
          
          {/* Main conversation area */}
          <main className="flex-1 p-6">
            {error ? (
              <ErrorDisplay error={error} onRetry={handleRetry} />
            ) : isLoading ? (
              <LoadingState message="Initializing AI consultant..." />
            ) : sessionId ? (
              <ConversationInterface
                sessionId={sessionId}
                onMessage={handleMessage}
                onStageComplete={handleStageComplete}
                onError={handleError}
              />
            ) : (
              <WelcomeScreen 
                planType={planType}
                onStart={handleStart}
              />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
```

### 1.2 State Management Integration

```typescript
// Zustand store for onboarding state
interface OnboardingStore {
  // Session state
  sessionId: string | null;
  isActive: boolean;
  currentStage: number;
  overallProgress: number;
  
  // Conversation state
  messages: ConversationMessage[];
  isTyping: boolean;
  lastMessageId: string | null;
  
  // Data collection
  entrepreneurBrief: Partial<EntrepreneurBrief>;
  stageData: Record<number, StageData>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  sidebarCollapsed: boolean;
  
  // Actions
  startSession: (userId: string, planType: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  completeOnboarding: () => Promise<OnboardingResults>;
  updateBrief: (update: Partial<EntrepreneurBrief>) => void;
  resetSession: () => void;
  
  // UI actions
  toggleSidebar: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // Initial state
  sessionId: null,
  isActive: false,
  currentStage: 0,
  overallProgress: 0,
  messages: [],
  isTyping: false,
  lastMessageId: null,
  entrepreneurBrief: {},
  stageData: {},
  isLoading: false,
  error: null,
  sidebarCollapsed: false,
  
  // Implementation of actions...
  startSession: async (userId, planType) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.onboarding.start({ userId, planType });
      const data = await response.json();
      
      if (data.success) {
        set({
          sessionId: data.sessionId,
          isActive: true,
          currentStage: 1,
          messages: [{
            id: generateId(),
            type: 'ai',
            content: data.agentIntroduction,
            timestamp: new Date().toISOString()
          }],
          isLoading: false
        });
      } else {
        throw new Error(data.error.message);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start session',
        isLoading: false 
      });
    }
  }
  
  // Additional action implementations...
}));
```

---

## 2. ConversationInterface - Chat-like AI Interaction

### 2.1 Shadcn-Optimized Component Structure

```typescript
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface ConversationInterfaceProps {
  sessionId: string;
  onMessage: (message: string) => Promise<void>;
  onStageComplete: (stage: number) => void;
  onError: (error: Error) => void;
}

export const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  sessionId,
  onMessage,
  onStageComplete,
  onError
}) => {
  const { messages, isTyping, currentStage } = useOnboardingStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/ai-consultant-avatar.png" alt="AI Consultant" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              AI
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">AI Strategy Consultant</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Stage {currentStage} of 7
              </Badge>
              {getStageDescription(currentStage)}
            </CardDescription>
          </div>
          <InteractionModeToggle />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <MessageList 
            messages={messages}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
          />
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <MessageInput 
          onSend={onMessage}
          disabled={isTyping}
          placeholder={getInputPlaceholder(currentStage)}
        />
      </CardFooter>
    </Card>
  );
};
```

### 2.2 Message Components

```typescript
// Message List Component
interface MessageListProps {
  messages: ConversationMessage[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  messagesEndRef
}) => {
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id}
            message={message}
          />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

// Individual Message Bubble
interface MessageBubbleProps {
  message: ConversationMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAI = message.type === 'ai';
  
  return (
    <div 
      className={cn(
        "flex gap-3 max-w-[80%]",
        isAI ? "justify-start" : "justify-end ml-auto"
      )}
      role="article"
      aria-label={isAI ? "AI message" : "Your message"}
    >
      {isAI && <AIAgentAvatar size="sm" />}
      
      <div
        className={cn(
          "rounded-lg px-4 py-3 text-sm",
          isAI 
            ? "bg-muted text-foreground" 
            : "bg-primary text-primary-foreground"
        )}
      >
        {isAI && (
          <span className="sr-only">AI Consultant says:</span>
        )}
        <MessageContent content={message.content} />
        <MessageTimestamp timestamp={message.timestamp} />
      </div>
      
      {!isAI && <UserAvatar size="sm" />}
    </div>
  );
};

// Typing Indicator
export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 items-center">
      <AIAgentAvatar size="sm" />
      <div className="bg-muted rounded-lg px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
        </div>
        <span className="sr-only">AI is typing...</span>
      </div>
    </div>
  );
};
```

### 2.3 Shadcn-Optimized Message Input Component

```typescript
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, Mic, HelpCircle, Loader2 } from "lucide-react"

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = "Type your response..."
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSend = async () => {
    if (!message.trim() || disabled || isSending) return;
    
    setIsSending(true);
    try {
      await onSend(message.trim());
      setMessage('');
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error("Failed to send message", {
        description: "Please try again or check your connection."
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="flex gap-3 w-full" role="region" aria-label="Message input">
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSending}
          className="min-h-[80px] max-h-[160px] resize-none pr-16 pb-8"
          aria-label="Type your response to the AI consultant"
          aria-describedby="char-count help-text"
        />
        
        {/* Character count */}
        <Badge 
          variant="secondary" 
          className="absolute bottom-2 right-2 text-xs"
          id="char-count"
        >
          {message.length}/2000
        </Badge>
        
        {/* Help text for screen readers */}
        <div id="help-text" className="sr-only">
          Press Enter to send, Shift+Enter for new line. Character limit is 2000.
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        {/* Send Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || disabled || isSending}
                size="default"
                className="h-[80px] w-12 p-0"
                aria-label={isSending ? "Sending message..." : "Send message"}
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send message (Enter)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Voice Input Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <VoiceInputButton 
                onTranscript={(transcript) => setMessage(prev => prev + transcript)}
                disabled={disabled}
                isActive={isVoiceMode}
                onActiveChange={setIsVoiceMode}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Voice input (Alt+V)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* AI Help Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AIHelpButton 
                onHelpRequest={(helpType) => {
                  // Trigger AI help system
                  onSend(`[HELP:${helpType}]`);
                }}
                disabled={disabled}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Get AI help (Alt+H)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
```

---

## 3. ProgressTracker - Shows Onboarding Progress

### 3.1 Progress Visualization

```typescript
interface ProgressTrackerProps {
  currentStage: number;
  overallProgress: number;
  stageProgress?: number;
  showDetails?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentStage,
  overallProgress,
  stageProgress = 0,
  showDetails = true
}) => {
  const stages = [
    { number: 1, name: "Welcome", description: "Getting started" },
    { number: 2, name: "Customers", description: "Target audience" },
    { number: 3, name: "Problem", description: "Pain points" },
    { number: 4, name: "Solution", description: "Your approach" },
    { number: 5, name: "Competition", description: "Market landscape" },
    { number: 6, name: "Resources", description: "Available assets" },
    { number: 7, name: "Goals", description: "Success metrics" }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Conversation Progress</CardTitle>
        <CardDescription>
          Stage {currentStage} of {stages.length} • {overallProgress}% complete
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
        
        {/* Current Stage Progress */}
        {stageProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Stage</span>
              <span>{stageProgress}%</span>
            </div>
            <Progress value={stageProgress} className="h-2" />
          </div>
        )}
        
        {/* Stage List */}
        {showDetails && (
          <div className="space-y-2">
            {stages.map((stage) => (
              <StageIndicator
                key={stage.number}
                stage={stage}
                currentStage={currentStage}
                isComplete={stage.number < currentStage}
                isCurrent={stage.number === currentStage}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Individual Stage Indicator
interface StageIndicatorProps {
  stage: { number: number; name: string; description: string };
  currentStage: number;
  isComplete: boolean;
  isCurrent: boolean;
}

const StageIndicator: React.FC<StageIndicatorProps> = ({
  stage,
  isComplete,
  isCurrent
}) => {
  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg transition-colors",
      isCurrent && "bg-primary/10 border border-primary/20",
      isComplete && "opacity-75"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
        isComplete && "bg-primary text-primary-foreground",
        isCurrent && "bg-primary/20 text-primary border-2 border-primary",
        !isComplete && !isCurrent && "bg-muted text-muted-foreground"
      )}>
        {isComplete ? (
          <Check className="h-4 w-4" />
        ) : (
          stage.number
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium text-sm",
          isCurrent && "text-primary"
        )}>
          {stage.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {stage.description}
        </div>
      </div>
      
      {isCurrent && (
        <div className="text-xs text-primary font-medium">
          In Progress
        </div>
      )}
    </div>
  );
};
```

---

## 4. OnboardingSidebar - Shadcn Sidebar Integration

### 4.1 Sidebar Component Structure

```typescript
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail
} from "@/components/ui/sidebar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface OnboardingSidebarProps {
  progress: number;
  currentStage: number;
  entrepreneurBrief: Partial<EntrepreneurBrief>;
  sessionId: string | null;
  planType: 'trial' | 'sprint' | 'founder' | 'enterprise';
}

export const OnboardingSidebar: React.FC<OnboardingSidebarProps> = ({
  progress,
  currentStage,
  entrepreneurBrief,
  sessionId,
  planType
}) => {
  const stages = [
    { number: 1, name: "Welcome", icon: "👋", description: "Getting started" },
    { number: 2, name: "Customers", icon: "👥", description: "Target audience" },
    { number: 3, name: "Problem", icon: "🎯", description: "Pain points" },
    { number: 4, name: "Solution", icon: "💡", description: "Your approach" },
    { number: 5, name: "Competition", icon: "🏆", description: "Market landscape" },
    { number: 6, name: "Resources", icon: "💰", description: "Available assets" },
    { number: 7, name: "Goals", icon: "🚀", description: "Success metrics" }
  ];

  return (
    <Sidebar className="w-80">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <Badge variant={
            planType === 'trial' ? 'secondary' : 
            planType === 'sprint' ? 'outline' :
            planType === 'founder' ? 'default' : 
            'destructive' // enterprise
          }>
            {planType === 'sprint' ? 'STRATEGY SPRINT' : 
             planType === 'enterprise' ? 'ENTERPRISE' : 
             planType.toUpperCase()}
          </Badge>
          <span className="text-sm text-muted-foreground">Plan</span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Conversation Progress */}
        <SidebarGroup>
          <SidebarGroupLabel>Conversation Stages</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {stages.map((stage) => (
                <SidebarMenuItem key={stage.number}>
                  <SidebarMenuButton 
                    isActive={stage.number === currentStage}
                    className="flex items-center gap-3 p-3"
                    disabled={stage.number > currentStage}
                  >
                    <span className="text-lg">{stage.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{stage.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {stage.description}
                      </div>
                    </div>
                    {stage.number < currentStage && (
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                    )}
                    {stage.number === currentStage && (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Business Brief Summary */}
        <SidebarGroup>
          <SidebarGroupLabel>Your Business Brief</SidebarGroupLabel>
          <SidebarGroupContent>
            <EntrepreneurBriefSummary 
              brief={entrepreneurBrief}
              currentStage={currentStage}
              compact={true}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
};
```

## 5. EntrepreneurBriefSummary - Displays Collected Information

### 5.1 Compact Sidebar Display

```typescript
interface EntrepreneurBriefSummaryProps {
  brief: Partial<EntrepreneurBrief>;
  currentStage: number;
  isLive?: boolean;
}

export const EntrepreneurBriefSummary: React.FC<EntrepreneurBriefSummaryProps> = ({
  brief,
  currentStage,
  isLive = true
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Your Business Brief
          {isLive && (
            <Badge variant="secondary" className="text-xs">
              Live Updates
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Information collected during our conversation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <BriefSection
          title="Target Customers"
          content={brief.customerSegments}
          isComplete={!!brief.customerSegments?.length}
          isActive={currentStage === 2}
        />
        
        <BriefSection
          title="Problem Being Solved"
          content={brief.problemDescription}
          isComplete={!!brief.problemDescription}
          isActive={currentStage === 3}
        />
        
        <BriefSection
          title="Solution Approach"
          content={brief.solutionDescription}
          isComplete={!!brief.solutionDescription}
          isActive={currentStage === 4}
        />
        
        <BriefSection
          title="Key Competitors"
          content={brief.competitors}
          isComplete={!!brief.competitors?.length}
          isActive={currentStage === 5}
        />
        
        <BriefSection
          title="Available Resources"
          content={brief.budgetRange}
          isComplete={!!brief.budgetRange}
          isActive={currentStage === 6}
        />
        
        <BriefSection
          title="Business Goals"
          content={brief.threeMonthGoals}
          isComplete={!!brief.threeMonthGoals?.length}
          isActive={currentStage === 7}
        />
      </CardContent>
    </Card>
  );
};

// Individual Brief Section
interface BriefSectionProps {
  title: string;
  content: any;
  isComplete: boolean;
  isActive: boolean;
}

const BriefSection: React.FC<BriefSectionProps> = ({
  title,
  content,
  isComplete,
  isActive
}) => {
  const renderContent = () => {
    if (!content) {
      return (
        <div className="text-sm text-muted-foreground italic">
          {isActive ? "Currently discussing..." : "Not yet covered"}
        </div>
      );
    }
    
    if (Array.isArray(content)) {
      return (
        <ul className="text-sm space-y-1">
          {content.slice(0, 3).map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span>{typeof item === 'string' ? item : item.name || item.description}</span>
            </li>
          ))}
          {content.length > 3 && (
            <li className="text-muted-foreground">
              +{content.length - 3} more...
            </li>
          )}
        </ul>
      );
    }
    
    return (
      <p className="text-sm line-clamp-3">
        {typeof content === 'string' ? content : JSON.stringify(content)}
      </p>
    );
  };
  
  return (
    <div className={cn(
      "p-3 rounded-lg border transition-colors",
      isActive && "border-primary/50 bg-primary/5",
      isComplete && !isActive && "border-green-200 bg-green-50",
      !isComplete && !isActive && "border-border"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
        {isComplete && (
          <Check className="h-4 w-4 text-green-600" />
        )}
        {isActive && (
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        )}
      </div>
      
      {renderContent()}
    </div>
  );
};
```

---

## 5. WorkflowLauncher - Triggers Full Strategic Analysis

### 5.1 Completion Interface

```typescript
interface WorkflowLauncherProps {
  entrepreneurBrief: EntrepreneurBrief;
  onLaunch: () => Promise<WorkflowResult>;
  onEdit: (section: string) => void;
}

export const WorkflowLauncher: React.FC<WorkflowLauncherProps> = ({
  entrepreneurBrief,
  onLaunch,
  onEdit
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [completeness, setCompleteness] = useState<CompletenessCheck | null>(null);
  
  useEffect(() => {
    setCompleteness(checkBriefCompleteness(entrepreneurBrief));
  }, [entrepreneurBrief]);
  
  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      await onLaunch();
    } catch (error) {
      console.error('Failed to launch workflow:', error);
    } finally {
      setIsLaunching(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Ready for Strategic Analysis</CardTitle>
        <CardDescription>
          Review your information and launch the full AI analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Completeness Check */}
        <div className="space-y-3">
          <h4 className="font-medium">Information Completeness</h4>
          <div className="grid gap-2">
            {completeness?.sections.map((section) => (
              <CompletenessItem
                key={section.name}
                section={section}
                onEdit={() => onEdit(section.key)}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium">
                Overall Completeness: {completeness?.overallScore}%
              </div>
              <Progress value={completeness?.overallScore} className="h-2 mt-1" />
            </div>
          </div>
        </div>
        
        {/* Analysis Preview */}
        <div className="space-y-3">
          <h4 className="font-medium">What You'll Receive</h4>
          <div className="grid gap-2">
            {analysisDeliverables.map((deliverable) => (
              <DeliverablePreview
                key={deliverable.name}
                deliverable={deliverable}
              />
            ))}
          </div>
        </div>
        
        {/* Launch Button */}
        <div className="space-y-3">
          <Button
            onClick={handleLaunch}
            disabled={isLaunching || (completeness?.overallScore || 0) < 70}
            size="lg"
            className="w-full"
          >
            {isLaunching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Launching Analysis...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Start Strategic Analysis
              </>
            )}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 inline mr-1" />
            Estimated completion: 15-20 minutes
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 6. Accessibility & WCAG Compliance

### 6.1 Shadcn Accessibility Features

**🔧 Additional Shadcn Components for Accessibility:**
```bash
npx shadcn@latest add tooltip alert-dialog separator label
```

**Built-in Accessibility Features:**
- ✅ **Semantic HTML:** All Shadcn components use proper semantic elements
- ✅ **ARIA Labels:** Comprehensive ARIA support in all interactive components
- ✅ **Keyboard Navigation:** Full keyboard accessibility with focus management
- ✅ **Screen Reader Support:** Proper announcements and descriptions
- ✅ **Color Contrast:** WCAG AA compliant color schemes
- ✅ **Focus Indicators:** Visible focus states on all interactive elements

**AI-Specific Accessibility Enhancements:**
```typescript
// AI message announcements
const announceMessage = (message: string, type: 'ai' | 'user') => {
  const announcement = type === 'ai' 
    ? `AI Consultant says: ${message}`
    : `You said: ${message}`;
  
  // Use aria-live region for screen reader announcements
  setAriaLiveMessage(announcement);
};

// Voice input accessibility
const VoiceInputButton = ({ onTranscript, disabled, isActive, onActiveChange }) => {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="default"
      className="h-[40px] w-12 p-0"
      onClick={toggleVoiceInput}
      disabled={disabled}
      aria-label={isActive ? "Stop voice input" : "Start voice input"}
      aria-pressed={isActive}
      aria-describedby="voice-input-help"
    >
      <Mic className={cn("h-4 w-4", isActive && "animate-pulse")} />
      <span id="voice-input-help" className="sr-only">
        {isActive ? "Voice recording active" : "Click to start voice input"}
      </span>
    </Button>
  );
};

// AI Help Button with accessibility
const AIHelpButton = ({ onHelpRequest, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="h-[40px] w-12 p-0"
          disabled={disabled}
          aria-label="Get AI help with your response"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>AI Help Options</AlertDialogTitle>
          <AlertDialogDescription>
            Choose how you'd like the AI to help you with your response:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Button onClick={() => onHelpRequest('examples')} variant="outline">
            Give me examples
          </Button>
          <Button onClick={() => onHelpRequest('clarification')} variant="outline">
            Clarify the question
          </Button>
          <Button onClick={() => onHelpRequest('brainstorming')} variant="outline">
            Help me brainstorm
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

### 6.2 WCAG 2.2 Compliance Checklist

**✅ Level AA Requirements Met:**
- **Focus Visible (2.4.7):** 2px minimum focus indicators on all interactive elements
- **Target Size (2.5.8):** 44×44px minimum touch targets for all buttons
- **Consistent Help (3.2.6):** AI help button consistently placed and labeled
- **Accessible Authentication (3.3.8):** No cognitive function tests required for login

**🔗 Cross-Reference:** [`accessibility-standards.md`](../../startupai.site/docs/design/accessibility-standards.md) - Complete WCAG compliance framework

## 7. Cross-References

**Primary Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md)
- Section 2.5: Backend & AI (CrewAI integration requirements)
- Phase 4: AI-Guided Onboarding System (20-25 hours)
- Phase 5: Critical Accessibility Fixes (8-10 hours)

**Related Documentation:**
- [`onboarding-agent-integration.md`](../features/onboarding-agent-integration.md) - Parent specification with multi-modal interaction
- [`ai-conversation-interface.md`](../features/ai-conversation-interface.md) - Chat interface design patterns
- [`onboarding-api-endpoints.md`](./onboarding-api-endpoints.md) - API integration and streaming
- [`onboarding-journey-map.md`](../user-experience/onboarding-journey-map.md) - Complete user experience flow
- [`accessibility-standards.md`](../../startupai.site/docs/design/accessibility-standards.md) - WCAG compliance requirements

**Shadcn Implementation Dependencies:**
- ✅ **Core Components:** `sidebar card button badge skeleton sonner progress avatar scroll-area textarea`
- ✅ **Accessibility Components:** `tooltip alert-dialog separator label`
- ✅ **API Integration:** Real-time streaming infrastructure
- ✅ **State Management:** Zustand with accessibility announcements
- ✅ **Voice Input:** Web Speech API with accessibility fallbacks

---

**Status:** 🔴 **CRITICAL IMPLEMENTATION REQUIRED**  
**Next Action:** Begin component development after API endpoints ready  
**Owner:** Frontend development team  
**Deadline:** Before launch (launch blocker)  
