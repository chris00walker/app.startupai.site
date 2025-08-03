/**
 * Canvas Editor Component
 * 
 * Interactive editor for Strategyzer canvases with real-time updates
 * Supports drag-and-drop, inline editing, and collaborative features
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Undo, 
  Redo,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Target,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const CanvasEditor = ({ 
  canvas, 
  onSave, 
  onCancel,
  collaborative = false,
  className = "" 
}) => {
  const [canvasData, setCanvasData] = useState(canvas || {});
  const [editingItem, setEditingItem] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [collaborators, setCollaborators] = useState([]);

  // Canvas section configurations
  const sectionConfigs = {
    valueProposition: {
      customerProfile: {
        jobs: { title: 'Customer Jobs', icon: Target, color: 'blue', placeholder: 'What jobs is your customer trying to get done?' },
        pains: { title: 'Pains', icon: AlertCircle, color: 'red', placeholder: 'What pains does your customer experience?' },
        gains: { title: 'Gains', icon: TrendingUp, color: 'green', placeholder: 'What gains does your customer expect?' }
      },
      valueMap: {
        products: { title: 'Products & Services', icon: Lightbulb, color: 'purple', placeholder: 'What products and services do you offer?' },
        painRelievers: { title: 'Pain Relievers', icon: CheckCircle, color: 'red', placeholder: 'How do you relieve customer pains?' },
        gainCreators: { title: 'Gain Creators', icon: TrendingUp, color: 'green', placeholder: 'How do you create customer gains?' }
      }
    },
    businessModel: {
      keyPartners: { title: 'Key Partners', icon: Users, color: 'blue' },
      keyActivities: { title: 'Key Activities', icon: Target, color: 'green' },
      valuePropositions: { title: 'Value Propositions', icon: Lightbulb, color: 'purple' },
      customerRelationships: { title: 'Customer Relationships', icon: Users, color: 'orange' },
      customerSegments: { title: 'Customer Segments', icon: Users, color: 'red' },
      keyResources: { title: 'Key Resources', icon: CheckCircle, color: 'teal' },
      channels: { title: 'Channels', icon: TrendingUp, color: 'indigo' },
      costStructure: { title: 'Cost Structure', icon: AlertCircle, color: 'red' },
      revenueStreams: { title: 'Revenue Streams', icon: TrendingUp, color: 'green' }
    }
  };

  // Initialize canvas data structure
  useEffect(() => {
    if (canvas) {
      setCanvasData(canvas);
      addToHistory(canvas);
    }
  }, [canvas]);

  // Add to history for undo/redo
  const addToHistory = useCallback((data) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(data)));
      return newHistory.slice(-20); // Keep last 20 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [historyIndex]);

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setCanvasData(previousState);
      setHistoryIndex(prev => prev - 1);
      setHasChanges(true);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCanvasData(nextState);
      setHistoryIndex(prev => prev + 1);
      setHasChanges(true);
    }
  };

  // Update canvas data
  const updateCanvasData = (path, value) => {
    setCanvasData(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  // Add new item to a section
  const addItem = (sectionPath) => {
    const currentItems = getNestedValue(canvasData, sectionPath) || [];
    const newItem = {
      id: Date.now().toString(),
      text: '',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      createdBy: 'current-user' // TODO: Get from auth context
    };
    
    updateCanvasData(sectionPath, [...currentItems, newItem]);
    setEditingItem(`${sectionPath}.${currentItems.length}`);
    addToHistory(canvasData);
  };

  // Remove item from section
  const removeItem = (sectionPath, index) => {
    const currentItems = getNestedValue(canvasData, sectionPath) || [];
    const updatedItems = currentItems.filter((_, i) => i !== index);
    updateCanvasData(sectionPath, updatedItems);
    addToHistory(canvasData);
    toast.success('Item removed');
  };

  // Update item text
  const updateItemText = (sectionPath, index, text) => {
    const currentItems = getNestedValue(canvasData, sectionPath) || [];
    const updatedItems = [...currentItems];
    updatedItems[index] = { ...updatedItems[index], text };
    updateCanvasData(sectionPath, updatedItems);
  };

  // Handle drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourcePath = source.droppableId;
    const destPath = destination.droppableId;

    if (sourcePath === destPath) {
      // Reordering within same section
      const items = getNestedValue(canvasData, sourcePath) || [];
      const reorderedItems = Array.from(items);
      const [removed] = reorderedItems.splice(source.index, 1);
      reorderedItems.splice(destination.index, 0, removed);
      
      updateCanvasData(sourcePath, reorderedItems);
    } else {
      // Moving between sections
      const sourceItems = getNestedValue(canvasData, sourcePath) || [];
      const destItems = getNestedValue(canvasData, destPath) || [];
      
      const sourceClone = Array.from(sourceItems);
      const destClone = Array.from(destItems);
      const [removed] = sourceClone.splice(source.index, 1);
      destClone.splice(destination.index, 0, removed);
      
      updateCanvasData(sourcePath, sourceClone);
      updateCanvasData(destPath, destClone);
    }
    
    addToHistory(canvasData);
    toast.success('Item moved');
  };

  // Save canvas
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave?.(canvasData);
      setHasChanges(false);
      toast.success('Canvas saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save canvas');
    } finally {
      setIsLoading(false);
    }
  };

  // Get nested value from object
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Render canvas section
  const renderSection = (sectionKey, sectionPath, config) => {
    const items = getNestedValue(canvasData, sectionPath) || [];
    const Icon = config.icon;

    return (
      <Card key={sectionKey} className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className={`h-4 w-4 text-${config.color}-600`} />
            {config.title}
            <Badge variant="outline" className="ml-auto">
              {items.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Droppable droppableId={sectionPath}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
                  snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                }`}
              >
                {items.map((item, index) => (
                  <Draggable
                    key={item.id || index}
                    draggableId={`${sectionPath}-${index}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 bg-white border rounded-lg shadow-sm transition-shadow ${
                          snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                        }`}
                      >
                        {editingItem === `${sectionPath}.${index}` ? (
                          <div className="space-y-2">
                            <Textarea
                              value={item.text || ''}
                              onChange={(e) => updateItemText(sectionPath, index, e.target.value)}
                              placeholder={config.placeholder || 'Enter text...'}
                              className="resize-none"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEditingItem(null);
                                  addToHistory(canvasData);
                                }}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingItem(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="group">
                            <p className="text-sm leading-relaxed">
                              {item.text || 'Empty item'}
                            </p>
                            <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingItem(`${sectionPath}.${index}`)}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeItem(sectionPath, index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              {item.createdAt && (
                                <span className="text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                <Button
                  variant="dashed"
                  size="sm"
                  className="w-full"
                  onClick={() => addItem(sectionPath)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    );
  };

  // Render Value Proposition Canvas
  const renderVPCEditor = () => {
    const config = sectionConfigs.valueProposition;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Profile */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-600">Customer Profile</h3>
          <div className="grid gap-4">
            {Object.entries(config.customerProfile).map(([key, sectionConfig]) =>
              renderSection(key, `customerProfile.${key}`, sectionConfig)
            )}
          </div>
        </div>

        {/* Value Map */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-purple-600">Value Map</h3>
          <div className="grid gap-4">
            {Object.entries(config.valueMap).map(([key, sectionConfig]) =>
              renderSection(key, `valueMap.${key}`, sectionConfig)
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Business Model Canvas
  const renderBMCEditor = () => {
    const config = sectionConfigs.businessModel;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(config).map(([key, sectionConfig]) =>
          renderSection(key, key, sectionConfig)
        )}
      </div>
    );
  };

  return (
    <div className={`canvas-editor ${className}`}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Editing: {canvasData.name || 'Untitled Canvas'}
                {hasChanges && <Badge variant="outline">Unsaved Changes</Badge>}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {canvasData.type === 'valueProposition' ? 'Value Proposition Canvas' :
                 canvasData.type === 'businessModel' ? 'Business Model Canvas' :
                 'Testing Business Ideas Canvas'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* History Controls */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
              >
                <Save className="h-4 w-4 mr-1" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Editor Content */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="canvas-editor-content">
          {canvasData.type === 'valueProposition' && renderVPCEditor()}
          {canvasData.type === 'businessModel' && renderBMCEditor()}
          {(!canvasData.type || canvasData.type === 'testingBusinessIdeas') && (
            <div className="text-center py-12">
              <Edit3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Testing Business Ideas editor coming soon...
              </p>
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Collaboration Panel */}
      {collaborative && collaborators.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaborators ({collaborators.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {collaborators.map((collaborator, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded-full text-xs"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {collaborator.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CanvasEditor;
