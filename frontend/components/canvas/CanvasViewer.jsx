/**
 * Canvas Viewer Component
 * 
 * Interactive component for displaying and manipulating Strategyzer canvases
 * Supports Value Proposition Canvas, Business Model Canvas, and Testing Business Ideas
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Edit, 
  Share, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Eye,
  Palette,
  FileImage,
  FileText,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';

const CanvasViewer = ({ 
  canvas, 
  onEdit, 
  onShare, 
  onExport,
  className = "",
  interactive = true,
  showControls = true 
}) => {
  const [zoom, setZoom] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState('professional');
  const [exportFormat, setExportFormat] = useState('svg');
  const [isLoading, setIsLoading] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const svgRef = useRef(null);

  // Canvas type configurations
  const canvasConfig = {
    valueProposition: {
      title: 'Value Proposition Canvas',
      color: 'blue',
      sections: ['Customer Profile', 'Value Map'],
      icon: '🎯'
    },
    businessModel: {
      title: 'Business Model Canvas',
      color: 'green', 
      sections: ['Key Partners', 'Key Activities', 'Value Propositions', 'Customer Relationships', 'Customer Segments', 'Key Resources', 'Channels', 'Cost Structure', 'Revenue Streams'],
      icon: '🏢'
    },
    testingBusinessIdeas: {
      title: 'Testing Business Ideas',
      color: 'purple',
      sections: ['Experiment Design', 'Success Metrics'],
      icon: '🧪'
    }
  };

  const themes = [
    { id: 'professional', name: 'Professional', description: 'Clean and corporate' },
    { id: 'creative', name: 'Creative', description: 'Vibrant and modern' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' }
  ];

  const exportFormats = [
    { id: 'svg', name: 'SVG', description: 'Vector graphics', icon: FileImage },
    { id: 'png', name: 'PNG', description: 'High-quality image', icon: FileImage },
    { id: 'pdf', name: 'PDF', description: 'Print-ready document', icon: FileText }
  ];

  // Load canvas visual content
  useEffect(() => {
    if (canvas?.id) {
      loadCanvasVisual();
    }
  }, [canvas?.id, selectedTheme]);

  const loadCanvasVisual = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/canvas/${canvas.id}/visual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          format: 'svg',
          width: 1200,
          height: 800
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSvgContent(data.content || data.visualAssets?.svg || '');
      } else {
        toast.error('Failed to load canvas visual');
      }
    } catch (error) {
      console.error('Error loading canvas visual:', error);
      toast.error('Error loading canvas visual');
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleExport = async (format) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/canvas/${canvas.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          theme: selectedTheme,
          width: 1200,
          height: 800
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${canvas.name || 'canvas'}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success(`Canvas exported as ${format.toUpperCase()}`);
        if (onExport) onExport(format);
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
    toast.info(`Theme changed to ${theme}`);
  };

  const config = canvasConfig[canvas?.type] || canvasConfig.valueProposition;

  return (
    <div className={`canvas-viewer ${className}`}>
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {canvas?.name || config.title}
                  <Badge variant="outline" className={`text-${config.color}-600`}>
                    {config.title}
                  </Badge>
                </CardTitle>
                {canvas?.metadata?.qualityScore && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Quality Score: {Math.round(canvas.metadata.qualityScore * 100)}%
                  </p>
                )}
              </div>
            </div>

            {showControls && (
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.25}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="px-2 text-sm font-medium">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetZoom}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Action Buttons */}
                {interactive && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(canvas)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onShare?.(canvas)}
                    >
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas Display */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div 
                className="canvas-display bg-white border-2 border-dashed border-gray-200 rounded-lg overflow-hidden"
                style={{ 
                  minHeight: '600px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-muted-foreground">Loading canvas...</p>
                  </div>
                ) : svgContent ? (
                  <div 
                    ref={svgRef}
                    className="canvas-svg"
                    style={{ 
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center',
                      transition: 'transform 0.2s ease'
                    }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                ) : (
                  <div className="text-center">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">No visual content available</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={loadCanvasVisual}
                    >
                      Generate Visual
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Panel */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="theme" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="theme">
                <Palette className="h-4 w-4 mr-1" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="export">
                <Download className="h-4 w-4 mr-1" />
                Export
              </TabsTrigger>
            </TabsList>

            {/* Theme Controls */}
            <TabsContent value="theme" className="space-y-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Visual Theme</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {themes.map((theme) => (
                    <Button
                      key={theme.id}
                      variant={selectedTheme === theme.id ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleThemeChange(theme.id)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{theme.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {theme.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Canvas Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Canvas Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{config.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sections:</span>
                      <span className="font-medium">{config.sections.length}</span>
                    </div>
                    {canvas?.metadata?.generatedAt && (
                      <div className="flex justify-between">
                        <span>Generated:</span>
                        <span className="font-medium">
                          {new Date(canvas.metadata.generatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Export Controls */}
            <TabsContent value="export" className="space-y-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Export Format</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {exportFormats.map((format) => {
                    const Icon = format.icon;
                    return (
                      <Button
                        key={format.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleExport(format.id)}
                        disabled={isLoading}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">{format.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {format.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleExport('png')}
                    disabled={isLoading}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Ready
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(`/canvas/${canvas?.id}/fullscreen`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Full Screen
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CanvasViewer;
