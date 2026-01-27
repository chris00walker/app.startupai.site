"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  type ExperimentMethod,
  type ExpectedOutcome,
  type EvidenceLevel,
  type Assumption,
  experimentMethodConfig,
  outcomeConfig,
  evidenceLevelConfig
} from './types'

export interface ExperimentCardFormData {
  hypothesis: string
  testMethod: ExperimentMethod
  metric: string
  successCriteria: string
  expectedOutcome: ExpectedOutcome
  costTime: string
  costMoney: number | null
  evidenceStrength: EvidenceLevel
  assumptionId: string | null
}

interface ExperimentCardFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ExperimentCardFormData) => void
  initialData?: Partial<ExperimentCardFormData>
  assumptions?: Assumption[]
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
}

const defaultFormData: ExperimentCardFormData = {
  hypothesis: '',
  testMethod: 'interview',
  metric: '',
  successCriteria: '',
  expectedOutcome: 'iterate',
  costTime: '',
  costMoney: null,
  evidenceStrength: 'medium',
  assumptionId: null
}

export function ExperimentCardForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  assumptions = [],
  isSubmitting = false,
  mode = 'create'
}: ExperimentCardFormProps) {
  const [formData, setFormData] = useState<ExperimentCardFormData>({
    ...defaultFormData,
    ...initialData
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ExperimentCardFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ExperimentCardFormData, string>> = {}

    if (!formData.hypothesis.trim()) {
      newErrors.hypothesis = 'Hypothesis is required'
    } else if (formData.hypothesis.length < 20) {
      newErrors.hypothesis = 'Hypothesis should be more specific (at least 20 characters)'
    }

    if (!formData.metric.trim()) {
      newErrors.metric = 'Metric is required - what will you measure?'
    }

    if (!formData.successCriteria.trim()) {
      newErrors.successCriteria = 'Success criteria is required - how will you know if it passed?'
    }

    if (!formData.costTime.trim()) {
      newErrors.costTime = 'Time estimate is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData)
    }
  }

  const updateField = <K extends keyof ExperimentCardFormData>(
    field: K,
    value: ExperimentCardFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Auto-suggest evidence strength based on test method
  const handleMethodChange = (method: ExperimentMethod) => {
    updateField('testMethod', method)
    const methodConfig = experimentMethodConfig[method]
    const suggestedStrength = (methodConfig?.evidenceStrength || 'weak') as EvidenceLevel
    updateField('evidenceStrength', suggestedStrength)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Experiment Card' : 'Edit Experiment Card'}
          </DialogTitle>
          <DialogDescription>
            Design a test to validate your assumption using the Strategyzer format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Link to Assumption (optional) */}
          {assumptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="assumptionId">Link to Assumption (optional)</Label>
              <Select
                value={formData.assumptionId || 'none'}
                onValueChange={(value) => updateField('assumptionId', value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an assumption to test" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked assumption</SelectItem>
                  {assumptions.map(assumption => (
                    <SelectItem key={assumption.id} value={assumption.id}>
                      {assumption.statement.substring(0, 60)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Linking helps track which assumptions are being tested
              </p>
            </div>
          )}

          {/* Hypothesis */}
          <div className="space-y-2">
            <Label htmlFor="hypothesis" className="flex items-center gap-2">
              Hypothesis <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="hypothesis"
              placeholder="We believe that [target customer] will [expected behavior] because [reason]..."
              value={formData.hypothesis}
              onChange={(e) => updateField('hypothesis', e.target.value)}
              className={`min-h-24 ${errors.hypothesis ? 'border-red-500' : ''}`}
            />
            {errors.hypothesis && (
              <p className="text-xs text-red-500">{errors.hypothesis}</p>
            )}
          </div>

          {/* Test Method */}
          <div className="space-y-2">
            <Label htmlFor="testMethod">Test Method</Label>
            <Select
              value={formData.testMethod}
              onValueChange={handleMethodChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(experimentMethodConfig).map(([method, config]) => (
                  <SelectItem key={method} value={method}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Metric & Success Criteria - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metric" className="flex items-center gap-2">
                Metric <span className="text-red-500">*</span>
              </Label>
              <Input
                id="metric"
                placeholder="e.g., Conversion rate, NPS score"
                value={formData.metric}
                onChange={(e) => updateField('metric', e.target.value)}
                className={errors.metric ? 'border-red-500' : ''}
              />
              {errors.metric && (
                <p className="text-xs text-red-500">{errors.metric}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="successCriteria" className="flex items-center gap-2">
                Success Criteria <span className="text-red-500">*</span>
              </Label>
              <Input
                id="successCriteria"
                placeholder="e.g., > 3% conversion, NPS > 40"
                value={formData.successCriteria}
                onChange={(e) => updateField('successCriteria', e.target.value)}
                className={errors.successCriteria ? 'border-red-500' : ''}
              />
              {errors.successCriteria && (
                <p className="text-xs text-red-500">{errors.successCriteria}</p>
              )}
            </div>
          </div>

          {/* Expected Outcome */}
          <div className="space-y-3">
            <Label>Expected Outcome if Test Fails</Label>
            <RadioGroup
              value={formData.expectedOutcome}
              onValueChange={(value: ExpectedOutcome) => updateField('expectedOutcome', value)}
              className="flex gap-4"
            >
              {Object.entries(outcomeConfig).map(([outcome, config]) => (
                <div key={outcome} className="flex items-center space-x-2">
                  <RadioGroupItem value={outcome} id={`outcome-${outcome}`} />
                  <Label htmlFor={`outcome-${outcome}`} className="cursor-pointer">
                    <Badge className={config.color}>{config.label}</Badge>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              What action will you take if the test doesn't meet success criteria?
            </p>
          </div>

          {/* Evidence Strength */}
          <div className="space-y-2">
            <Label>Expected Evidence Strength</Label>
            <div className="flex gap-2">
              {Object.entries(evidenceLevelConfig).map(([level, config]) => (
                <Button
                  key={level}
                  type="button"
                  variant={formData.evidenceStrength === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateField('evidenceStrength', level as EvidenceLevel)}
                  className={formData.evidenceStrength === level ? '' : config.color}
                >
                  {config.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on test method: {experimentMethodConfig[formData.testMethod]?.label || formData.testMethod || 'Unknown'}
            </p>
          </div>

          {/* Cost & Time */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costTime" className="flex items-center gap-2">
                    Time Investment <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="costTime"
                    placeholder="e.g., 2 weeks, 3 days"
                    value={formData.costTime}
                    onChange={(e) => updateField('costTime', e.target.value)}
                    className={errors.costTime ? 'border-red-500' : ''}
                  />
                  {errors.costTime && (
                    <p className="text-xs text-red-500">{errors.costTime}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costMoney">Budget ($)</Label>
                  <Input
                    id="costMoney"
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.costMoney ?? ''}
                    onChange={(e) => updateField('costMoney', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Experiment Card' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExperimentCardForm
