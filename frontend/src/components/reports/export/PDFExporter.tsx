/**
 * @story US-F06, US-F16
 */
/**
 * PDF Exporter Component
 *
 * Uses react-to-print to generate PDF exports of the report.
 * Falls back to window.print() if react-to-print is not available.
 */

'use client'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

interface PDFExporterProps {
  projectName: string
  projectId?: string
  reportRef: React.RefObject<HTMLDivElement>
  className?: string
}

export function PDFExporter({ projectName, projectId, reportRef, className }: PDFExporterProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = useCallback(async () => {
    if (!reportRef.current) return

    // Track export event
    trackEvent('report_exported', {
      project_id: projectId,
      project_name: projectName,
      export_format: 'pdf',
      category: 'ui_interaction',
    })

    setIsPrinting(true)

    try {
      // Dynamically import react-to-print to avoid SSR issues
      const { useReactToPrint } = await import('react-to-print')

      // Create a temporary wrapper to use the hook pattern
      const printFn = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
          // Fallback to native print
          window.print()
          return
        }

        const content = reportRef.current?.innerHTML || ''
        const styles = Array.from(document.styleSheets)
          .map((styleSheet) => {
            try {
              return Array.from(styleSheet.cssRules)
                .map((rule) => rule.cssText)
                .join('')
            } catch {
              return ''
            }
          })
          .join('')

        const documentTitle = `${projectName.replace(/[^a-zA-Z0-9]/g, '-')}-CrewAI-Analysis-${new Date().toISOString().split('T')[0]}`

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${documentTitle}</title>
              <style>
                ${styles}
                @media print {
                  .no-print { display: none !important; }
                  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
                @page {
                  size: A4;
                  margin: 15mm;
                }
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                  line-height: 1.5;
                  color: #1a1a1a;
                  background: white;
                }
              </style>
            </head>
            <body>
              <div class="print-content">
                ${content}
              </div>
            </body>
          </html>
        `)

        printWindow.document.close()

        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.print()
          printWindow.close()
        }

        // Fallback timeout
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.print()
            printWindow.close()
          }
        }, 1000)
      }

      printFn()
    } catch (error) {
      console.error('PDF export error:', error)
      // Fallback to native print
      window.print()
    } finally {
      setIsPrinting(false)
    }
  }, [projectName, projectId, reportRef])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      disabled={isPrinting}
      className={className}
    >
      {isPrinting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </>
      )}
    </Button>
  )
}

export default PDFExporter
