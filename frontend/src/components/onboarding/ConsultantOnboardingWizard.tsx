/**
 * ConsultantOnboardingWizard - Consultant-specific onboarding flow
 *
 * Gathers consultant practice information and integrates with CrewAI
 * for workspace configuration and recommendations.
 *
 * Based on Phase 3: Consultant Features
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  Briefcase,
  Target,
  Wrench,
  Lightbulb,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ConsultantOnboardingProps {
  userId: string;
  userEmail: string;
}

interface ConsultantData {
  companyName: string;
  practiceSize: 'solo' | '2-10' | '11-50' | '51+' | '';
  currentClients: number;
  industries: string[];
  services: string[];
  toolsUsed: string[];
  painPoints: string;
  whiteLabelInterest: boolean;
}

const INDUSTRY_OPTIONS = [
  'SaaS',
  'E-commerce',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Other'
];

const SERVICE_OPTIONS = [
  'Strategy Consulting',
  'Product Development',
  'Marketing & Growth',
  'Business Model Design',
  'Digital Transformation',
  'Innovation Consulting',
  'Other'
];

const TOOL_OPTIONS = [
  'Notion',
  'Miro',
  'Figma',
  'Google Workspace',
  'Microsoft Office',
  'Trello / Asana',
  'Slack / Teams',
  'Other'
];

// ============================================================================
// Main ConsultantOnboardingWizard Component
// ============================================================================

export function ConsultantOnboardingWizard({ userId, userEmail }: ConsultantOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ConsultantData>({
    companyName: '',
    practiceSize: '',
    currentClients: 0,
    industries: [],
    services: [],
    toolsUsed: [],
    painPoints: '',
    whiteLabelInterest: false,
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Update form field
  const updateField = useCallback((field: keyof ConsultantData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Toggle array item
  const toggleArrayItem = useCallback((field: 'industries' | 'services' | 'toolsUsed', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  }, []);

  // Navigation
  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Validate current step
  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case 1:
        return formData.companyName.trim().length > 0;
      case 2:
        return formData.practiceSize !== '';
      case 3:
        return formData.industries.length > 0;
      case 4:
        return formData.services.length > 0;
      case 5:
        return formData.painPoints.trim().length > 0;
      default:
        return false;
    }
  }, [currentStep, formData]);

  // Submit onboarding data
  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);

    try {
      // Save consultant profile to database
      const response = await fetch('/api/consultant/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          profile: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save consultant profile');
      }

      const result = await response.json();

      toast.success('Welcome! Your consultant profile has been created.');

      // Redirect to consultant dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('[ConsultantOnboarding] Error:', error);
      toast.error(`Failed to complete onboarding: ${error.message}`);
      setIsSubmitting(false);
    }
  }, [userId, formData, router]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Your Practice</CardTitle>
                  <CardDescription>Tell us about your consulting practice</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  What's your consulting firm or agency name?
                </Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Acme Strategy Consulting"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentClients">
                  How many active clients do you currently serve?
                </Label>
                <Input
                  id="currentClients"
                  type="number"
                  min="0"
                  placeholder="e.g., 5"
                  value={formData.currentClients || ''}
                  onChange={(e) => updateField('currentClients', parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Practice Size</CardTitle>
                  <CardDescription>How big is your team?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.practiceSize}
                onValueChange={(value) => updateField('practiceSize', value as ConsultantData['practiceSize'])}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="solo" id="solo" />
                    <Label htmlFor="solo" className="cursor-pointer flex-1">
                      Solo Consultant
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="2-10" id="2-10" />
                    <Label htmlFor="2-10" className="cursor-pointer flex-1">
                      2-10 people
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="11-50" id="11-50" />
                    <Label htmlFor="11-50" className="cursor-pointer flex-1">
                      11-50 people
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="51+" id="51+" />
                    <Label htmlFor="51+" className="cursor-pointer flex-1">
                      51+ people
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Industries You Serve</CardTitle>
                  <CardDescription>Select all that apply</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRY_OPTIONS.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-accent">
                    <Checkbox
                      id={`industry-${industry}`}
                      checked={formData.industries.includes(industry)}
                      onCheckedChange={() => toggleArrayItem('industries', industry)}
                    />
                    <Label htmlFor={`industry-${industry}`} className="cursor-pointer flex-1">
                      {industry}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Services You Offer</CardTitle>
                  <CardDescription>Select all that apply</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {SERVICE_OPTIONS.map((service) => (
                  <div key={service} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                    <Checkbox
                      id={`service-${service}`}
                      checked={formData.services.includes(service)}
                      onCheckedChange={() => toggleArrayItem('services', service)}
                    />
                    <Label htmlFor={`service-${service}`} className="cursor-pointer flex-1">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Label>Tools you currently use (optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <div key={tool} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-accent text-sm">
                      <Checkbox
                        id={`tool-${tool}`}
                        checked={formData.toolsUsed.includes(tool)}
                        onCheckedChange={() => toggleArrayItem('toolsUsed', tool)}
                      />
                      <Label htmlFor={`tool-${tool}`} className="cursor-pointer flex-1 text-xs">
                        {tool}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Your Goals</CardTitle>
                  <CardDescription>Help us understand how we can help you succeed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="painPoints">
                  What's your biggest challenge in serving clients?
                </Label>
                <Textarea
                  id="painPoints"
                  placeholder="e.g., Time-consuming manual processes, scaling my practice, delivering consistent quality..."
                  value={formData.painPoints}
                  onChange={(e) => updateField('painPoints', e.target.value)}
                  rows={4}
                  autoFocus
                />
              </div>
              <div className="flex items-start space-x-2 p-4 border rounded-lg bg-primary/5">
                <Checkbox
                  id="whiteLabelInterest"
                  checked={formData.whiteLabelInterest}
                  onCheckedChange={(checked) => updateField('whiteLabelInterest', checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="whiteLabelInterest" className="cursor-pointer flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>I'm interested in white-labeling this platform for my clients</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    White-label features allow you to brand the platform as your own
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to StartupAI</h1>
          <p className="text-muted-foreground">
            Let's set up your consultant workspace
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={goToNextStep}
              disabled={!isStepValid() || isSubmitting}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!isStepValid() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Completing...
                </>
              ) : (
                <>
                  Complete Setup
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
