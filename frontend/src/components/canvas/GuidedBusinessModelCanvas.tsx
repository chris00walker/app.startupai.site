/**
 * @story US-CP03
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, CheckCircle, Users, Target, Truck, Heart, Coins, Zap, Building2, UserCheck, DollarSign, Cog, Package, Handshake, Calculator, ArrowRight, Lightbulb, TestTube, AlertTriangle, Shield } from 'lucide-react';

interface GuidedBusinessModelCanvasProps {
  canvasId?: string;
  clientId?: string;
  initialData?: any;
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

interface BMCItem {
  id: string;
  text: string;
  assumptions: string[];
  validationStatus: 'untested' | 'testing' | 'validated' | 'failed';
  confidence: number;
  experiments: string[];
}

interface BMCData {
  customerSegments: BMCItem[];
  valuePropositions: BMCItem[];
  channels: BMCItem[];
  customerRelationships: BMCItem[];
  revenueStreams: BMCItem[];
  keyActivities: BMCItem[];
  keyResources: BMCItem[];
  keyPartners: BMCItem[];
  costStructure: BMCItem[];
}

const defaultBMC: BMCData = {
  customerSegments: [],
  valuePropositions: [],
  channels: [],
  customerRelationships: [],
  revenueStreams: [],
  keyActivities: [],
  keyResources: [],
  keyPartners: [],
  costStructure: []
};

const bmcSteps = [
  {
    id: 'valuePropositions',
    title: 'Value Propositions',
    icon: Target,
    description: 'What value do you deliver to customers?',
    guidance: 'Start with your core value proposition. What unique value do you provide? What problems do you solve or needs do you fulfill?',
    examples: ['Save 50% time on reporting', 'Reduce operational costs by 30%', 'Improve customer satisfaction', 'Simplify complex processes'],
    why: 'Your value proposition is the heart of your business model. Everything else is designed to create, deliver, and capture this value.',
    phase: 'Value Proposition',
    phaseColor: 'purple'
  },
  {
    id: 'customerSegments',
    title: 'Customer Segments',
    icon: Users,
    description: 'Who are you creating value for?',
    guidance: 'Now identify your target customers. Who are the most important people or organizations that will value your proposition?',
    examples: ['Small business owners', 'Enterprise IT managers', 'Healthcare professionals', 'Students and educators'],
    why: 'Understanding your customers helps you refine your value proposition and design the right delivery mechanisms.',
    phase: 'Value Capture',
    phaseColor: 'orange'
  },
  {
    id: 'channels',
    title: 'Channels',
    icon: Truck,
    description: 'How do you reach and deliver to customers?',
    guidance: 'Identify how you will communicate with, reach, and deliver value to your customer segments.',
    examples: ['Direct sales team', 'Online platform', 'Partner networks', 'Mobile app', 'Retail stores'],
    why: 'Channels connect your value proposition to your customers. The right channels ensure efficient delivery and customer experience.',
    phase: 'Value Proposition',
    phaseColor: 'purple'
  },
  {
    id: 'customerRelationships',
    title: 'Customer Relationships',
    icon: Heart,
    description: 'What relationship do you establish with customers?',
    guidance: 'Define the type of relationship you want to establish with each customer segment.',
    examples: ['Personal assistance', 'Self-service', 'Automated services', 'Communities', 'Co-creation'],
    why: 'Customer relationships determine how you acquire, retain, and grow your customer base.',
    phase: 'Value Proposition',
    phaseColor: 'purple'
  },
  {
    id: 'revenueStreams',
    title: 'Revenue Streams',
    icon: Coins,
    description: 'How do you generate revenue from customers?',
    guidance: 'Identify how you will generate revenue from each customer segment.',
    examples: ['Subscription fees', 'One-time sales', 'Usage fees', 'Licensing', 'Advertising', 'Commission'],
    why: 'Revenue streams are the cash your company generates from each customer segment. This determines your financial viability.',
    phase: 'Value Capture',
    phaseColor: 'orange'
  },
  {
    id: 'keyActivities',
    title: 'Key Activities',
    icon: Zap,
    description: 'What key activities does your value proposition require?',
    guidance: 'List the most important activities your company must perform to make your business model work.',
    examples: ['Software development', 'Marketing campaigns', 'Customer support', 'Quality assurance', 'Supply chain management'],
    why: 'Key activities are the critical actions needed to deliver your value proposition and operate successfully.',
    phase: 'Value Creation',
    phaseColor: 'blue'
  },
  {
    id: 'keyResources',
    title: 'Key Resources',
    icon: Building2,
    description: 'What key resources does your value proposition require?',
    guidance: 'Identify the most important assets required to make your business model work.',
    examples: ['Technology platform', 'Skilled team', 'Brand reputation', 'Patents', 'Customer data', 'Physical facilities'],
    why: 'Key resources are the assets that enable you to create and deliver value, reach markets, and generate revenue.',
    phase: 'Value Creation',
    phaseColor: 'blue'
  },
  {
    id: 'keyPartners',
    title: 'Key Partners',
    icon: UserCheck,
    description: 'Who are your key partners and suppliers?',
    guidance: 'Identify the network of suppliers and partners that help your business model work.',
    examples: ['Technology vendors', 'Distribution partners', 'Strategic alliances', 'Suppliers', 'Joint ventures'],
    why: 'Key partnerships help you optimize your business model, reduce risk, and acquire resources you don\'t own.',
    phase: 'Value Creation',
    phaseColor: 'blue'
  },
  {
    id: 'costStructure',
    title: 'Cost Structure',
    icon: DollarSign,
    description: 'What are the most important costs in your business model?',
    guidance: 'Identify all the important costs incurred while operating your business model.',
    examples: ['Personnel costs', 'Technology infrastructure', 'Marketing expenses', 'Office rent', 'Research & development'],
    why: 'Understanding your cost structure helps ensure profitability and guides pricing decisions.',
    phase: 'Value Creation',
    phaseColor: 'blue'
  }
];

export default function GuidedBusinessModelCanvas({ 
  canvasId, 
  initialData, 
  onSave, 
  readOnly = false 
}: GuidedBusinessModelCanvasProps) {
  const [canvasData, setCanvasData] = useState<BMCData>(defaultBMC);
  const [currentStep, setCurrentStep] = useState(0);
  const [newItem, setNewItem] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCanvasData({ ...defaultBMC, ...initialData });
    } else if (canvasId) {
      const saved = localStorage.getItem(`guided-bmc-${canvasId}`);
      if (saved) {
        try {
          setCanvasData({ ...defaultBMC, ...JSON.parse(saved) });
        } catch (error) {
          console.error('Error parsing saved canvas data:', error);
        }
      }
    }
  }, [initialData, canvasId]);

  const currentStepData = bmcSteps[currentStep];
  const currentItems = canvasData[currentStepData.id as keyof BMCData];
  const progress = ((currentStep + 1) / bmcSteps.length) * 100;
  const completedSteps = bmcSteps.slice(0, currentStep).filter(step => 
    canvasData[step.id as keyof BMCData].length > 0
  ).length;

  const addItem = () => {
    if (!newItem.trim()) return;
    
    const newBMCItem: BMCItem = {
      id: Date.now().toString(),
      text: newItem.trim(),
      assumptions: generateAssumptions(currentStepData.id, newItem.trim()),
      validationStatus: 'untested',
      confidence: 0,
      experiments: []
    };
    
    setCanvasData(prev => ({
      ...prev,
      [currentStepData.id]: [...prev[currentStepData.id as keyof BMCData], newBMCItem]
    }));
    
    setNewItem('');
    setShowAddDialog(false);
  };

  const generateAssumptions = (stepId: string, text: string): string[] => {
    const assumptionMap: Record<string, string[]> = {
      valuePropositions: [
        `Customers will pay for "${text}"`,
        `"${text}" solves a real customer problem`,
        `Customers prefer this over alternatives`
      ],
      customerSegments: [
        `"${text}" has the budget to pay`,
        `"${text}" experiences the problem we solve`,
        `We can effectively reach "${text}"`
      ],
      channels: [
        `"${text}" is cost-effective for customer acquisition`,
        `Customers prefer to buy through "${text}"`,
        `"${text}" can scale with our growth`
      ],
      revenueStreams: [
        `Customers will pay "${text}" pricing model`,
        `"${text}" generates sufficient profit margins`,
        `Payment timing for "${text}" works for cash flow`
      ]
    };
    
    return assumptionMap[stepId] || [`"${text}" will work as expected`];
  };

  const removeItem = (index: number) => {
    setCanvasData(prev => ({
      ...prev,
      [currentStepData.id]: prev[currentStepData.id as keyof BMCData].filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(canvasData);
    } else if (canvasId) {
      localStorage.setItem(`guided-bmc-${canvasId}`, JSON.stringify(canvasData));
    }
  };

  const canGoNext = currentItems.length > 0 || currentStep === bmcSteps.length - 1;
  const canGoPrevious = currentStep > 0;

  const nextStep = () => {
    if (currentStep < bmcSteps.length - 1) {
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
            <h1 className="text-2xl font-bold">Business Model Canvas</h1>
            <p className="text-muted-foreground">Step-by-step guided creation</p>
          </div>
          <Badge variant="outline" className="text-sm">
            Step {currentStep + 1} of {bmcSteps.length}
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
          {/* Phase Badge and Guidance Section */}
          <div className={`bg-${currentStepData.phaseColor}-50 border border-${currentStepData.phaseColor}-200 rounded-lg p-4`}>
            <div className="flex items-start gap-2">
              <Lightbulb className={`w-5 h-5 text-${currentStepData.phaseColor}-600 mt-0.5 flex-shrink-0`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-medium text-${currentStepData.phaseColor}-900`}>
                    {currentStepData.phase} - Guidance
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
              <div className="space-y-3">
                {currentItems.map((item, index) => (
                  <div key={item.id || index} className="group relative">
                    <div className="p-4 bg-muted/30 rounded-md border-l-4 border-l-gray-300">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 text-sm leading-relaxed pr-8">
                          {item.text}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              item.validationStatus === 'validated' ? 'default' :
                              item.validationStatus === 'testing' ? 'secondary' :
                              item.validationStatus === 'failed' ? 'destructive' : 'outline'
                            }
                            className="text-xs"
                          >
                            {item.validationStatus === 'untested' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {item.validationStatus === 'testing' && <TestTube className="w-3 h-3 mr-1" />}
                            {item.validationStatus === 'validated' && <Shield className="w-3 h-3 mr-1" />}
                            {item.validationStatus === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {item.validationStatus}
                          </Badge>
                          {!readOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {item.assumptions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-muted">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs font-medium text-muted-foreground">Key Assumptions</h5>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-6 text-xs"
                              onClick={() => {/* TODO: Open experiment creation */}}
                            >
                              <TestTube className="w-3 h-3 mr-1" />
                              Test
                            </Button>
                          </div>
                          <ul className="space-y-1">
                            {item.assumptions.map((assumption, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                {assumption}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
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
            {currentStep === bmcSteps.length - 1 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bmcSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = canvasData[step.id as keyof BMCData].length > 0;
              const isCurrent = index === currentStep;
              
              return (
                <div 
                  key={step.id}
                  className={`p-3 rounded-lg border transition-all ${
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
