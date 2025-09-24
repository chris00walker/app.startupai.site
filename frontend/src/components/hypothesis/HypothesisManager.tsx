import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Target, Users, Cog, DollarSign, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

// Types
interface Hypothesis {
  id: string
  statement: string
  type: 'desirable' | 'feasible' | 'viable'
  importance: 'high' | 'medium' | 'low'
  evidence: 'none' | 'weak' | 'strong'
  status: 'untested' | 'testing' | 'validated' | 'invalidated'
  source: string // BMC section or VPC section
  createdAt: Date
  updatedAt: Date
}

// Mock data
const mockHypotheses: Hypothesis[] = [
  {
    id: '1',
    statement: 'We believe that millennial parents with kids ages 5-9 will pay $15 a month for curated science projects that match their kids\' education level',
    type: 'desirable',
    importance: 'high',
    evidence: 'none',
    status: 'untested',
    source: 'Value Propositions',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    statement: 'We believe we can purchase science project materials at wholesale for less than $3 a box',
    type: 'viable',
    importance: 'high',
    evidence: 'weak',
    status: 'testing',
    source: 'Cost Structure',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    statement: 'We believe we can create partnerships with educational content providers',
    type: 'feasible',
    importance: 'medium',
    evidence: 'strong',
    status: 'validated',
    source: 'Key Partners',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-25')
  }
]

const typeConfig = {
  desirable: { 
    label: 'Desirable', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Users,
    description: 'Do they want this?'
  },
  feasible: { 
    label: 'Feasible', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Cog,
    description: 'Can we do this?'
  },
  viable: { 
    label: 'Viable', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: DollarSign,
    description: 'Should we do this?'
  }
}

const importanceConfig = {
  high: { label: 'High', color: 'bg-red-100 text-red-800' },
  medium: { label: 'Medium', color: 'bg-orange-100 text-orange-800' },
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800' }
}

const evidenceConfig = {
  none: { label: 'No Evidence', color: 'bg-red-100 text-red-800' },
  weak: { label: 'Weak Evidence', color: 'bg-orange-100 text-orange-800' },
  strong: { label: 'Strong Evidence', color: 'bg-green-100 text-green-800' }
}

