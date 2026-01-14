'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Loader2, RotateCcw, Archive, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useClients } from '@/hooks/useClients';

export function ClientsTab() {
  const [showArchived, setShowArchived] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const { clients, isLoading, archiveClient, unarchiveClient } = useClients({
    includeArchived: showArchived,
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleArchive = async () => {
    if (!selectedClientId || !selectedClient) return;
    setIsArchiving(true);
    try {
      await archiveClient(selectedClientId);
      toast.success(`"${selectedClient.name}" has been archived`);
      setSelectedClientId(null);
    } catch {
      toast.error('Failed to archive client. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    if (!selectedClientId || !selectedClient) return;
    setIsArchiving(true);
    try {
      await unarchiveClient(selectedClientId);
      toast.success(`"${selectedClient.name}" has been restored`);
      setSelectedClientId(null);
    } catch {
      toast.error('Failed to restore client. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Client Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Client Management</span>
          </CardTitle>
          <CardDescription>
            Archive or restore client relationships. Archived clients are hidden from your portfolio but their projects remain unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show Archived Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showArchived"
              checked={showArchived}
              onCheckedChange={(checked) => {
                setShowArchived(checked === true);
                setSelectedClientId(null);
              }}
            />
            <Label htmlFor="showArchived" className="text-sm font-normal cursor-pointer">
              Show archived clients
            </Label>
          </div>

          {/* Client Selector */}
          <div className="space-y-2">
            <Label htmlFor="clientSelect">Select Client</Label>
            <Select
              value={selectedClientId || ''}
              onValueChange={(value) => setSelectedClientId(value || null)}
            >
              <SelectTrigger id="clientSelect">
                <SelectValue placeholder="Choose a client to manage..." />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No clients found
                  </div>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}{client.company ? ` (${client.company})` : ''}
                      {client.isArchived ? ' [Archived]' : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Archive/Restore Buttons */}
          {selectedClient && (
            <div className="flex items-center space-x-3">
              {selectedClient.isArchived ? (
                <Button
                  variant="outline"
                  onClick={handleUnarchive}
                  disabled={isArchiving}
                  className="flex items-center"
                >
                  {isArchiving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                  )}
                  Restore Client
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="flex items-center text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                >
                  {isArchiving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  Archive Client
                </Button>
              )}
            </div>
          )}

          {!selectedClient && clients.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Select a client above to archive or restore them.
            </p>
          )}

          {clients.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {showArchived
                ? "You don't have any clients yet."
                : "You don't have any active clients. Check \"Show archived clients\" to see archived ones."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info Card (not a Danger Zone - archiving is non-destructive) */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-600">
            <Info className="h-5 w-5" />
            <span>About Client Archiving</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Archiving a client <strong>only hides them from your portfolio view</strong>.
              It does not affect:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The client&apos;s account or login access</li>
              <li>Their projects or validation data</li>
              <li>Any AI analysis results or reports</li>
              <li>Their ability to continue using the platform</li>
            </ul>
            <p className="pt-2">
              You can restore an archived client at any time by checking &quot;Show archived clients&quot;
              and selecting them.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
