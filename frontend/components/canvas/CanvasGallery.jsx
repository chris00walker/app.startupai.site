/**
 * Canvas Gallery Component
 * 
 * Grid view of multiple canvases with filtering, sorting, and bulk actions
 * Supports different view modes and canvas management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Grid3X3, 
  List, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Share,
  MoreHorizontal,
  Calendar,
  User,
  Star,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CanvasGallery = ({ 
  canvases = [], 
  onView, 
  onEdit, 
  onCreate,
  onDelete,
  onExport,
  onShare,
  loading = false,
  className = "" 
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCanvases, setSelectedCanvases] = useState([]);
  const [filteredCanvases, setFilteredCanvases] = useState([]);

  // Canvas type configurations
  const canvasTypes = {
    valueProposition: {
      title: 'Value Proposition Canvas',
      icon: '🎯',
      color: 'blue',
      description: 'Customer-product fit analysis'
    },
    businessModel: {
      title: 'Business Model Canvas',
      icon: '🏢',
      color: 'green',
      description: '9-block business model design'
    },
    testingBusinessIdeas: {
      title: 'Testing Business Ideas',
      icon: '🧪',
      color: 'purple',
      description: 'Experiment design and validation'
    }
  };

  // Filter and sort canvases
  useEffect(() => {
    let filtered = [...canvases];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(canvas =>
        canvas.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        canvas.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        canvas.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(canvas => canvas.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortBy === 'qualityScore') {
        aValue = a.metadata?.qualityScore || 0;
        bValue = b.metadata?.qualityScore || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCanvases(filtered);
  }, [canvases, searchQuery, filterType, sortBy, sortOrder]);

  // Handle canvas selection
  const toggleCanvasSelection = (canvasId) => {
    setSelectedCanvases(prev =>
      prev.includes(canvasId)
        ? prev.filter(id => id !== canvasId)
        : [...prev, canvasId]
    );
  };

  // Handle bulk actions
  const handleBulkExport = async () => {
    try {
      for (const canvasId of selectedCanvases) {
        await onExport?.(canvasId, 'pdf');
      }
      toast.success(`Exported ${selectedCanvases.length} canvases`);
      setSelectedCanvases([]);
    } catch (error) {
      toast.error('Bulk export failed');
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedCanvases.length} selected canvases?`)) {
      try {
        for (const canvasId of selectedCanvases) {
          await onDelete?.(canvasId);
        }
        toast.success(`Deleted ${selectedCanvases.length} canvases`);
        setSelectedCanvases([]);
      } catch (error) {
        toast.error('Bulk delete failed');
      }
    }
  };

  // Render canvas card
  const renderCanvasCard = (canvas) => {
    const config = canvasTypes[canvas.type] || canvasTypes.valueProposition;
    const isSelected = selectedCanvases.includes(canvas.id);

    return (
      <Card 
        key={canvas.id} 
        className={`cursor-pointer transition-all hover:shadow-lg ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => toggleCanvasSelection(canvas.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{config.icon}</span>
              <div>
                <CardTitle className="text-sm font-medium line-clamp-1">
                  {canvas.name || 'Untitled Canvas'}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {config.title}
                </p>
              </div>
            </div>
            
            <DropdownMenu onClick={(e) => e.stopPropagation()}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(canvas)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(canvas)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare?.(canvas)}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.(canvas.id, 'pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(canvas.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Canvas Preview */}
          <div className="aspect-video bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
            {canvas.visualAssets?.thumbnail ? (
              <img 
                src={canvas.visualAssets.thumbnail} 
                alt={canvas.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center">
                <span className="text-3xl">{config.icon}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  No preview
                </p>
              </div>
            )}
          </div>

          {/* Canvas Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`text-${config.color}-600`}>
                {config.title}
              </Badge>
              {canvas.metadata?.qualityScore && (
                <Badge variant="secondary">
                  {Math.round(canvas.metadata.qualityScore * 100)}%
                </Badge>
              )}
            </div>

            {canvas.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {canvas.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {canvas.clientName || 'Unknown Client'}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(canvas.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render list item
  const renderCanvasListItem = (canvas) => {
    const config = canvasTypes[canvas.type] || canvasTypes.valueProposition;
    const isSelected = selectedCanvases.includes(canvas.id);

    return (
      <Card 
        key={canvas.id} 
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => toggleCanvasSelection(canvas.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Canvas Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">{config.icon}</span>
              </div>
            </div>

            {/* Canvas Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">
                  {canvas.name || 'Untitled Canvas'}
                </h3>
                <Badge variant="outline" className={`text-${config.color}-600`}>
                  {config.title}
                </Badge>
                {canvas.metadata?.qualityScore && (
                  <Badge variant="secondary">
                    {Math.round(canvas.metadata.qualityScore * 100)}%
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {canvas.clientName || 'Unknown Client'}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(canvas.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView?.(canvas)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(canvas)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onShare?.(canvas)}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport?.(canvas.id, 'pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(canvas.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading canvases...</span>
      </div>
    );
  }

  return (
    <div className={`canvas-gallery ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Canvas Gallery</h2>
          <p className="text-muted-foreground">
            {filteredCanvases.length} of {canvases.length} canvases
          </p>
        </div>
        
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Canvas
        </Button>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search canvases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="valueProposition">Value Proposition</SelectItem>
                  <SelectItem value="businessModel">Business Model</SelectItem>
                  <SelectItem value="testingBusinessIdeas">Testing Ideas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Last Updated</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="qualityScore">Quality Score</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCanvases.length > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedCanvases.length} canvas{selectedCanvases.length > 1 ? 'es' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleBulkExport}>
                  <Download className="h-4 w-4 mr-1" />
                  Export All
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete All
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedCanvases([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Canvas Grid/List */}
      {filteredCanvases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-lg font-medium mb-2">No canvases found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first canvas to get started'
              }
            </p>
            {!searchQuery && filterType === 'all' && (
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Canvas
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredCanvases.map(canvas => 
            viewMode === 'grid' 
              ? renderCanvasCard(canvas)
              : renderCanvasListItem(canvas)
          )}
        </div>
      )}
    </div>
  );
};

export default CanvasGallery;