const statusConfig = {
  untested: { label: 'Untested', color: 'bg-gray-100 text-gray-800', icon: Clock },
  testing: { label: 'Testing', color: 'bg-blue-100 text-blue-800', icon: Target },
  validated: { label: 'Validated', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  invalidated: { label: 'Invalidated', color: 'bg-red-100 text-red-800', icon: XCircle }
}

export default function HypothesisManager() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(mockHypotheses)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newHypothesis, setNewHypothesis] = useState({
    statement: '',
    type: 'desirable' as const,
    importance: 'medium' as const,
    source: ''
  })

  const filteredHypotheses = selectedType === 'all' 
    ? hypotheses 
    : hypotheses.filter(h => h.type === selectedType)

  const handleCreateHypothesis = () => {
    const hypothesis: Hypothesis = {
      id: Date.now().toString(),
      statement: newHypothesis.statement,
      type: newHypothesis.type,
      importance: newHypothesis.importance,
      evidence: 'none',
      status: 'untested',
      source: newHypothesis.source,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setHypotheses([...hypotheses, hypothesis])
    setNewHypothesis({ statement: '', type: 'desirable', importance: 'medium', source: '' })
    setIsCreateDialogOpen(false)
  }

  // Prioritization Matrix Data
  const getMatrixPosition = (hypothesis: Hypothesis) => {
    const importanceScore = hypothesis.importance === 'high' ? 2 : hypothesis.importance === 'medium' ? 1 : 0
    const evidenceScore = hypothesis.evidence === 'strong' ? 2 : hypothesis.evidence === 'weak' ? 1 : 0
    return { importance: importanceScore, evidence: evidenceScore }
  }

  const matrixQuadrants = {
    topRight: hypotheses.filter(h => {
      const pos = getMatrixPosition(h)
      return pos.importance >= 1 && pos.evidence <= 1
    }),
    topLeft: hypotheses.filter(h => {
      const pos = getMatrixPosition(h)
      return pos.importance >= 1 && pos.evidence >= 1
    }),
    bottomRight: hypotheses.filter(h => {
      const pos = getMatrixPosition(h)
      return pos.importance === 0 && pos.evidence <= 1
    }),
    bottomLeft: hypotheses.filter(h => {
      const pos = getMatrixPosition(h)
      return pos.importance === 0 && pos.evidence >= 1
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Hypotheses</h2>
          <p className="text-muted-foreground">
            Identify, prioritize, and validate your key business assumptions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Hypothesis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Hypothesis</DialogTitle>
              <DialogDescription>
                Create a testable, precise, and discrete business hypothesis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="statement">Hypothesis Statement</Label>
                <Textarea
                  id="statement"
                  placeholder="We believe that..."
                  value={newHypothesis.statement}
                  onChange={(e) => setNewHypothesis({...newHypothesis, statement: e.target.value})}
                  className="min-h-20"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newHypothesis.type} onValueChange={(value: any) => setNewHypothesis({...newHypothesis, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desirable">Desirable</SelectItem>
                      <SelectItem value="feasible">Feasible</SelectItem>
                      <SelectItem value="viable">Viable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="importance">Importance</Label>
                  <Select value={newHypothesis.importance} onValueChange={(value: any) => setNewHypothesis({...newHypothesis, importance: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select value={newHypothesis.source} onValueChange={(value) => setNewHypothesis({...newHypothesis, source: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Value Propositions">Value Propositions</SelectItem>
                      <SelectItem value="Customer Segments">Customer Segments</SelectItem>
                      <SelectItem value="Channels">Channels</SelectItem>
                      <SelectItem value="Customer Relationships">Customer Relationships</SelectItem>
                      <SelectItem value="Revenue Streams">Revenue Streams</SelectItem>
                      <SelectItem value="Key Resources">Key Resources</SelectItem>
                      <SelectItem value="Key Activities">Key Activities</SelectItem>
                      <SelectItem value="Key Partners">Key Partners</SelectItem>
                      <SelectItem value="Cost Structure">Cost Structure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateHypothesis} disabled={!newHypothesis.statement.trim()}>
                Create Hypothesis
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Hypothesis List</TabsTrigger>
          <TabsTrigger value="matrix">Prioritization Matrix</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Type Filter */}
          <div className="flex gap-2">
            <Button 
              variant={selectedType === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              All ({hypotheses.length})
            </Button>
            {Object.entries(typeConfig).map(([type, config]) => {
              const count = hypotheses.filter(h => h.type === type).length
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  <config.icon className="h-4 w-4 mr-1" />
                  {config.label} ({count})
                </Button>
              )
            })}
          </div>

          {/* Hypothesis Cards */}
          <div className="grid gap-4">
            {filteredHypotheses.map((hypothesis) => {
              const typeInfo = typeConfig[hypothesis.type]
              const StatusIcon = statusConfig[hypothesis.status].icon
              
              return (
                <Card key={hypothesis.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className={typeInfo.color}>
                            <typeInfo.icon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                          <Badge className={importanceConfig[hypothesis.importance].color}>
                            {importanceConfig[hypothesis.importance].label}
                          </Badge>
                          <Badge className={evidenceConfig[hypothesis.evidence].color}>
                            {evidenceConfig[hypothesis.evidence].label}
                          </Badge>
                          <Badge className={statusConfig[hypothesis.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[hypothesis.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm leading-relaxed">{hypothesis.statement}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Source: {hypothesis.source}</span>
                          <span>Created: {hypothesis.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assumptions Prioritization Matrix</CardTitle>
              <CardDescription>
                Focus on the top-right quadrant: important hypotheses with little evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 h-96">
                {/* Top Left - Share */}
                <div className="border-2 border-green-200 bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-green-900">Share</h3>
                    <Badge className="bg-green-100 text-green-800">
                      Important + Have Evidence
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {matrixQuadrants.topLeft.map(h => (
                      <div key={h.id} className="p-2 bg-white rounded border text-xs">
                        {h.statement.substring(0, 80)}...
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Right - Experiment */}
                <div className="border-2 border-red-200 bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-red-900">Experiment</h3>
                    <Badge className="bg-red-100 text-red-800">
                      Important + No Evidence
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {matrixQuadrants.topRight.map(h => (
                      <div key={h.id} className="p-2 bg-white rounded border text-xs border-red-200">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          <span className="font-medium">Priority</span>
                        </div>
                        {h.statement.substring(0, 80)}...
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Left */}
                <div className="border-2 border-gray-200 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700">Monitor</h3>
                    <Badge className="bg-gray-100 text-gray-800">
                      Less Important + Have Evidence
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {matrixQuadrants.bottomLeft.map(h => (
                      <div key={h.id} className="p-2 bg-white rounded border text-xs">
                        {h.statement.substring(0, 80)}...
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Right */}
                <div className="border-2 border-orange-200 bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-orange-900">Consider</h3>
                    <Badge className="bg-orange-100 text-orange-800">
                      Less Important + No Evidence
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {matrixQuadrants.bottomRight.map(h => (
                      <div key={h.id} className="p-2 bg-white rounded border text-xs">
                        {h.statement.substring(0, 80)}...
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Matrix Labels */}
              <div className="mt-4 flex justify-center">
                <div className="text-center">
                  <div className="text-sm font-medium mb-2">Evidence Level</div>
                  <div className="flex items-center gap-8">
                    <span className="text-sm text-muted-foreground">Have Evidence</span>
                    <span className="text-sm text-muted-foreground">No Evidence</span>
                  </div>
                </div>
              </div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90">
                <div className="text-sm font-medium mb-2">Importance</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Hypotheses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hypotheses.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all business areas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {matrixQuadrants.topRight.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need immediate testing
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Validation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((hypotheses.filter(h => h.status === 'validated').length / hypotheses.length) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Hypotheses validated
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
