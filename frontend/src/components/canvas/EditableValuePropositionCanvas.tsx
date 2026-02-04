/**
 * @story US-CP02
 */
/**
 * Editable Value Proposition Canvas
 *
 * Inline-editable version of the VPC based on EnhancedValuePropositionCanvas design.
 * Supports click-to-edit, add/remove items, and shows source badges (AI vs Manual).
 *
 * Features:
 * - Same canonical Strategyzer VPC layout (purple Value Map, teal Customer Profile)
 * - Click-to-edit on any item
 * - Inline add/remove buttons
 * - Source badges (blue=AI, green=Manual)
 * - Integrates with useVPC hook
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Gift,
  TrendingUp,
  Pill,
  Smile,
  Frown,
  Briefcase,
  Heart,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  VPCJobItem,
  VPCPainItem,
  VPCGainItem,
  VPCItem,
  VPCPainRelieverItem,
  VPCGainCreatorItem,
  ValuePropositionCanvas,
} from '@/db/schema/value-proposition-canvas';

// ============================================================================
// TYPES
// ============================================================================

interface EditableValuePropositionCanvasProps {
  segment: ValuePropositionCanvas;
  onAddJob: (job: Omit<VPCJobItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateJob: (jobId: string, updates: Partial<VPCJobItem>) => Promise<void>;
  onRemoveJob: (jobId: string) => Promise<void>;
  onAddPain: (pain: Omit<VPCPainItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdatePain: (painId: string, updates: Partial<VPCPainItem>) => Promise<void>;
  onRemovePain: (painId: string) => Promise<void>;
  onAddGain: (gain: Omit<VPCGainItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateGain: (gainId: string, updates: Partial<VPCGainItem>) => Promise<void>;
  onRemoveGain: (gainId: string) => Promise<void>;
  onAddProductOrService: (text: string) => Promise<void>;
  onUpdateProductOrService: (itemId: string, text: string) => Promise<void>;
  onRemoveProductOrService: (itemId: string) => Promise<void>;
  onAddPainReliever: (item: Omit<VPCPainRelieverItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdatePainReliever: (itemId: string, updates: Partial<VPCPainRelieverItem>) => Promise<void>;
  onRemovePainReliever: (itemId: string) => Promise<void>;
  onAddGainCreator: (item: Omit<VPCGainCreatorItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateGainCreator: (itemId: string, updates: Partial<VPCGainCreatorItem>) => Promise<void>;
  onRemoveGainCreator: (itemId: string) => Promise<void>;
  onAddDifferentiator: (text: string) => Promise<void>;
  onUpdateDifferentiator: (itemId: string, text: string) => Promise<void>;
  onRemoveDifferentiator: (itemId: string) => Promise<void>;
  onResetToCrewAI?: () => Promise<void>;
  isSaving?: boolean;
  className?: string;
}

// ============================================================================
// SOURCE BADGE
// ============================================================================

function SourceBadge({ source }: { source: 'crewai' | 'manual' }) {
  if (source === 'crewai') {
    return (
      <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
        <Bot className="w-3 h-3 mr-1" />
        AI
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
      <User className="w-3 h-3 mr-1" />
      Manual
    </Badge>
  );
}

// ============================================================================
// EDITABLE JOB CARD
// ============================================================================

function EditableJobCard({
  job,
  index,
  onUpdate,
  onRemove,
  isSaving,
}: {
  job: VPCJobItem;
  index: number;
  onUpdate: (updates: Partial<VPCJobItem>) => Promise<void>;
  onRemove: () => Promise<void>;
  isSaving?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    functional: job.functional,
    emotional: job.emotional,
    social: job.social,
    importance: job.importance,
  });

  const handleSave = async () => {
    await onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      functional: job.functional,
      emotional: job.emotional,
      social: job.social,
      importance: job.importance,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-white border-2 border-blue-300 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Job {index + 1}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label htmlFor="edit-functional" className="text-xs text-muted-foreground flex items-center gap-1">
              <Briefcase className="w-3 h-3" aria-hidden="true" /> Functional
            </label>
            <Textarea
              id="edit-functional"
              value={editData.functional}
              onChange={(e) => setEditData({ ...editData, functional: e.target.value })}
              placeholder="What task are they trying to accomplish?"
              className="text-sm"
              rows={2}
            />
          </div>
          <div>
            <label htmlFor="edit-emotional" className="text-xs text-muted-foreground flex items-center gap-1">
              <Heart className="w-3 h-3" aria-hidden="true" /> Emotional
            </label>
            <Textarea
              id="edit-emotional"
              value={editData.emotional}
              onChange={(e) => setEditData({ ...editData, emotional: e.target.value })}
              placeholder="How do they want to feel?"
              className="text-sm"
              rows={2}
            />
          </div>
          <div>
            <label htmlFor="edit-social" className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" /> Social
            </label>
            <Textarea
              id="edit-social"
              value={editData.social}
              onChange={(e) => setEditData({ ...editData, social: e.target.value })}
              placeholder="How do they want to be perceived?"
              className="text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Importance: {editData.importance}/10</label>
            <Slider
              value={[editData.importance]}
              onValueChange={([val]) => setEditData({ ...editData, importance: val })}
              min={1}
              max={10}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group p-3 bg-white border rounded-lg shadow-sm space-y-2 hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Job {index + 1}</span>
        <div className="flex items-center gap-2">
          <SourceBadge source={job.source} />
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Job?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove} className="bg-red-500 hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {job.functional && (
        <div className="flex items-start gap-2">
          <Briefcase className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-muted-foreground block">Functional</span>
            <span className="text-sm">{job.functional}</span>
          </div>
        </div>
      )}

      {job.emotional && (
        <div className="flex items-start gap-2">
          <Heart className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-muted-foreground block">Emotional</span>
            <span className="text-sm">{job.emotional}</span>
          </div>
        </div>
      )}

      {job.social && (
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-muted-foreground block">Social</span>
            <span className="text-sm">{job.social}</span>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">Importance: {job.importance}/10</div>
    </div>
  );
}

// ============================================================================
// EDITABLE PAIN CARD
// ============================================================================

function EditablePainCard({
  pain,
  onUpdate,
  onRemove,
  isSaving,
}: {
  pain: VPCPainItem;
  onUpdate: (updates: Partial<VPCPainItem>) => Promise<void>;
  onRemove: () => Promise<void>;
  isSaving?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: pain.description,
    intensity: pain.intensity || 5,
  });

  const handleSave = async () => {
    await onUpdate(editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 border-2 border-red-300 rounded-lg space-y-2">
        <Textarea
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          placeholder="Describe the customer pain..."
          className="text-sm"
          rows={2}
        />
        <div>
          <label className="text-xs text-muted-foreground">Intensity: {editData.intensity}/10</label>
          <Slider
            value={[editData.intensity]}
            onValueChange={([val]) => setEditData({ ...editData, intensity: val })}
            min={1}
            max={10}
            step={1}
            className="mt-2"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group p-3 border rounded-lg space-y-2 bg-white hover:border-red-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <Frown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{pain.description}</span>
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge source={pain.source} />
          {pain.intensity && (
            <Badge variant="outline" className={cn(
              'text-xs',
              pain.intensity >= 7 ? 'bg-red-100 text-red-800 border-red-200' :
              pain.intensity >= 4 ? 'bg-orange-100 text-orange-800 border-orange-200' :
              'bg-green-100 text-green-800 border-green-200'
            )}>
              {pain.intensity}/10
            </Badge>
          )}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Pain?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove} className="bg-red-500 hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EDITABLE GAIN CARD
// ============================================================================

function EditableGainCard({
  gain,
  onUpdate,
  onRemove,
  isSaving,
}: {
  gain: VPCGainItem;
  onUpdate: (updates: Partial<VPCGainItem>) => Promise<void>;
  onRemove: () => Promise<void>;
  isSaving?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: gain.description,
    importance: gain.importance || 5,
  });

  const handleSave = async () => {
    await onUpdate(editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 border-2 border-green-300 rounded-lg space-y-2">
        <Textarea
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          placeholder="Describe the customer gain..."
          className="text-sm"
          rows={2}
        />
        <div>
          <label className="text-xs text-muted-foreground">Importance: {editData.importance}/10</label>
          <Slider
            value={[editData.importance]}
            onValueChange={([val]) => setEditData({ ...editData, importance: val })}
            min={1}
            max={10}
            step={1}
            className="mt-2"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group p-3 border rounded-lg space-y-2 bg-white hover:border-green-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <Smile className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{gain.description}</span>
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge source={gain.source} />
          {gain.importance && (
            <Badge variant="outline" className={cn(
              'text-xs',
              gain.importance >= 7 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
              gain.importance >= 4 ? 'bg-blue-100 text-blue-800 border-blue-200' :
              'bg-slate-100 text-slate-800 border-slate-200'
            )}>
              {gain.importance}/10
            </Badge>
          )}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Gain?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove} className="bg-red-500 hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EDITABLE TEXT ITEM
// ============================================================================

function EditableTextItem({
  item,
  onUpdate,
  onRemove,
  isSaving,
  placeholder,
}: {
  item: VPCItem;
  onUpdate: (text: string) => Promise<void>;
  onRemove: () => Promise<void>;
  isSaving?: boolean;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleSave = async () => {
    if (editText.trim()) {
      await onUpdate(editText.trim());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
          <X className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 p-2 bg-white border rounded-md text-sm hover:border-purple-300 transition-colors">
      <span className="flex-1">{item.text}</span>
      <SourceBadge source={item.source} />
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsEditing(true)}>
          <Edit2 className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={onRemove}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// ADD ITEM FORMS
// ============================================================================

function AddJobForm({ onAdd, isSaving }: { onAdd: (job: any) => Promise<void>; isSaving?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({ functional: '', emotional: '', social: '', importance: 5 });

  const handleSubmit = async () => {
    if (data.functional || data.emotional || data.social) {
      await onAdd(data);
      setData({ functional: '', emotional: '', social: '', importance: 5 });
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" className="w-full" onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> Add Job
      </Button>
    );
  }

  return (
    <div className="p-3 border-2 border-dashed border-blue-300 rounded-lg space-y-2 bg-blue-50/50">
      <div>
        <label htmlFor="new-functional" className="text-xs text-muted-foreground">Functional Job</label>
        <Textarea
          id="new-functional"
          value={data.functional}
          onChange={(e) => setData({ ...data, functional: e.target.value })}
          placeholder="What task are they trying to accomplish?"
          className="text-sm"
          rows={2}
        />
      </div>
      <div>
        <label htmlFor="new-emotional" className="text-xs text-muted-foreground">Emotional Job</label>
        <Textarea
          id="new-emotional"
          value={data.emotional}
          onChange={(e) => setData({ ...data, emotional: e.target.value })}
          placeholder="How do they want to feel?"
          className="text-sm"
          rows={2}
        />
      </div>
      <div>
        <label htmlFor="new-social" className="text-xs text-muted-foreground">Social Job</label>
        <Textarea
          id="new-social"
          value={data.social}
          onChange={(e) => setData({ ...data, social: e.target.value })}
          placeholder="How do they want to be perceived?"
          className="text-sm"
          rows={2}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Importance: {data.importance}/10</label>
        <Slider
          value={[data.importance]}
          onValueChange={([val]) => setData({ ...data, importance: val })}
          min={1}
          max={10}
          step={1}
          className="mt-2"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Job'}
        </Button>
      </div>
    </div>
  );
}

function AddTextItemForm({
  onAdd,
  isSaving,
  label,
  placeholder,
}: {
  onAdd: (text: string) => Promise<void>;
  isSaving?: boolean;
  label: string;
  placeholder: string;
}) {
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (text.trim()) {
      await onAdd(text.trim());
      setText('');
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <Button size="sm" onClick={handleSubmit} disabled={isSaving || !text.trim()}>
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EditableValuePropositionCanvas({
  segment,
  onAddJob,
  onUpdateJob,
  onRemoveJob,
  onAddPain,
  onUpdatePain,
  onRemovePain,
  onAddGain,
  onUpdateGain,
  onRemoveGain,
  onAddProductOrService,
  onUpdateProductOrService,
  onRemoveProductOrService,
  onAddPainReliever,
  onUpdatePainReliever,
  onRemovePainReliever,
  onAddGainCreator,
  onUpdateGainCreator,
  onRemoveGainCreator,
  onAddDifferentiator,
  onUpdateDifferentiator,
  onRemoveDifferentiator,
  onResetToCrewAI,
  isSaving,
  className,
}: EditableValuePropositionCanvasProps) {
  const jobs = (segment.jobs as VPCJobItem[]) || [];
  const pains = (segment.pains as VPCPainItem[]) || [];
  const gains = (segment.gains as VPCGainItem[]) || [];
  const productsAndServices = (segment.productsAndServices as VPCItem[]) || [];
  const painRelievers = (segment.painRelievers as VPCPainRelieverItem[]) || [];
  const gainCreators = (segment.gainCreators as VPCGainCreatorItem[]) || [];
  const differentiators = (segment.differentiators as VPCItem[]) || [];

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{segment.segmentName}</h2>
          <p className="text-muted-foreground">Value Proposition Canvas (Editing)</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            segment.dataSource === 'crewai' ? 'bg-blue-50 border-blue-200 text-blue-700' :
            segment.dataSource === 'manual' ? 'bg-green-50 border-green-200 text-green-700' :
            'bg-yellow-50 border-yellow-200 text-yellow-700'
          )}>
            {segment.dataSource === 'crewai' ? 'AI Generated' : segment.dataSource === 'manual' ? 'Manual' : 'Hybrid'}
          </Badge>
          {onResetToCrewAI && segment.originalCrewaiData && (
            <Button variant="outline" size="sm" onClick={onResetToCrewAI} disabled={isSaving}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to AI
            </Button>
          )}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VALUE MAP (Left Side) */}
        <Card className="border-2 border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Gift className="w-5 h-5" />
              Value Map
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Products & Services */}
            <div>
              <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Products & Services
                <Badge variant="secondary" className="ml-auto">{productsAndServices.length}</Badge>
              </h4>
              <div className="space-y-2">
                {productsAndServices.map((item) => (
                  <EditableTextItem
                    key={item.id}
                    item={item}
                    onUpdate={(text) => onUpdateProductOrService(item.id, text)}
                    onRemove={() => onRemoveProductOrService(item.id)}
                    isSaving={isSaving}
                  />
                ))}
                <AddTextItemForm
                  onAdd={onAddProductOrService}
                  isSaving={isSaving}
                  label="Add Product/Service"
                  placeholder="Add a product or service..."
                />
              </div>
            </div>

            <Separator />

            {/* Pain Relievers */}
            <div>
              <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Pain Relievers
                <Badge variant="secondary" className="ml-auto">{painRelievers.length}</Badge>
              </h4>
              <div className="space-y-2">
                {painRelievers.map((item) => (
                  <div key={item.id} className="group p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-blue-600 mb-1">Relieves: "{item.painDescription}"</div>
                        <div className="text-sm text-blue-900">{item.relief}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <SourceBadge source={item.source} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500"
                          onClick={() => onRemovePainReliever(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {painRelievers.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No pain relievers mapped</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Gain Creators */}
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Gain Creators
                <Badge variant="secondary" className="ml-auto">{gainCreators.length}</Badge>
              </h4>
              <div className="space-y-2">
                {gainCreators.map((item) => (
                  <div key={item.id} className="group p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-green-600 mb-1">Creates: "{item.gainDescription}"</div>
                        <div className="text-sm text-green-900">{item.creator}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <SourceBadge source={item.source} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500"
                          onClick={() => onRemoveGainCreator(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {gainCreators.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No gain creators mapped</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Differentiators */}
            <div>
              <h4 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Differentiators
                <Badge variant="secondary" className="ml-auto">{differentiators.length}</Badge>
              </h4>
              <div className="space-y-2">
                {differentiators.map((item) => (
                  <EditableTextItem
                    key={item.id}
                    item={item}
                    onUpdate={(text) => onUpdateDifferentiator(item.id, text)}
                    onRemove={() => onRemoveDifferentiator(item.id)}
                    isSaving={isSaving}
                  />
                ))}
                <AddTextItemForm
                  onAdd={onAddDifferentiator}
                  isSaving={isSaving}
                  label="Add Differentiator"
                  placeholder="What makes you unique?"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CUSTOMER PROFILE (Right Side) */}
        <Card className="border-2 border-teal-200 bg-teal-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-teal-800">
              <Users className="w-5 h-5" />
              Customer Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Jobs */}
            <div>
              <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Customer Jobs
                <Badge variant="secondary" className="ml-auto">{jobs.length}</Badge>
              </h4>
              <div className="space-y-3">
                {jobs.map((job, i) => (
                  <EditableJobCard
                    key={job.id}
                    job={job}
                    index={i}
                    onUpdate={(updates) => onUpdateJob(job.id, updates)}
                    onRemove={() => onRemoveJob(job.id)}
                    isSaving={isSaving}
                  />
                ))}
                <AddJobForm onAdd={onAddJob} isSaving={isSaving} />
              </div>
            </div>

            <Separator />

            {/* Pains */}
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <Frown className="w-4 h-4" />
                Pains
                <Badge variant="secondary" className="ml-auto">{pains.length}</Badge>
              </h4>
              <div className="space-y-3">
                {pains.map((pain) => (
                  <EditablePainCard
                    key={pain.id}
                    pain={pain}
                    onUpdate={(updates) => onUpdatePain(pain.id, updates)}
                    onRemove={() => onRemovePain(pain.id)}
                    isSaving={isSaving}
                  />
                ))}
                <AddPainForm onAdd={onAddPain} isSaving={isSaving} />
              </div>
            </div>

            <Separator />

            {/* Gains */}
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <Smile className="w-4 h-4" />
                Gains
                <Badge variant="secondary" className="ml-auto">{gains.length}</Badge>
              </h4>
              <div className="space-y-3">
                {gains.map((gain) => (
                  <EditableGainCard
                    key={gain.id}
                    gain={gain}
                    onUpdate={(updates) => onUpdateGain(gain.id, updates)}
                    onRemove={() => onRemoveGain(gain.id)}
                    isSaving={isSaving}
                  />
                ))}
                <AddGainForm onAdd={onAddGain} isSaving={isSaving} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// ADD PAIN/GAIN FORMS
// ============================================================================

function AddPainForm({ onAdd, isSaving }: { onAdd: (pain: any) => Promise<void>; isSaving?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({ description: '', intensity: 5 });

  const handleSubmit = async () => {
    if (data.description.trim()) {
      await onAdd(data);
      setData({ description: '', intensity: 5 });
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" className="w-full" onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> Add Pain
      </Button>
    );
  }

  return (
    <div className="p-3 border-2 border-dashed border-red-300 rounded-lg space-y-2 bg-red-50/50">
      <Textarea
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        placeholder="Describe the customer pain..."
        className="text-sm"
        rows={2}
      />
      <div>
        <label className="text-xs text-muted-foreground">Intensity: {data.intensity}/10</label>
        <Slider
          value={[data.intensity]}
          onValueChange={([val]) => setData({ ...data, intensity: val })}
          min={1}
          max={10}
          step={1}
          className="mt-2"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isSaving || !data.description.trim()}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Pain'}
        </Button>
      </div>
    </div>
  );
}

function AddGainForm({ onAdd, isSaving }: { onAdd: (gain: any) => Promise<void>; isSaving?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({ description: '', importance: 5 });

  const handleSubmit = async () => {
    if (data.description.trim()) {
      await onAdd(data);
      setData({ description: '', importance: 5 });
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" className="w-full" onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> Add Gain
      </Button>
    );
  }

  return (
    <div className="p-3 border-2 border-dashed border-green-300 rounded-lg space-y-2 bg-green-50/50">
      <Textarea
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        placeholder="Describe the customer gain..."
        className="text-sm"
        rows={2}
      />
      <div>
        <label className="text-xs text-muted-foreground">Importance: {data.importance}/10</label>
        <Slider
          value={[data.importance]}
          onValueChange={([val]) => setData({ ...data, importance: val })}
          min={1}
          max={10}
          step={1}
          className="mt-2"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isSaving || !data.description.trim()}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Gain'}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { EditableValuePropositionCanvas };
export type { EditableValuePropositionCanvasProps };
