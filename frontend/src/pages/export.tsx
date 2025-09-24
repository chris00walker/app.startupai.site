import React from 'react'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, Package, Palette, Share2, Calendar } from "lucide-react"

export default function ExportPage() {
  const handleExportEvidencePack = () => {
    // TODO: Implement evidence pack export functionality
    console.log('Exporting evidence pack...')
  }

  const handleExportCanvas = (canvasType: string) => {
    // TODO: Implement canvas export functionality
    console.log(`Exporting ${canvasType} canvas...`)
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Export Evidence Pack", href: "/export" },
      ]}
    >
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
              <Palette className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Export Evidence Pack</h2>
              <p className="text-muted-foreground">
                Export your validation evidence, experiments, and business model canvases
              </p>
            </div>
          </div>
        </div>

        {/* Evidence Pack Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Evidence Pack
            </CardTitle>
            <CardDescription>
              Complete validation package including all evidence, experiments, and insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Evidence Items</p>
                  <p className="text-xs text-muted-foreground">47 validation points</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Calendar className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Experiments</p>
                  <p className="text-xs text-muted-foreground">12 completed tests</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Share2 className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Insights</p>
                  <p className="text-xs text-muted-foreground">8 key learnings</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Complete Evidence Package</p>
                <p className="text-xs text-muted-foreground">
                  Includes all validation evidence, experiment results, and business model iterations
                </p>
              </div>
              <Button onClick={handleExportEvidencePack} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Pack
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Individual Canvas Exports */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Canvas Exports</CardTitle>
            <CardDescription>
              Export specific business model canvases and validation frameworks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Business Model Canvas</h4>
                    <Badge variant="secondary" className="text-xs">9 sections completed</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete business model with validation status
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleExportCanvas('BMC')}
                >
                  <Download className="w-3 h-3 mr-2" />
                  Export BMC
                </Button>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Value Proposition Canvas</h4>
                    <Badge variant="secondary" className="text-xs">6 sections completed</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Customer profile and value map with fit analysis
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleExportCanvas('VPC')}
                >
                  <Download className="w-3 h-3 mr-2" />
                  Export VPC
                </Button>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Testing Business Ideas</h4>
                    <Badge variant="secondary" className="text-xs">4 phases tracked</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Experiment library and validation results
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleExportCanvas('TBI')}
                >
                  <Download className="w-3 h-3 mr-2" />
                  Export TBI
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Formats */}
        <Card>
          <CardHeader>
            <CardTitle>Export Formats</CardTitle>
            <CardDescription>
              Choose your preferred format for sharing and presentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="p-3 border rounded-lg text-center">
                <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">PDF Report</p>
                <p className="text-xs text-muted-foreground">Professional format</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Package className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">JSON Data</p>
                <p className="text-xs text-muted-foreground">Raw data export</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Share2 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">PowerPoint</p>
                <p className="text-xs text-muted-foreground">Presentation ready</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Download className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium">Excel</p>
                <p className="text-xs text-muted-foreground">Spreadsheet format</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
