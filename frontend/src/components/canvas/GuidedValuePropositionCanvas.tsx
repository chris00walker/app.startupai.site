import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, CheckCircle, Users, Gift, TrendingUp, Pill, Smile, Frown, List, ArrowRight, Lightbulb } from 'lucide-react';

interface GuidedValuePropositionCanvasProps {
  canvasId?: string;
  clientId: string;
  initialData?: any;
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

interface VPCData {
  customerJobs: string[];
  customerPains: string[];
  customerGains: string[];
  productsAndServices: string[];
  painRelievers: string[];
  gainCreators: string[];
}

const defaultVPC: VPCData = {
  customerJobs: [],
  customerPains: [],
  customerGains: [],
  productsAndServices: [],
  painRelievers: [],
  gainCreators: []
};

const vpcSteps = [
  {
    id: 'customerJobs',
    title: 'Customer Jobs',
    icon: List,
    description: 'What jobs is your customer trying to get done?',
    guidance: 'Start by understanding what your customers are trying to accomplish. What functional, emotional, or social jobs are they hiring your product to do?',
    examples: ['Manage team communications', 'Track project progress', 'Reduce manual data entry', 'Stay connected with family'],
    why: 'Customer jobs are the foundation of value creation. Everything you build should help customers get these jobs done better.',
    side: 'Customer Profile',
    sideColor: 'blue'
  },
  {
    id: 'customerPains',
    title: 'Customer Pains',
    icon: Frown,
    description: 'What pains do customers experience?',
    guidance: 'Identify the frustrations, obstacles, and risks customers face when trying to get their jobs done.',
    examples: ['Too many tools to manage', 'Slow response times', 'Confusing interfaces', 'High costs'],
    why: 'Understanding pains helps you prioritize which problems to solve and how to position your solution.',
    side: 'Customer Profile',
    sideColor: 'blue'
  },
  {
    id: 'customerGains',
    title: 'Customer Gains',
    icon: Smile,
    description: 'What gains do customers want to achieve?',
    guidance: 'Define the outcomes, benefits, and positive experiences customers want when getting their jobs done.',
    examples: ['Save 2 hours per day', 'Increase team productivity', 'Better work-life balance', 'Cost savings'],
    why: 'Gains represent the value customers seek. Your solution should deliver these desired outcomes.',
    side: 'Customer Profile',
    sideColor: 'blue'
  },
  {
    id: 'productsAndServices',
    title: 'Products & Services',
    icon: Gift,
    description: 'What products and services do you offer?',
    guidance: 'List all the products, services, and features you provide to help customers get their jobs done.',
    examples: ['Project management software', 'Mobile app', 'Customer support', 'Training programs'],
    why: 'Your offerings are the building blocks of your value proposition. They should directly address customer jobs.',
    side: 'Value Map',
    sideColor: 'green'
  },
  {
    id: 'painRelievers',
    title: 'Pain Relievers',
    icon: Pill,
    description: 'How do you relieve customer pains?',
    guidance: 'Describe how your products and services eliminate or reduce the pains customers experience.',
    examples: ['Single dashboard for all tools', 'Real-time notifications', 'Intuitive user interface', 'Transparent pricing'],
    why: 'Pain relievers show how you solve customer problems. They should directly address the pains you identified.',
    side: 'Value Map',
    sideColor: 'green'
  },
  {
    id: 'gainCreators',
    title: 'Gain Creators',
    icon: TrendingUp,
    description: 'How do you create customer gains?',
    guidance: 'Explain how your products and services create the gains customers want to achieve.',
    examples: ['Automated workflows save time', 'Analytics improve decision making', 'Mobile access increases flexibility', 'Integration reduces costs'],
    why: 'Gain creators demonstrate the positive value you deliver. They should directly produce the gains customers desire.',
    side: 'Value Map',
    sideColor: 'green'
  }
];

export default function GuidedValuePropositionCanvas({ 
  canvasId, 
  clientId, 
  initialData, 
  onSave, 
  readOnly = false 
}: GuidedValuePropositionCanvasProps) {
  const [canvasData, setCanvasData] = useState<VPCData>(defaultVPC);
  const [currentStep, setCurrentStep] = useState(0);
  const [newItem, setNewItem] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCanvasData({ ...defaultVPC, ...initialData });
    } else if (canvasId) {
      const saved = localStorage.getItem(`guided-vpc-${canvasId}`);
      if (saved) {
        try {
          setCanvasData({ ...defaultVPC, ...JSON.parse(saved) });
        } catch (error) {
          console.error('Error parsing saved canvas data:', error);
        }
      }
    }
  }, [initialData, canvasId]);

  const currentStepData = vpcSteps[currentStep];
  const currentItems = canvasData[currentStepData.id as keyof VPCData];
  const progress = ((currentStep + 1) / vpcSteps.length) * 100;

  const addItem = () => {
    if (!newItem.trim()) return;
    
    setCanvasData(prev => ({
      ...prev,
      [currentStepData.id]: [...prev[currentStepData.id as keyof VPCData], newItem.trim()]
    }));
    
    setNewItem('');
    setShowAddDialog(false);
  };

  const removeItem = (index: number) => {
    setCanvasData(prev => ({
      ...prev,
      [currentStepData.id]: prev[currentStepData.id as keyof VPCData].filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(canvasData);
    } else if (canvasId) {
      localStorage.setItem(`guided-vpc-${canvasId}`, JSON.stringify(canvasData));
    }
  };

  const canGoNext = currentItems.length > 0 || currentStep === vpcSteps.length - 1;
  const canGoPrevious = currentStep > 0;

  const nextStep = () => {
    if (currentStep < vpcSteps.length - 1) {
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
            <h1 className="text-2xl font-bold">Value Proposition Canvas</h1>
            <p className="text-muted-foreground">Step-by-step guided creation</p>
          </div>
          <Badge variant="outline" className="text-sm">
            Step {currentStep + 1} of {vpcSteps.length}
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
          {/* Side Badge and Guidance Section */}
          <div className={`bg-${currentStepData.sideColor}-50 border border-${currentStepData.sideColor}-200 rounded-lg p-4`}>
            <div className="flex items-start gap-2">
              <Lightbulb className={`w-5 h-5 text-${currentStepData.sideColor}-600 mt-0.5 flex-shrink-0`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-medium text-${currentStepData.sideColor}-900`}>
                    {currentStepData.side} - Guidance
                  </h4>
                  <Badge variant="outline" className={`text-xs bg-${currentStepData.sideColor}-100 border-${currentStepData.sideColor}-300`}>
                    {currentStepData.side}
                  </Badge>
                </div>
                <p className={`text-${currentStepData.sideColor}-800 text-sm mb-3`}>{currentStepData.guidance}</p>
                <div className={`text-${currentStepData.sideColor}-700 text-sm`}>
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
                {currentItems.map((item, index) => (
                  <div key={index} className="group relative">
                    <div className="p-3 bg-muted/30 rounded-md text-sm leading-relaxed pr-8">
                      {item}
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
            {currentStep === vpcSteps.length - 1 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-3 text-blue-700">Customer Profile</h4>
              {vpcSteps.filter(step => step.side === 'Customer Profile').map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = canvasData[step.id as keyof VPCData].length > 0;
                const isCurrent = vpcSteps.findIndex(s => s.id === step.id) === currentStep;
                
                return (
                  <div 
                    key={step.id}
                    className={`p-3 rounded-lg border transition-all mb-2 ${
                      isCurrent ? 'border-primary bg-primary/5' : 
                      isCompleted ? 'border-blue-200 bg-blue-50' : 
                      'border-muted bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StepIcon className={`w-4 h-4 ${
                        isCurrent ? 'text-primary' : 
                        isCompleted ? 'text-blue-600' : 
                        'text-muted-foreground'
                      }`} />
                      <span className="text-sm font-medium">{step.title}</span>
                      {isCompleted && <CheckCircle className="w-3 h-3 text-blue-600 ml-auto" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                );
              })}
            </div>
            
            <div>
              <h4 className="font-medium mb-3 text-green-700">Value Map</h4>
              {vpcSteps.filter(step => step.side === 'Value Map').map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = canvasData[step.id as keyof VPCData].length > 0;
                const isCurrent = vpcSteps.findIndex(s => s.id === step.id) === currentStep;
                
                return (
                  <div 
                    key={step.id}
                    className={`p-3 rounded-lg border transition-all mb-2 ${
                      isCurrent ? 'border-primary bg-primary/5' : 
                      isCompleted ? 'border-green-200 bg-green-50' : 
                      'border-muted bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StepIcon className={`w-4 h-4 ${
                        isCurrent ? 'text-primary' : 
                        isCompleted ? 'text-green-600' : 
                        'text-muted-foreground'
                      }`} />
                      <span className="text-sm font-medium">{step.title}</span>
                      {isCompleted && <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                );
              })}
            </div>
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
}
