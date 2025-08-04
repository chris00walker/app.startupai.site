import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, Edit3, Save, X, Sparkles, Users, Target } from 'lucide-react';

interface ValuePropositionCanvasProps {
  canvasId?: string;
  clientId: string;
  initialData?: any;
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

interface CanvasData {
  customerProfile: {
    customerJobs: string[];
    pains: string[];
    gains: string[];
  };
  valueMap: {
    products: string[];
    painRelievers: string[];
    gainCreators: string[];
  };
}

export default function ValuePropositionCanvas({ 
  canvasId, 
  clientId, 
  initialData, 
  onSave, 
  readOnly = false 
}: ValuePropositionCanvasProps) {
  const [canvasData, setCanvasData] = useState<CanvasData>({
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
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCanvasData(initialData);
    }
  }, [initialData]);

  const addItem = (section: keyof CanvasData, subsection: string) => {
    if (!newItem.trim()) return;
    
    setCanvasData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: [...prev[section][subsection], newItem.trim()]
      }
    }));
    
    setNewItem('');
    setEditingSection(null);
  };

  const removeItem = (section: keyof CanvasData, subsection: string, index: number) => {
    setCanvasData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: prev[section][subsection].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(canvasData);
    }
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      // This would call the backend AI generation
      // const response = await api.canvas.generateValueProposition({ clientId });
      // setCanvasData(response.canvas);
      
      // Mock AI generation for now
      setTimeout(() => {
        setCanvasData({
          customerProfile: {
            customerJobs: [
              "Manage business operations efficiently",
              "Make data-driven decisions",
              "Reduce operational costs"
            ],
            pains: [
              "Complex manual processes",
              "Lack of real-time insights",
              "High operational overhead"
            ],
            gains: [
              "Increased efficiency",
              "Better decision making",
              "Cost savings"
            ]
          },
          valueMap: {
            products: [
              "AI-powered analytics platform",
              "Automated workflow system",
              "Real-time dashboard"
            ],
            painRelievers: [
              "Automated process management",
              "Real-time data visualization",
              "Streamlined operations"
            ],
            gainCreators: [
              "Productivity boost up to 40%",
              "Instant insights and alerts",
              "Reduced operational costs by 30%"
            ]
          }
        });
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error('AI generation failed:', error);
      setIsGenerating(false);
    }
  };

  const CanvasSection = ({ 
    title, 
    items, 
    section, 
    subsection, 
    icon: Icon,
    color 
  }: {
    title: string;
    items: string[];
    section: keyof CanvasData;
    subsection: string;
    icon: any;
    color: string;
  }) => (
    <Card className={`h-full border-2 ${color} transition-all hover:shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="w-4 h-4" />
          {title}
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSection(`${section}-${subsection}`)}
              className="ml-auto h-6 w-6 p-0"
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2 group">
            <div className="flex-1 text-sm p-2 bg-muted/50 rounded text-muted-foreground">
              {item}
            </div>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(section, subsection, index)}
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
        
        {editingSection === `${section}-${subsection}` && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              placeholder={`Add new ${title.toLowerCase()}...`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addItem(section, subsection)}
                disabled={!newItem.trim()}
              >
                <Save className="w-3 h-3 mr-1" />
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingSection(null);
                  setNewItem('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Value Proposition Canvas
          </h1>
          <p className="text-muted-foreground">
            Design value propositions that customers want
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
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Canvas
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Canvas Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
        {/* Customer Profile */}
        <div className="space-y-4">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Users className="w-3 h-3 mr-1" />
              Customer Profile
            </Badge>
            <h2 className="text-xl font-semibold mb-6">Customer Segment</h2>
          </div>
          
          <div className="grid gap-4">
            <CanvasSection
              title="Customer Jobs"
              items={canvasData.customerProfile.customerJobs}
              section="customerProfile"
              subsection="customerJobs"
              icon={Target}
              color="border-blue-200 bg-blue-50/50"
            />
            
            <CanvasSection
              title="Pains"
              items={canvasData.customerProfile.pains}
              section="customerProfile"
              subsection="pains"
              icon={X}
              color="border-red-200 bg-red-50/50"
            />
            
            <CanvasSection
              title="Gains"
              items={canvasData.customerProfile.gains}
              section="customerProfile"
              subsection="gains"
              icon={Plus}
              color="border-green-200 bg-green-50/50"
            />
          </div>
        </div>

        {/* Value Map */}
        <div className="space-y-4">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Value Map
            </Badge>
            <h2 className="text-xl font-semibold mb-6">Value Proposition</h2>
          </div>
          
          <div className="grid gap-4">
            <CanvasSection
              title="Products & Services"
              items={canvasData.valueMap.products}
              section="valueMap"
              subsection="products"
              icon={Target}
              color="border-purple-200 bg-purple-50/50"
            />
            
            <CanvasSection
              title="Pain Relievers"
              items={canvasData.valueMap.painRelievers}
              section="valueMap"
              subsection="painRelievers"
              icon={X}
              color="border-orange-200 bg-orange-50/50"
            />
            
            <CanvasSection
              title="Gain Creators"
              items={canvasData.valueMap.gainCreators}
              section="valueMap"
              subsection="gainCreators"
              icon={Plus}
              color="border-emerald-200 bg-emerald-50/50"
            />
          </div>
        </div>
      </div>

      {/* AI Generation Status */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md">
            <div className="text-center space-y-4">
              <Sparkles className="w-8 h-8 mx-auto animate-spin text-blue-600" />
              <h3 className="font-semibold">AI Generating Value Proposition</h3>
              <p className="text-sm text-muted-foreground">
                Analyzing customer needs and creating value propositions...
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
