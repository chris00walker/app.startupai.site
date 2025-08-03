/**
 * Canvas Dashboard Page
 * 
 * Main dashboard for managing and viewing Strategyzer canvases
 * Integrates CanvasGallery, CanvasViewer, and CanvasEditor components
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  TrendingUp, 
  Users, 
  Clock,
  BarChart3,
  Eye,
  Edit,
  Share,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

// Import our canvas components
import CanvasGallery from '@/components/canvas/CanvasGallery';
import CanvasViewer from '@/components/canvas/CanvasViewer';
import CanvasEditor from '@/components/canvas/CanvasEditor';
import Layout from '@/components/layout/Layout';

const CanvasDashboard = () => {
  const router = useRouter();
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('gallery'); // 'gallery' | 'viewer' | 'editor'
  const [selectedCanvas, setSelectedCanvas] = useState(null);
  const [stats, setStats] = useState({
    totalCanvases: 0,
    recentActivity: 0,
    collaborators: 0,
    completionRate: 0
  });

  // Load canvases on mount
  useEffect(() => {
    loadCanvases();
    loadStats();
  }, []);

  // Load canvases from API
  const loadCanvases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/canvas');
      if (response.ok) {
        const data = await response.json();
        setCanvases(data.canvases || []);
      } else {
        toast.error('Failed to load canvases');
      }
    } catch (error) {
      console.error('Error loading canvases:', error);
      toast.error('Error loading canvases');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard stats
  const loadStats = async () => {
    try {
      const response = await fetch('/api/canvas/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Handle canvas creation
  const handleCreateCanvas = () => {
    router.push('/canvas/new');
  };

  // Handle canvas viewing
  const handleViewCanvas = (canvas) => {
    setSelectedCanvas(canvas);
    setActiveView('viewer');
  };

  // Handle canvas editing
  const handleEditCanvas = (canvas) => {
    setSelectedCanvas(canvas);
    setActiveView('editor');
  };

  // Handle canvas saving
  const handleSaveCanvas = async (canvasData) => {
    try {
      const method = canvasData.id ? 'PUT' : 'POST';
      const url = canvasData.id ? `/api/canvas/${canvasData.id}` : '/api/canvas';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(canvasData)
      });

      if (response.ok) {
        const savedCanvas = await response.json();
        
        // Update local state
        setCanvases(prev => {
          if (canvasData.id) {
            return prev.map(c => c.id === canvasData.id ? savedCanvas : c);
          } else {
            return [...prev, savedCanvas];
          }
        });

        setActiveView('gallery');
        setSelectedCanvas(null);
        toast.success('Canvas saved successfully');
      } else {
        throw new Error('Failed to save canvas');
      }
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  };

  // Handle canvas deletion
  const handleDeleteCanvas = async (canvasId) => {
    if (!window.confirm('Are you sure you want to delete this canvas?')) {
      return;
    }

    try {
      const response = await fetch(`/api/canvas/${canvasId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCanvases(prev => prev.filter(c => c.id !== canvasId));
        toast.success('Canvas deleted');
      } else {
        toast.error('Failed to delete canvas');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error deleting canvas');
    }
  };

  // Handle canvas export
  const handleExportCanvas = async (canvasId, format = 'pdf') => {
    try {
      const response = await fetch(`/api/canvas/${canvasId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvas.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success(`Canvas exported as ${format.toUpperCase()}`);
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  // Handle canvas sharing
  const handleShareCanvas = async (canvas) => {
    try {
      const shareUrl = `${window.location.origin}/canvas/${canvas.id}/share`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy share link');
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setActiveView('gallery');
    setSelectedCanvas(null);
  };

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Canvases',
      value: stats.totalCanvases,
      icon: BarChart3,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      icon: Clock,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Collaborators',
      value: stats.collaborators,
      icon: Users,
      color: 'purple',
      change: '+3'
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: 'orange',
      change: '+5%'
    }
  ];

  return (
    <Layout>
      <Head>
        <title>Canvas Dashboard - Strategyzer AI</title>
        <meta name="description" content="Manage and visualize your Strategyzer canvases" />
      </Head>

      <div className="canvas-dashboard p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Canvas Dashboard</h1>
            <p className="text-muted-foreground">
              Create, manage, and visualize your Strategyzer canvases
            </p>
          </div>
          
          {activeView === 'gallery' && (
            <Button onClick={handleCreateCanvas} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              New Canvas
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        {activeView === 'gallery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className={`text-xs text-${stat.color}-600 font-medium`}>
                          {stat.change} from last month
                        </p>
                      </div>
                      <div className={`p-3 bg-${stat.color}-100 rounded-full`}>
                        <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Main Content */}
        <div className="main-content">
          {/* Navigation Breadcrumb */}
          {activeView !== 'gallery' && (
            <div className="flex items-center gap-2 mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setActiveView('gallery')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Gallery
              </Button>
              {selectedCanvas && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-medium">
                    {selectedCanvas.name || 'Untitled Canvas'}
                  </span>
                  <Badge variant="outline">
                    {activeView === 'viewer' ? 'Viewing' : 'Editing'}
                  </Badge>
                </>
              )}
            </div>
          )}

          {/* Content Views */}
          {activeView === 'gallery' && (
            <CanvasGallery
              canvases={canvases}
              loading={loading}
              onView={handleViewCanvas}
              onEdit={handleEditCanvas}
              onCreate={handleCreateCanvas}
              onDelete={handleDeleteCanvas}
              onExport={handleExportCanvas}
              onShare={handleShareCanvas}
            />
          )}

          {activeView === 'viewer' && selectedCanvas && (
            <CanvasViewer
              canvas={selectedCanvas}
              onEdit={() => setActiveView('editor')}
              onShare={() => handleShareCanvas(selectedCanvas)}
              onExport={(format) => handleExportCanvas(selectedCanvas.id, format)}
            />
          )}

          {activeView === 'editor' && selectedCanvas && (
            <CanvasEditor
              canvas={selectedCanvas}
              onSave={handleSaveCanvas}
              onCancel={handleCancelEdit}
              collaborative={true}
            />
          )}
        </div>

        {/* Quick Actions Floating Panel */}
        {activeView === 'gallery' && canvases.length > 0 && (
          <div className="fixed bottom-6 right-6 flex flex-col gap-2">
            <Button
              size="sm"
              className="shadow-lg"
              onClick={handleCreateCanvas}
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick Create
            </Button>
          </div>
        )}

        {/* Canvas Actions Floating Panel */}
        {activeView === 'viewer' && selectedCanvas && (
          <div className="fixed bottom-6 right-6 flex flex-col gap-2">
            <Button
              size="sm"
              className="shadow-lg"
              onClick={() => setActiveView('editor')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="shadow-lg"
              onClick={() => handleShareCanvas(selectedCanvas)}
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="shadow-lg"
              onClick={() => handleExportCanvas(selectedCanvas.id, 'pdf')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CanvasDashboard;
