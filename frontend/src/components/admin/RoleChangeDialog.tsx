'use client';

/**
 * Role Change Dialog Component
 *
 * Dialog for changing a user's role with reason requirement.
 *
 * @story US-A08
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RoleChangeDialogProps {
  userId: string;
  userEmail: string;
  currentRole: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChanged: (newRole: string) => void;
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'founder', label: 'Founder' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'trial', label: 'Trial' },
];

export function RoleChangeDialog({
  userId,
  userEmail,
  currentRole,
  open,
  onOpenChange,
  onRoleChanged,
}: RoleChangeDialogProps) {
  const [newRole, setNewRole] = useState(currentRole);
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleRoleChange = async () => {
    if (!newRole || !reason.trim()) {
      toast.error('Please provide a reason for the role change');
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole, reason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.data.message);
        onRoleChanged(newRole);
        onOpenChange(false);
        setReason('');
      } else {
        toast.error(data.error?.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setNewRole(currentRole);
      setReason('');
    }
    onOpenChange(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change User Role</AlertDialogTitle>
          <AlertDialogDescription>
            This will change the role for {userEmail}. This action will be logged.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">New Role</label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Reason for change <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Explain why you're changing this user's role..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRoleChange}
            disabled={updating || !reason.trim()}
          >
            {updating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Confirm Change
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
