/**
 * Export Dialog
 *
 * Modal for exporting narrative as PDF with QR code option.
 *
 * @story US-NL01
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, QrCode, Loader2 } from 'lucide-react';
import { EXPORT_COPY } from '@/lib/constants/narrative';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: { includeQrCode: boolean; includeEvidence: boolean }) => Promise<{
    download_url?: string;
    verification_url?: string;
    summary_card_url?: string;
  } | undefined>;
  isExporting?: boolean;
}

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  isExporting,
}: ExportDialogProps) {
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [includeEvidence, setIncludeEvidence] = useState(false);
  const [result, setResult] = useState<{
    download_url?: string;
    verification_url?: string;
    summary_card_url?: string;
  } | null>(null);

  const handleExport = async () => {
    const data = await onExport({ includeQrCode, includeEvidence });
    if (data) {
      setResult(data);
    }
  };

  const handleClose = () => {
    setResult(null);
    setIncludeEvidence(false);
    setIncludeQrCode(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{EXPORT_COPY.pdf_title}</DialogTitle>
          <DialogDescription>
            {EXPORT_COPY.pdf_description}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="qr-code"
                  checked={includeQrCode}
                  onCheckedChange={(checked) => setIncludeQrCode(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="qr-code" className="text-sm font-medium cursor-pointer">
                    {EXPORT_COPY.qr_code_option}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {EXPORT_COPY.qr_code_help}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="include-evidence"
                  checked={includeEvidence}
                  onCheckedChange={(checked) => setIncludeEvidence(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="include-evidence" className="text-sm font-medium cursor-pointer">
                    Include validation evidence appendix
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Adds evidence snapshots, gate scores, and experiment outcomes to the PDF.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
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
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Ready</Badge>
                <span className="text-sm">Your PDF has been generated.</span>
              </div>

              <div className="space-y-3">
                {result.download_url && (
                  <a
                    href={result.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Download PDF</span>
                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                  </a>
                )}

                {result.verification_url && (
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="h-4 w-4" />
                      <span className="text-sm font-medium">Verification URL</span>
                    </div>
                    <p className="text-xs text-muted-foreground break-all">
                      {result.verification_url}
                    </p>
                  </div>
                )}

                {result.summary_card_url && (
                  <a
                    href={result.summary_card_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Download Summary Card (PNG)</span>
                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                  </a>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
