import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Gift, TrendingUp, Pill, Smile, Frown, List, Save, Download, Upload } from 'lucide-react';

interface VPCData {
  valuePropositionTitle: string
  customerSegmentTitle: string
  valueMap: {
    productsAndServices: string[]
    gainCreators: string[]
    painRelievers: string[]
  }
  customerProfile: {
    gains: string[]
    pains: string[]
    jobs: string[]
  }
}

const defaultVPC: VPCData = {
  valuePropositionTitle: "",
  customerSegmentTitle: "",
  valueMap: { 
    productsAndServices: [""], 
    gainCreators: [""], 
    painRelievers: [""] 
  },
  customerProfile: { 
    gains: [""], 
    pains: [""], 
    jobs: [""] 
  }
}

interface ValuePropositionCanvasProps {
  canvasId?: string
  clientId?: string
  initialData?: VPCData
  onSave?: (data: VPCData) => void
  readOnly?: boolean
}

export default function ValuePropositionCanvas({ 
  canvasId, 
  clientId, 
  initialData, 
  onSave, 
  readOnly = false 
}: ValuePropositionCanvasProps) {
  const [vpcData, setVpcData] = useState<VPCData>(defaultVPC)

  useEffect(() => {
    if (initialData) {
      // Merge initialData with defaultVPC to ensure all required fields exist
      const validatedData = {
        valuePropositionTitle: initialData.valuePropositionTitle || "",
        customerSegmentTitle: initialData.customerSegmentTitle || "",
        valueMap: {
          productsAndServices: initialData.valueMap?.productsAndServices || [""],
          gainCreators: initialData.valueMap?.gainCreators || [""],
          painRelievers: initialData.valueMap?.painRelievers || [""]
        },
        customerProfile: {
          gains: initialData.customerProfile?.gains || [""],
          pains: initialData.customerProfile?.pains || [""],
          jobs: initialData.customerProfile?.jobs || [""]
        }
      }
      setVpcData(validatedData)
    } else {
      // Load from localStorage
      const storageKey = canvasId ? `vpc-canvas-${canvasId}` : 'vpc:v1'
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const parsedData = JSON.parse(saved)
          // Validate and merge with defaults
          const validatedData = {
            valuePropositionTitle: parsedData.valuePropositionTitle || "",
            customerSegmentTitle: parsedData.customerSegmentTitle || "",
            valueMap: {
              productsAndServices: parsedData.valueMap?.productsAndServices || [""],
              gainCreators: parsedData.valueMap?.gainCreators || [""],
              painRelievers: parsedData.valueMap?.painRelievers || [""]
            },
            customerProfile: {
              gains: parsedData.customerProfile?.gains || [""],
              pains: parsedData.customerProfile?.pains || [""],
              jobs: parsedData.customerProfile?.jobs || [""]
            }
          }
          setVpcData(validatedData)
        } catch (e) {
          console.error('Failed to load VPC data:', e)
          setVpcData(defaultVPC)
        }
      }
    }
  }, [initialData])

  const saveToLocalStorage = () => {
    const storageKey = canvasId ? `vpc-canvas-${canvasId}` : 'vpc:v1'
    localStorage.setItem(storageKey, JSON.stringify(vpcData))
  }

  const handleSave = () => {
    saveToLocalStorage()
    onSave?.(vpcData)
  }

  const exportJSON = () => {
    const dataStr = JSON.stringify(vpcData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'value-proposition-canvas.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string)
          setVpcData(imported)
        } catch (error) {
          console.error('Failed to import JSON:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  const updateField = (section: keyof VPCData, field: string, value: string | string[]) => {
    setVpcData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && !Array.isArray(prev[section])
        ? { ...prev[section], [field]: value }
        : value
    }))
  }

  const updateArrayField = (section: 'valueMap' | 'customerProfile', field: string, index: number, value: string) => {
    setVpcData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].map((item, i) => i === index ? value : item)
      }
    }))
  }

  const addArrayItem = (section: 'valueMap' | 'customerProfile', field: string) => {
    setVpcData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...prev[section][field], ""]
      }
    }))
  }

  const removeArrayItem = (section: 'valueMap' | 'customerProfile', field: string, index: number) => {
    setVpcData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index)
      }
    }))
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
      {/* Header */}
      <div className="text-center mb-8 print:mb-4">
        <h1 className="text-3xl font-bold mb-4 print:text-2xl">Value Proposition Canvas</h1>
        
        {!readOnly && (
          <div className="flex justify-center gap-2 mb-6 print:hidden">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button onClick={exportJSON} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importJSON}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import JSON
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Title Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <Label htmlFor="vpTitle" className="text-sm font-medium">Value Proposition:</Label>
          <Input
            id="vpTitle"
            value={vpcData.valuePropositionTitle}
            onChange={(e) => updateField('valuePropositionTitle', '', e.target.value)}
            placeholder="Enter value proposition title..."
            disabled={readOnly}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="csTitle" className="text-sm font-medium">Customer Segment:</Label>
          <Input
            id="csTitle"
            value={vpcData.customerSegmentTitle}
            onChange={(e) => updateField('customerSegmentTitle', '', e.target.value)}
            placeholder="Enter customer segment title..."
            disabled={readOnly}
            className="mt-1"
          />
        </div>
      </div>

      {/* Main Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
        {/* Value Map (Left Side) */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Value Map</h2>
          </div>

          {/* Products & Services */}
          <Card className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="w-5 h-5 text-purple-600" />
                Products & Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vpcData.valueMap.productsAndServices.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={item}
                    onChange={(e) => updateArrayField('valueMap', 'productsAndServices', index, e.target.value)}
                    placeholder="What products and services do you offer?"
                    disabled={readOnly}
                    className="min-h-[60px] resize-none"
                  />
                  {!readOnly && vpcData.valueMap.productsAndServices.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('valueMap', 'productsAndServices', index)}
                      className="px-2"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addArrayItem('valueMap', 'productsAndServices')}
                  className="w-full border-2 border-dashed"
                >
                  + Add Product/Service
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Gain Creators */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Gain Creators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vpcData.valueMap.gainCreators.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={item}
                    onChange={(e) => updateArrayField('valueMap', 'gainCreators', index, e.target.value)}
                    placeholder="How do you create customer gains?"
                    disabled={readOnly}
                    className="min-h-[60px] resize-none"
                  />
                  {!readOnly && vpcData.valueMap.gainCreators.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('valueMap', 'gainCreators', index)}
                      className="px-2"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addArrayItem('valueMap', 'gainCreators')}
                  className="w-full border-2 border-dashed"
                >
                  + Add Gain Creator
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pain Relievers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pill className="w-5 h-5 text-blue-600" />
                Pain Relievers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vpcData.valueMap.painRelievers.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={item}
                    onChange={(e) => updateArrayField('valueMap', 'painRelievers', index, e.target.value)}
                    placeholder="How do you relieve customer pains?"
                    disabled={readOnly}
                    className="min-h-[60px] resize-none"
                  />
                  {!readOnly && vpcData.valueMap.painRelievers.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('valueMap', 'painRelievers', index)}
                      className="px-2"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addArrayItem('valueMap', 'painRelievers')}
                  className="w-full border-2 border-dashed"
                >
                  + Add Pain Reliever
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Profile (Right Side) */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Customer Profile</h2>
          </div>

          {/* Customer Jobs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <List className="w-5 h-5 text-blue-600" />
                Customer Jobs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vpcData.customerProfile.jobs.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={item}
                    onChange={(e) => updateArrayField('customerProfile', 'jobs', index, e.target.value)}
                    placeholder="What jobs is your customer trying to get done?"
                    disabled={readOnly}
                    className="min-h-[60px] resize-none"
                  />
                  {!readOnly && vpcData.customerProfile.jobs.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('customerProfile', 'jobs', index)}
                      className="px-2"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addArrayItem('customerProfile', 'jobs')}
                  className="w-full border-2 border-dashed"
                >
                  + Add Customer Job
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Gains */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smile className="w-5 h-5 text-green-600" />
                Gains
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vpcData.customerProfile.gains.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={item}
                    onChange={(e) => updateArrayField('customerProfile', 'gains', index, e.target.value)}
                    placeholder="What gains does your customer expect?"
                    disabled={readOnly}
                    className="min-h-[60px] resize-none"
                  />
                  {!readOnly && vpcData.customerProfile.gains.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('customerProfile', 'gains', index)}
                      className="px-2"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addArrayItem('customerProfile', 'gains')}
                  className="w-full border-2 border-dashed"
                >
                  + Add Gain
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pains */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Frown className="w-5 h-5 text-red-600" />
                Pains
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vpcData.customerProfile.pains.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={item}
                    onChange={(e) => updateArrayField('customerProfile', 'pains', index, e.target.value)}
                    placeholder="What pains does your customer experience?"
                    disabled={readOnly}
                    className="min-h-[60px] resize-none"
                  />
                  {!readOnly && vpcData.customerProfile.pains.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('customerProfile', 'pains', index)}
                      className="px-2"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addArrayItem('customerProfile', 'pains')}
                  className="w-full border-2 border-dashed"
                >
                  + Add Pain
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Attribution */}
      <Separator className="my-8" />
      <div className="flex justify-between items-center text-sm text-gray-600 print:text-xs">
        <div>
          <p>Turn ideas into revenue with</p>
          <p>Strategyzer's innovation programs</p>
        </div>
        <div className="text-right">
          <p>Copyright Strategyzer AG. The creators of Business Model Generation and Strategyzer.</p>
          <p className="font-bold text-lg mt-1">Strategyzer</p>
          <p>strategyzer.com/innovation</p>
        </div>
      </div>
    </div>
  )
}
