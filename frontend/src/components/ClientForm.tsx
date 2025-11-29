import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface ClientFormData {
  name: string;
  email: string;
  company: string;
  industry: string;
  description: string;
  businessModel: string;
  targetMarket: string;
  currentChallenges: string[];
  goals: string[];
  budget: number | '';
  timeline: string;
  assignedConsultant: string;
}

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ClientFormData>;
  isLoading?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    company: '',
    industry: '',
    description: '',
    businessModel: '',
    targetMarket: '',
    currentChallenges: [],
    goals: [],
    budget: '',
    timeline: '',
    assignedConsultant: '',
    ...initialData
  });

  const [challengeInput, setChallengeInput] = useState('');
  const [goalInput, setGoalInput] = useState('');

  const handleInputChange = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addChallenge = () => {
    if (challengeInput.trim()) {
      setFormData(prev => ({
        ...prev,
        currentChallenges: [...prev.currentChallenges, challengeInput.trim()]
      }));
      setChallengeInput('');
    }
  };

  const removeChallenge = (index: number) => {
    setFormData(prev => ({
      ...prev,
      currentChallenges: prev.currentChallenges.filter((_, i) => i !== index)
    }));
  };

  const addGoal = () => {
    if (goalInput.trim()) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, goalInput.trim()]
      }));
      setGoalInput('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
        <CardDescription>
          Enter comprehensive client details for strategic analysis and planning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client-name" className="block text-sm font-medium mb-2">Contact Name *</label>
              <Input
                id="client-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Smith"
                required
              />
            </div>
            <div>
              <label htmlFor="client-email" className="block text-sm font-medium mb-2">Email *</label>
              <Input
                id="client-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@company.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client-company" className="block text-sm font-medium mb-2">Company *</label>
              <Input
                id="client-company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Acme Corporation"
                required
              />
            </div>
            <div>
              <label htmlFor="client-industry" className="block text-sm font-medium mb-2">Industry *</label>
              <select
                id="client-industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Energy">Energy</option>
                <option value="Transportation">Transportation</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Business Details */}
          <div>
            <label htmlFor="client-description" className="block text-sm font-medium mb-2">Company Description</label>
            <textarea
              id="client-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the company and its main activities..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client-business-model" className="block text-sm font-medium mb-2">Business Model</label>
              <Input
                id="client-business-model"
                value={formData.businessModel}
                onChange={(e) => handleInputChange('businessModel', e.target.value)}
                placeholder="B2B SaaS, B2C Retail, etc."
              />
            </div>
            <div>
              <label htmlFor="client-target-market" className="block text-sm font-medium mb-2">Target Market</label>
              <Input
                id="client-target-market"
                value={formData.targetMarket}
                onChange={(e) => handleInputChange('targetMarket', e.target.value)}
                placeholder="SMBs, Enterprise, Consumers, etc."
              />
            </div>
          </div>

          {/* Challenges */}
          <div>
            <label htmlFor="client-challenge-input" className="block text-sm font-medium mb-2">Current Challenges</label>
            <div className="flex gap-2 mb-2">
              <Input
                id="client-challenge-input"
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
                placeholder="Enter a challenge..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChallenge())}
                aria-describedby="challenges-list"
              />
              <Button type="button" onClick={addChallenge} variant="outline" aria-label="Add challenge">
                Add
              </Button>
            </div>
            <div id="challenges-list" className="flex flex-wrap gap-2" role="list" aria-label="Added challenges">
              {formData.currentChallenges.map((challenge, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeChallenge(index)}
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && removeChallenge(index)}
                  aria-label={`Remove challenge: ${challenge}`}
                >
                  {challenge} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <label htmlFor="client-goal-input" className="block text-sm font-medium mb-2">Goals & Objectives</label>
            <div className="flex gap-2 mb-2">
              <Input
                id="client-goal-input"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Enter a goal..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                aria-describedby="goals-list"
              />
              <Button type="button" onClick={addGoal} variant="outline" aria-label="Add goal">
                Add
              </Button>
            </div>
            <div id="goals-list" className="flex flex-wrap gap-2" role="list" aria-label="Added goals">
              {formData.goals.map((goal, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeGoal(index)}
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && removeGoal(index)}
                  aria-label={`Remove goal: ${goal}`}
                >
                  {goal} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="client-budget" className="block text-sm font-medium mb-2">Budget ($)</label>
              <Input
                id="client-budget"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="100000"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="client-timeline" className="block text-sm font-medium mb-2">Timeline</label>
              <Input
                id="client-timeline"
                value={formData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                placeholder="6 months, 1 year, etc."
              />
            </div>
            <div>
              <label htmlFor="client-consultant" className="block text-sm font-medium mb-2">Assigned Consultant</label>
              <Input
                id="client-consultant"
                value={formData.assignedConsultant}
                onChange={(e) => handleInputChange('assignedConsultant', e.target.value)}
                placeholder="Consultant name"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
