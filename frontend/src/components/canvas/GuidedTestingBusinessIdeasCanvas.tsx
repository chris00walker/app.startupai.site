import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, CheckCircle, Target, TestTube, BookOpen, Library, Lightbulb, AlertTriangle } from 'lucide-react';

interface GuidedTestingBusinessIdeasCanvasProps {
  canvasId?: string;
  clientId: string;
  initialData?: any;
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

interface TBIData {
  assumptions: Array<{
    id: string;
    text: string;
    risk: 'high' | 'medium' | 'low';
    confidence: number;
  }>;
  testCards: Array<{
    id: string;
    hypothesis: string;
    method: string;
    criteria: string;
  }>;
  learningCards: Array<{
    id: string;
    observation: string;
    insight: string;
    decision: string;
  }>;
  experiments: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
  }>;
}

const defaultTBI: TBIData = {
  assumptions: [],
  testCards: [],
  learningCards: [],
  experiments: []
};

const tbiSteps = [
  {
    id: 'assumptions',
    title: 'Assumption Mapping',
    icon: Target,
    description: 'Identify and map your key business assumptions',
    guidance: 'Start by identifying the critical assumptions underlying your business model. What must be true for your business to succeed?',
    examples: ['Customers will pay $50/month', 'Users need this feature daily', 'Partners will integrate our API', 'Market size is 10M users'],
    why: 'Assumption mapping helps you identify the riskiest beliefs about your business that need validation first.',
    phase: 'Discovery',
    phaseColor: 'red'
  },
  {
    id: 'testCards',
    title: 'Test Design',
    icon: TestTube,
    description: 'Design experiments to test your assumptions',
    guidance: 'Create focused test cards for your highest-risk assumptions. Define clear hypotheses and testing methods.',
    examples: ['Landing page test', 'Customer interviews', 'Prototype testing', 'A/B price testing'],
    why: 'Well-designed tests provide reliable evidence to validate or invalidate your assumptions quickly and cheaply.',
    phase: 'Testing',
    phaseColor: 'blue'
  },
  {
    id: 'learningCards',
    title: 'Learning Capture',
    icon: BookOpen,
    description: 'Document insights from your experiments',
    guidance: 'Capture what you learned from each test. What worked? What didn\'t? What surprised you?',
    examples: ['Users confused by pricing', 'Feature not as valuable as expected', 'Different customer segment interested', 'Technical feasibility confirmed'],
    why: 'Learning cards help you make data-driven decisions about pivoting, iterating, or persevering.',
    phase: 'Learning',
    phaseColor: 'green'
  },
  {
    id: 'experiments',
    title: 'Experiment Library',
    icon: Library,
    description: 'Track all your validation experiments',
    guidance: 'Maintain a library of all experiments - planned, running, and completed. Track progress and results systematically.',
    examples: ['Customer interview series', 'MVP beta test', 'Pricing experiment', 'Feature usage analysis'],
    why: 'An experiment library helps you build institutional knowledge and avoid repeating failed experiments.',
    phase: 'Tracking',
    phaseColor: 'orange'
  }
];

