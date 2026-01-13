import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Save, X, Sparkles, Building2, Users, DollarSign, Zap, Heart, Truck, UserCheck, Coins, Target } from 'lucide-react';

interface BusinessModelCanvasProps {
  canvasId?: string;
  clientId?: string;
  initialData?: any;
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

interface BMCData {
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  valuePropositions: string[];
  customerRelationships: string[];
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[];
}

const defaultBMC: BMCData = {
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

export default function BusinessModelCanvas({ 
  canvasId, 
  initialData, 
  onSave, 
  readOnly = false 
}: BusinessModelCanvasProps) {
  const [canvasData, setCanvasData] = useState<BMCData>(defaultBMC);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Merge with default data to ensure all fields exist and are arrays
      const mergedData: BMCData = {
        keyPartners: Array.isArray(initialData.keyPartners) ? initialData.keyPartners : [],
        keyActivities: Array.isArray(initialData.keyActivities) ? initialData.keyActivities : [],
        keyResources: Array.isArray(initialData.keyResources) ? initialData.keyResources : [],
        valuePropositions: Array.isArray(initialData.valuePropositions) ? initialData.valuePropositions : [],
        customerRelationships: Array.isArray(initialData.customerRelationships) ? initialData.customerRelationships : [],
        channels: Array.isArray(initialData.channels) ? initialData.channels : [],
        customerSegments: Array.isArray(initialData.customerSegments) ? initialData.customerSegments : [],
        costStructure: Array.isArray(initialData.costStructure) ? initialData.costStructure : [],
        revenueStreams: Array.isArray(initialData.revenueStreams) ? initialData.revenueStreams : []
      };
      setCanvasData(mergedData);
    } else if (canvasId) {
      // Try to load from localStorage
      const saved = localStorage.getItem(`bmc-canvas-${canvasId}`);
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          const mergedData: BMCData = {
            keyPartners: Array.isArray(parsedData.keyPartners) ? parsedData.keyPartners : [],
            keyActivities: Array.isArray(parsedData.keyActivities) ? parsedData.keyActivities : [],
            keyResources: Array.isArray(parsedData.keyResources) ? parsedData.keyResources : [],
            valuePropositions: Array.isArray(parsedData.valuePropositions) ? parsedData.valuePropositions : [],
            customerRelationships: Array.isArray(parsedData.customerRelationships) ? parsedData.customerRelationships : [],
            channels: Array.isArray(parsedData.channels) ? parsedData.channels : [],
            customerSegments: Array.isArray(parsedData.customerSegments) ? parsedData.customerSegments : [],
            costStructure: Array.isArray(parsedData.costStructure) ? parsedData.costStructure : [],
            revenueStreams: Array.isArray(parsedData.revenueStreams) ? parsedData.revenueStreams : []
          };
          setCanvasData(mergedData);
        } catch (error) {
          console.error('Error parsing saved canvas data:', error);
        }
      }
    }
  }, [initialData, canvasId]);

  const addItem = (section: keyof BMCData) => {
    if (!newItem.trim()) return;
    
    setCanvasData(prev => ({
      ...prev,
      [section]: [...prev[section], newItem.trim()]
    }));
    
    setNewItem('');
    setEditingSection(null);
  };

  const handleAddClick = (section: keyof BMCData) => {
    setEditingSection(section);
    setNewItem('');
  };

  const handleAddSubmit = () => {
    if (editingSection && newItem.trim()) {
      addItem(editingSection as keyof BMCData);
      // Dialog will close automatically via addItem -> setEditingSection(null)
    }
  };

  const handleAddCancel = () => {
    setEditingSection(null);
    setNewItem('');
  };

  const updateItem = (section: keyof BMCData, index: number, value: string) => {
    setCanvasData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => i === index ? value : item)
    }));
  };

  // Stable controlled input pattern to prevent typing interruption
  const handleTextareaChange = React.useCallback(
    (section: keyof BMCData, index: number, value: string) => {
      // Use functional update to prevent re-render interruption during typing
      setCanvasData(prev => {
        const newData = { ...prev };
        const newArray = [...newData[section]];
        newArray[index] = value;
        newData[section] = newArray;
        return newData;
      });
    },
    []
  );

  const removeItem = (section: keyof BMCData, index: number) => {
    setCanvasData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(canvasData);
    } else if (canvasId) {
      // Save to localStorage if no callback provided
      localStorage.setItem(`bmc-canvas-${canvasId}`, JSON.stringify(canvasData));
    }
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      // Mock AI generation for now
      setTimeout(() => {
        setCanvasData({
          keyPartners: [
            "Technology vendors",
            "Cloud infrastructure providers",
            "Integration partners",
            "Channel partners"
          ],
          keyActivities: [
            "Software development",
            "AI model training",
            "Customer support",
            "Platform maintenance"
          ],
          keyResources: [
            "AI technology stack",
            "Development team",
            "Customer data",
            "Brand reputation"
          ],
          valuePropositions: [
            "AI-powered business insights",
            "Automated decision making",
            "Real-time analytics",
            "Cost reduction solutions"
          ],
          customerRelationships: [
            "Dedicated account management",
            "Self-service platform",
            "Community support",
            "Training programs"
          ],
          channels: [
            "Direct sales",
            "Online platform",
            "Partner channels",
            "Digital marketing"
          ],
          customerSegments: [
            "Enterprise businesses",
            "Mid-market companies",
            "Technology startups",
            "Consulting firms"
          ],
          costStructure: [
            "R&D and development",
            "Cloud infrastructure",
            "Sales and marketing",
            "Customer support"
          ],
          revenueStreams: [
            "SaaS subscriptions",
            "Professional services",
            "Training and certification",
            "API usage fees"
          ]
        });
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error('AI generation failed:', error);
      setIsGenerating(false);
    }
  };

  const BMCSection = ({ 
    title, 
    items, 
    section, 
    icon: Icon,
    description 
  }: {
    title: string;
    items: string[];
    section: keyof BMCData;
    icon: any;
    description: string;
  }) => {
    const hasContent = items.some(item => item.trim());
    
    return (
      <Card className="h-full border hover:shadow-md transition-all">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Icon className="w-4 h-4 text-muted-foreground" />
            {title}
          </CardTitle>
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasContent ? (
            <div className="space-y-2">
              {items.map((item, index) => {
                if (!item.trim()) {
                  return null;
                }

                return (
                  <div key={`${section}-${index}`} className="group relative">
                  <div className="p-3 bg-muted/30 rounded-md text-sm leading-relaxed">
                    {item}
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(section, index)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${item ? `${item} from ${title}` : `item ${index + 1} from ${title}`}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Icon className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No items added yet</p>
            </div>
          )}
          
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddClick(section)}
              className="w-full mt-3"
            >
              <Plus className="w-3 h-3 mr-2" />
              Add {title.slice(0, -1)}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Business Model Canvas
          </h1>
          <p className="text-muted-foreground">
            Visualize and design your business model
          </p>
        </div>
        <div className="flex gap-2">
          {!readOnly && (
            <>
              <Button
                variant="outline"
                onClick={generateWithAI}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'AI Generate'}
              </Button>
              <button 
                onClick={handleSave} 
                aria-label="Save Canvas" 
                data-testid="save-canvas-button"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Canvas
              </button>
            </>
          )}
        </div>
      </div>

      {/* 9-Block Canvas Layout */}
      <div className="grid grid-cols-5 gap-4 min-h-[800px]">
        {/* Row 1 */}
        <BMCSection
          title="Key Partners"
          items={canvasData.keyPartners}
          section="keyPartners"
          icon={UserCheck}
          description="Who are your key partners and suppliers?"
        />
        
        <BMCSection
          title="Key Activities"
          items={canvasData.keyActivities}
          section="keyActivities"
          icon={Zap}
          description="What key activities does your value proposition require?"
        />
        
        <BMCSection
          title="Value Propositions"
          items={canvasData.valuePropositions}
          section="valuePropositions"
          icon={Target}
          description="What value do you deliver to customers?"
        />
        
        <BMCSection
          title="Customer Relationships"
          items={canvasData.customerRelationships}
          section="customerRelationships"
          icon={Heart}
          description="What type of relationship do you establish?"
        />
        
        <BMCSection
          title="Customer Segments"
          items={canvasData.customerSegments}
          section="customerSegments"
          icon={Users}
          description="For whom are you creating value?"
        />

        {/* Row 2 */}
        <BMCSection
          title="Key Resources"
          items={canvasData.keyResources}
          section="keyResources"
          icon={Building2}
          description="What key resources does your value proposition require?"
        />
        
        <div></div> {/* Empty cell for layout */}
        <div></div> {/* Empty cell for layout */}
        
        <BMCSection
          title="Channels"
          items={canvasData.channels}
          section="channels"
          icon={Truck}
          description="Through which channels do you reach customers?"
        />
        
        <div></div> {/* Empty cell for layout */}

        {/* Row 3 */}
        <div className="col-span-2">
          <BMCSection
            title="Cost Structure"
            items={canvasData.costStructure}
            section="costStructure"
            icon={DollarSign}
            description="What are the most important costs in your business model?"
          />
        </div>
        
        <div></div> {/* Empty cell for layout */}
        
        <div className="col-span-2">
          <BMCSection
            title="Revenue Streams"
            items={canvasData.revenueStreams}
            section="revenueStreams"
            icon={Coins}
            description="For what value are customers willing to pay?"
          />
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={editingSection !== null} onOpenChange={(open) => !open && handleAddCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {editingSection ? editingSection.replace(/([A-Z])/g, ' $1').toLowerCase() : ''}
            </DialogTitle>
            <DialogDescription>
              Provide the details for the new entry and choose Add to include it in the canvas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={`Enter ${editingSection ? editingSection.replace(/([A-Z])/g, ' $1').toLowerCase() : 'item'}...`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newItem.trim()) {
                  handleAddSubmit();
                }
                if (e.key === 'Escape') {
                  handleAddCancel();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleAddCancel}>
              Cancel
            </Button>
            <Button onClick={handleAddSubmit} disabled={!newItem.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Status */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md">
            <div className="text-center space-y-4">
              <Sparkles className="w-8 h-8 mx-auto animate-spin text-blue-600" />
              <h3 className="font-semibold">AI Generating Business Model</h3>
              <p className="text-sm text-muted-foreground">
                Analyzing business requirements and creating comprehensive model...
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
