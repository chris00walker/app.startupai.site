// IntakeForm UI component for client data collection
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface IntakeData {
  name: string;
  email: string;
  projectDescription: string;
}

export const IntakeForm: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<IntakeData>>({});

  const mutation = useMutation({
    mutationFn: (payload: IntakeData) =>
      api.post(`/clients/${clientId}/discovery`, payload),
    onSuccess: () => alert('Discovery workflow triggered'),
    onError: () => alert('Failed to trigger workflow'),
  });

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => s - 1);

  const steps = [
    {
      title: 'Personal Information',
      description: 'Tell us about yourself',
    },
    {
      title: 'Contact Details',
      description: 'How can we reach you?',
    },
    {
      title: 'Project Overview',
      description: 'Describe your project needs',
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{steps[step].title}</CardTitle>
        <CardDescription>{steps[step].description}</CardDescription>
        <div className="flex space-x-2 mt-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full ${
                index <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 0 && (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              data-testid="name-input"
              placeholder="Enter your full name"
              value={data.name || ''}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </div>
        )}
        
        {step === 1 && (
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              data-testid="email-input"
              placeholder="Enter your email address"
              value={data.email || ''}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-2">
            <Label htmlFor="project">Project Description</Label>
            <Input
              id="project"
              data-testid="project-input"
              placeholder="Describe your project requirements"
              value={data.projectDescription || ''}
              onChange={(e) =>
                setData({ ...data, projectDescription: e.target.value })
              }
            />
          </div>
        )}

        <div className="flex justify-between pt-4">
          {step > 0 && (
            <Button variant="outline" onClick={prev}>
              Back
            </Button>
          )}
          <div className="ml-auto">
            {step < 2 ? (
              <Button onClick={next} disabled={
                (step === 0 && !data.name) ||
                (step === 1 && !data.email)
              }>
                Next
              </Button>
            ) : (
              <Button
                onClick={() => mutation.mutate(data as IntakeData)}
                disabled={!data.name || !data.email || !data.projectDescription || mutation.isPending}
              >
                {mutation.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