export default function GuidedTestingBusinessIdeasCanvas({ 
  canvasId, 
  clientId, 
  initialData, 
  onSave, 
  readOnly = false 
}: GuidedTestingBusinessIdeasCanvasProps) {
  const [canvasData, setCanvasData] = useState<TBIData>(defaultTBI);
  const [currentStep, setCurrentStep] = useState(0);
  const [newItem, setNewItem] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [itemDetails, setItemDetails] = useState<any>({});

  useEffect(() => {
    if (initialData) {
      setCanvasData({ ...defaultTBI, ...initialData });
    } else if (canvasId) {
      const saved = localStorage.getItem(`guided-tbi-${canvasId}`);
      if (saved) {
        try {
          setCanvasData({ ...defaultTBI, ...JSON.parse(saved) });
        } catch (error) {
          console.error('Error parsing saved canvas data:', error);
        }
      }
    }
  }, [initialData, canvasId]);

  const currentStepData = tbiSteps[currentStep];
  const currentItems = canvasData[currentStepData.id as keyof TBIData];
  const progress = ((currentStep + 1) / tbiSteps.length) * 100;

  const addItem = () => {
    if (!newItem.trim()) return;
    
    const newItemObj = {
      id: Date.now().toString(),
      ...getItemStructure(currentStepData.id, newItem.trim(), itemDetails)
    };
    
    setCanvasData(prev => ({
      ...prev,
      [currentStepData.id]: [...prev[currentStepData.id as keyof TBIData], newItemObj]
    }));
    
    setNewItem('');
    setItemDetails({});
    setShowAddDialog(false);
  };

  const getItemStructure = (stepId: string, text: string, details: any) => {
    switch (stepId) {
      case 'assumptions':
        return {
          text,
          risk: details.risk || 'medium',
          confidence: details.confidence || 50
        };
      case 'testCards':
        return {
          hypothesis: text,
          method: details.method || '',
          criteria: details.criteria || ''
        };
      case 'learningCards':
        return {
          observation: text,
          insight: details.insight || '',
          decision: details.decision || ''
        };
      case 'experiments':
        return {
          title: text,
          type: details.type || 'interview',
          status: details.status || 'planned'
        };
      default:
        return { text };
    }
  };

  const removeItem = (index: number) => {
    setCanvasData(prev => ({
      ...prev,
      [currentStepData.id]: prev[currentStepData.id as keyof TBIData].filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(canvasData);
    } else if (canvasId) {
      localStorage.setItem(`guided-tbi-${canvasId}`, JSON.stringify(canvasData));
    }
  };

  const canGoNext = currentItems.length > 0 || currentStep === tbiSteps.length - 1;
  const canGoPrevious = currentStep > 0;

  const nextStep = () => {
    if (currentStep < tbiSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const Icon = currentStepData.icon;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Testing Business Ideas</h1>
            <p className="text-muted-foreground">Systematic validation through experimentation</p>
          </div>
          <Badge variant="outline" className="text-sm">
            Step {currentStep + 1} of {tbiSteps.length}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Current Step */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Phase Badge and Guidance */}
          <div className={`bg-${currentStepData.phaseColor}-50 border border-${currentStepData.phaseColor}-200 rounded-lg p-4`}>
            <div className="flex items-start gap-2">
              <Lightbulb className={`w-5 h-5 text-${currentStepData.phaseColor}-600 mt-0.5 flex-shrink-0`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-medium text-${currentStepData.phaseColor}-900`}>
                    {currentStepData.phase} Phase - Guidance
                  </h4>
                  <Badge variant="outline" className={`text-xs bg-${currentStepData.phaseColor}-100 border-${currentStepData.phaseColor}-300`}>
                    {currentStepData.phase}
                  </Badge>
                </div>
                <p className={`text-${currentStepData.phaseColor}-800 text-sm mb-3`}>{currentStepData.guidance}</p>
                <div className={`text-${currentStepData.phaseColor}-700 text-sm`}>
                  <strong>Why this matters:</strong> {currentStepData.why}
                </div>
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-2">Examples:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentStepData.examples.map((example, index) => (
                <div key={index} className="text-sm text-muted-foreground bg-background rounded px-3 py-2">
                  {example}
                </div>
              ))}
            </div>
          </div>

          {/* Current Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Your {currentStepData.title}</h4>
              {!readOnly && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                >
                  Add Item
                </Button>
              )}
            </div>
            
            {currentItems.length > 0 ? (
              <div className="space-y-2">
                {currentItems.map((item: any, index) => (
                  <div key={index} className="group relative">
                    <div className="p-3 bg-muted/30 rounded-md text-sm leading-relaxed pr-8">
                      {renderItemContent(item, currentStepData.id)}
                    </div>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Icon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No items added yet</p>
                <p className="text-xs mt-1">Add your first item to continue</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={previousStep}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex items-center gap-4">
          {!readOnly && (
            <Button variant="outline" onClick={handleSave}>
              Save Progress
            </Button>
          )}
          
          <Button 
            onClick={nextStep}
            disabled={!canGoNext}
            className="min-w-[100px]"
          >
            {currentStep === tbiSteps.length - 1 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Step Overview */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tbiSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = canvasData[step.id as keyof TBIData].length > 0;
              const isCurrent = index === currentStep;
              
              return (
                <div 
                  key={step.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrent ? 'border-primary bg-primary/5' : 
                    isCompleted ? `border-${step.phaseColor}-200 bg-${step.phaseColor}-50` : 
                    'border-muted bg-background'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <StepIcon className={`w-4 h-4 ${
                      isCurrent ? 'text-primary' : 
                      isCompleted ? `text-${step.phaseColor}-600` : 
                      'text-muted-foreground'
                    }`} />
                    <span className="text-sm font-medium">{step.title}</span>
                    {isCompleted && <CheckCircle className={`w-3 h-3 text-${step.phaseColor}-600 ml-auto`} />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="outline" className={`text-xs shrink-0 ${
                      isCompleted ? `bg-${step.phaseColor}-100 border-${step.phaseColor}-300` : ''
                    }`}>
                      {step.phase}
                    </Badge>
                    {isCompleted && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {canvasData[step.id as keyof TBIData].length} items
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {currentStepData.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={`Enter your ${currentStepData.title.toLowerCase()}...`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
            {renderAdditionalFields(currentStepData.id)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addItem} disabled={!newItem.trim()}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderItemContent(item: any, stepId: string) {
    switch (stepId) {
      case 'assumptions':
        return (
          <div>
            <div className="font-medium">{item.text}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant={item.risk === 'high' ? 'destructive' : item.risk === 'medium' ? 'default' : 'secondary'}>
                {item.risk} risk
              </Badge>
              <Badge variant="outline">{item.confidence}% confidence</Badge>
            </div>
          </div>
        );
      case 'testCards':
        return (
          <div>
            <div className="font-medium">{item.hypothesis}</div>
            {item.method && <div className="text-xs mt-1">Method: {item.method}</div>}
            {item.criteria && <div className="text-xs">Success: {item.criteria}</div>}
          </div>
        );
      case 'learningCards':
        return (
          <div>
            <div className="font-medium">{item.observation}</div>
            {item.insight && <div className="text-xs mt-1">Insight: {item.insight}</div>}
            {item.decision && <div className="text-xs">Decision: {item.decision}</div>}
          </div>
        );
      case 'experiments':
        return (
          <div>
            <div className="font-medium">{item.title}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{item.type}</Badge>
              <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>{item.status}</Badge>
            </div>
          </div>
        );
      default:
        return item.text || item;
    }
  }

  function renderAdditionalFields(stepId: string) {
    switch (stepId) {
      case 'assumptions':
        return (
          <>
            <Select onValueChange={(value) => setItemDetails({...itemDetails, risk: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Confidence level (0-100)"
              value={itemDetails.confidence || ''}
              onChange={(e) => setItemDetails({...itemDetails, confidence: parseInt(e.target.value)})}
            />
          </>
        );
      case 'testCards':
        return (
          <>
            <Input
              placeholder="Testing method"
              value={itemDetails.method || ''}
              onChange={(e) => setItemDetails({...itemDetails, method: e.target.value})}
            />
            <Input
              placeholder="Success criteria"
              value={itemDetails.criteria || ''}
              onChange={(e) => setItemDetails({...itemDetails, criteria: e.target.value})}
            />
          </>
        );
      case 'learningCards':
        return (
          <>
            <Input
              placeholder="Key insight"
              value={itemDetails.insight || ''}
              onChange={(e) => setItemDetails({...itemDetails, insight: e.target.value})}
            />
            <Input
              placeholder="Decision made"
              value={itemDetails.decision || ''}
              onChange={(e) => setItemDetails({...itemDetails, decision: e.target.value})}
            />
          </>
        );
      case 'experiments':
        return (
          <>
            <Select onValueChange={(value) => setItemDetails({...itemDetails, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Experiment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="survey">Survey</SelectItem>
                <SelectItem value="prototype">Prototype</SelectItem>
                <SelectItem value="landing-page">Landing Page</SelectItem>
                <SelectItem value="mvp">MVP</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setItemDetails({...itemDetails, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </>
        );
      default:
        return null;
    }
  }
}
