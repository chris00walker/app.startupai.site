/**
 * @story US-F13
 */
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  CalendarIcon,
  FileText,
  Users,
  Beaker,
  BarChart,
  Search,
  AlertTriangle,
  Target,
  Wrench,
  DollarSign,
} from 'lucide-react'

export type EvidenceCategory = 'Survey' | 'Interview' | 'Experiment' | 'Analytics' | 'Research'
export type EvidenceStrength = 'weak' | 'medium' | 'strong'
export type FitType = 'Desirability' | 'Feasibility' | 'Viability'

export interface EvidenceFormData {
  title: string
  category: EvidenceCategory
  summary: string
  fullText?: string
  fitType: FitType
  strength: EvidenceStrength
  isContradiction: boolean
  source?: string
  author?: string
  occurredOn?: Date
  linkedAssumptions?: string[]
}

export interface EvidenceInputFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EvidenceFormData) => Promise<void>
  projectId: string
  defaultFitType?: FitType
  linkedAssumptionId?: string
  isSubmitting?: boolean
}

const categoryConfig: Record<EvidenceCategory, { icon: React.ElementType; label: string; description: string }> = {
  Survey: { icon: FileText, label: 'Survey', description: 'Quantitative data from surveys' },
  Interview: { icon: Users, label: 'Interview', description: 'Qualitative insights from conversations' },
  Experiment: { icon: Beaker, label: 'Experiment', description: 'Results from validation tests' },
  Analytics: { icon: BarChart, label: 'Analytics', description: 'Data from analytics tools' },
  Research: { icon: Search, label: 'Research', description: 'Secondary research findings' },
}

const strengthConfig: Record<EvidenceStrength, { label: string; color: string; description: string }> = {
  weak: { label: 'Weak', color: 'bg-yellow-100 text-yellow-800', description: 'Early indicator, verbal only' },
  medium: { label: 'Medium', color: 'bg-orange-100 text-orange-800', description: 'Some behavioral signal' },
  strong: { label: 'Strong', color: 'bg-green-100 text-green-800', description: 'Clear commitment evidence' },
}

const fitTypeConfig: Record<FitType, { icon: React.ElementType; label: string; color: string; description: string }> = {
  Desirability: { icon: Target, label: 'Desirability', color: 'bg-pink-100 text-pink-800 border-pink-300', description: 'Do customers want this?' },
  Feasibility: { icon: Wrench, label: 'Feasibility', color: 'bg-blue-100 text-blue-800 border-blue-300', description: 'Can we build it?' },
  Viability: { icon: DollarSign, label: 'Viability', color: 'bg-green-100 text-green-800 border-green-300', description: 'Is it profitable?' },
}

const defaultFormData: EvidenceFormData = {
  title: '',
  category: 'Interview',
  summary: '',
  fullText: '',
  fitType: 'Desirability',
  strength: 'medium',
  isContradiction: false,
  source: '',
  author: '',
  occurredOn: undefined,
  linkedAssumptions: [],
}

export function EvidenceInputForm({
  open,
  onOpenChange,
  onSubmit,
  projectId,
  defaultFitType,
  linkedAssumptionId,
  isSubmitting = false,
}: EvidenceInputFormProps) {
  const [formData, setFormData] = useState<EvidenceFormData>({
    ...defaultFormData,
    fitType: defaultFitType || 'Desirability',
    linkedAssumptions: linkedAssumptionId ? [linkedAssumptionId] : [],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof EvidenceFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EvidenceFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title should be at least 5 characters'
    }

    if (!formData.summary.trim()) {
      newErrors.summary = 'Summary is required'
    } else if (formData.summary.length < 20) {
      newErrors.summary = 'Summary should be at least 20 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (validate()) {
      await onSubmit(formData)
      // Reset form on success
      setFormData({
        ...defaultFormData,
        fitType: defaultFitType || 'Desirability',
      })
    }
  }

  const updateField = <K extends keyof EvidenceFormData>(
    field: K,
    value: EvidenceFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Evidence</DialogTitle>
          <DialogDescription>
            Record evidence from your validation activities. Categorize by D-F-V to track signal strength.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Fit Type Selection - Highlighted */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              Evidence Type (D-F-V) <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(fitTypeConfig) as [FitType, typeof fitTypeConfig[FitType]][]).map(([type, config]) => {
                const Icon = config.icon
                const isSelected = formData.fitType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField('fitType', type)}
                    className={cn(
                      'p-3 rounded-lg border-2 text-left transition-all',
                      isSelected
                        ? `${config.color} border-current`
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{config.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Brief title for this evidence..."
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Evidence Category</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(categoryConfig) as [EvidenceCategory, typeof categoryConfig[EvidenceCategory]][]).map(([cat, config]) => {
                const Icon = config.icon
                return (
                  <Button
                    key={cat}
                    type="button"
                    variant={formData.category === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateField('category', cat)}
                    className="gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary" className="flex items-center gap-2">
              Summary <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="summary"
              placeholder="Summarize what this evidence tells us..."
              value={formData.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              className={cn('min-h-24', errors.summary ? 'border-red-500' : '')}
            />
            {errors.summary && (
              <p className="text-xs text-red-500">{errors.summary}</p>
            )}
          </div>

          {/* Full Text (optional) */}
          <div className="space-y-2">
            <Label htmlFor="fullText">Full Text (optional)</Label>
            <Textarea
              id="fullText"
              placeholder="Full transcript, notes, or detailed findings..."
              value={formData.fullText}
              onChange={(e) => updateField('fullText', e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Evidence Strength */}
          <div className="space-y-3">
            <Label>Evidence Strength</Label>
            <RadioGroup
              value={formData.strength}
              onValueChange={(value: EvidenceStrength) => updateField('strength', value)}
              className="flex gap-4"
            >
              {(Object.entries(strengthConfig) as [EvidenceStrength, typeof strengthConfig[EvidenceStrength]][]).map(([strength, config]) => (
                <div key={strength} className="flex items-center space-x-2">
                  <RadioGroupItem value={strength} id={`strength-${strength}`} />
                  <Label htmlFor={`strength-${strength}`} className="cursor-pointer">
                    <Badge className={config.color}>{config.label}</Badge>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {strengthConfig[formData.strength].description}
            </p>
          </div>

          {/* Contradiction Flag */}
          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-yellow-50 border-yellow-200">
            <Checkbox
              id="isContradiction"
              checked={formData.isContradiction}
              onCheckedChange={(checked) => updateField('isContradiction', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="isContradiction" className="flex items-center gap-2 cursor-pointer">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                This evidence contradicts other findings
              </Label>
              <p className="text-xs text-muted-foreground ml-6">
                Flag if this conflicts with existing evidence
              </p>
            </div>
          </div>

          {/* Metadata */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Source Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    placeholder="e.g., Customer Interview, Survey"
                    value={formData.source}
                    onChange={(e) => updateField('source', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author/Collector</Label>
                  <Input
                    id="author"
                    placeholder="Who collected this evidence?"
                    value={formData.author}
                    onChange={(e) => updateField('author', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date Collected</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.occurredOn && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.occurredOn ? format(formData.occurredOn, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.occurredOn}
                      onSelect={(date) => updateField('occurredOn', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Add Evidence'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EvidenceInputForm
