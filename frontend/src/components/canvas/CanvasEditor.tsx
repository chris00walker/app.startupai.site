/**
 * @story US-CP02, US-CP03, US-CP04
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, Download, Share2, History, Eye, Edit3, Sparkles, Users, MessageSquare } from 'lucide-react';
import ValuePropositionCanvas from './ValuePropositionCanvas';
import BusinessModelCanvas from './BusinessModelCanvas';
import TestingBusinessIdeasCanvas from './TestingBusinessIdeasCanvas';
import api from '@/services/api';

interface CanvasEditorProps {
  canvasId?: string;
  canvasType: 'value-proposition' | 'business-model' | 'testing-business-ideas';
  clientId: string;
  mode?: 'view' | 'edit' | 'collaborate';
}

interface CanvasMetadata {
  id: string;
  name: string;
  type: string;
  status: string;
  lastModified: string;
  collaborators: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: string;
  }>;
  aiGenerated: boolean;
  version: number;
}

export default function CanvasEditor({ 
  canvasId, 
  canvasType, 
  clientId, 
  mode = 'edit' 
}: CanvasEditorProps) {
  const [canvasData, setCanvasData] = useState<any>(null);
  const [metadata, setMetadata] = useState<CanvasMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  useEffect(() => {
    loadCanvas();
    if (mode === 'collaborate') {
      // Initialize real-time collaboration
      initializeCollaboration();
    }
  }, [canvasId, canvasType, clientId]);

  const loadCanvas = async () => {
    setLoading(true);
    try {
      // Validate required clientId
      if (!clientId || clientId.trim() === '') {
        // Keep loading state when clientId is missing
        return;
      }

      if (canvasId) {
        // Load existing canvas
        const response = await api.canvas.getById(canvasId);
        setCanvasData(response.canvas.data);
        setMetadata(response.metadata);
      } else {
        // Create new canvas
        setCanvasData(getEmptyCanvasData());
        setMetadata({
          id: 'new',
          name: `New ${getCanvasTypeName()}`,
          type: canvasType,
          status: 'draft',
          lastModified: new Date().toISOString(),
          collaborators: [],
          aiGenerated: false,
          version: 1
        });
      }
    } catch (error) {
      console.error('Failed to load canvas:', error);
    } finally {
      // Only set loading to false if clientId is valid
      if (clientId && clientId.trim() !== '') {
        setLoading(false);
      }
    }
  };

  const initializeCollaboration = () => {
    // This would set up WebSocket connection for real-time collaboration
    // For now, simulate active collaborators
    setActiveCollaborators(['user1', 'user2']);
  };

  const getEmptyCanvasData = () => {
    switch (canvasType) {
      case 'value-proposition':
        return {
          customerProfile: {
            customerJobs: [],
            pains: [],
            gains: []
          },
          valueMap: {
            products: [],
            painRelievers: [],
            gainCreators: []
          }
        };
      case 'business-model':
        return {
          keyPartners: [],
          keyActivities: [],
          keyResources: [],
          valuePropositions: [],
          customerRelationships: [],
          channels: [],
          customerSegments: [],
          costStructure: [],
          revenueStreams: []
        };
      default:
        return {};
    }
  };

  const getCanvasTypeName = () => {
    switch (canvasType) {
      case 'value-proposition':
        return 'Value Proposition Canvas';
      case 'business-model':
        return 'Business Model Canvas';
      case 'testing-business-ideas':
        return 'Testing Business Ideas';
      default:
        return 'Canvas';
    }
  };

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      if (canvasId && canvasId !== 'new') {
        await api.canvas.updateCanvas(canvasId, data);
      } else {
        // Create new canvas
        const response = await api.canvas.generateValueProposition({
          clientId,
          title: metadata?.name,
          description: 'Canvas created via editor'
        });
        // Handle response
      }
      setCanvasData(data);
      if (metadata) {
        setMetadata({
          ...metadata,
          lastModified: new Date().toISOString(),
          version: metadata.version + 1
        });
      }
    } catch (error) {
      console.error('Failed to save canvas:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'svg' | 'png' | 'pdf') => {
    if (!canvasId || canvasId === 'new') return;
    
    try {
      const response = await api.canvas.exportCanvas(canvasId, format);
      // Handle export download
      const blob = new Blob([response], { type: `image/${format}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${metadata?.name || 'canvas'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const generateAISuggestions = async () => {
    try {
      // This would call AI to generate suggestions based on current canvas state
      setAiSuggestions([
        {
          type: 'improvement',
          section: 'customerJobs',
          suggestion: 'Consider adding "Automate repetitive tasks" to customer jobs',
          confidence: 0.85
        },
        {
          type: 'validation',
          section: 'valuePropositions',
          suggestion: 'Your value propositions align well with identified customer pains',
          confidence: 0.92
        }
      ]);
    } catch (error) {
      console.error('AI suggestions failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground">Loading canvas...</p>
        </div>
      </div>
    );
  }

  const renderCanvas = () => {
    switch (canvasType) {
      case 'value-proposition':
        return (
          <ValuePropositionCanvas
            canvasId={canvasId}
            clientId={clientId}
            initialData={canvasData}
            onSave={handleSave}
            readOnly={mode === 'view'}
          />
        );
      case 'business-model':
        return (
          <BusinessModelCanvas
            canvasId={canvasId}
            clientId={clientId}
            initialData={canvasData}
            onSave={handleSave}
            readOnly={mode === 'view'}
          />
        );
      case 'testing-business-ideas':
        return (
          <TestingBusinessIdeasCanvas
            canvasId={canvasId}
            clientId={clientId}
            initialData={canvasData}
            onSave={handleSave}
            readOnly={mode === 'view'}
          />
        );
      default:
        return <div>Canvas type not supported yet</div>;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Canvas Header */}
      <div className="flex items-center justify-between p-6 border-b bg-muted/20">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{metadata?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={metadata?.status === 'completed' ? 'default' : 'secondary'}>
                {metadata?.status}
              </Badge>
              {metadata?.aiGenerated && (
                <Badge variant="outline" className="text-blue-600">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                v{metadata?.version} • Last modified {new Date(metadata?.lastModified || '').toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Collaborators */}
          {mode === 'collaborate' && activeCollaborators.length > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {activeCollaborators.slice(0, 3).map((id, index) => (
                  <div
                    key={id}
                    className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {activeCollaborators.length} active
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={generateAISuggestions}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Suggestions
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Canvas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose your preferred export format:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExport('svg')}
                    className="flex flex-col h-20"
                  >
                    <div className="text-lg">📄</div>
                    <span className="text-xs">SVG</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('png')}
                    className="flex flex-col h-20"
                  >
                    <div className="text-lg">🖼️</div>
                    <span className="text-xs">PNG</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('pdf')}
                    className="flex flex-col h-20"
                  >
                    <div className="text-lg">📋</div>
                    <span className="text-xs">PDF</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(true)}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>

          <Button
            size="sm"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Canvas Content */}
      <div className="relative">
        {renderCanvas()}

        {/* AI Suggestions Panel */}
        {aiSuggestions.length > 0 && (
          <Card className="absolute top-4 right-4 w-80 max-h-96 overflow-y-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm">{suggestion.suggestion}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-6 text-xs">
                      Apply
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs">
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
