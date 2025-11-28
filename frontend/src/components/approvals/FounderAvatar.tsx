/**
 * FounderAvatar Component
 *
 * Displays an AI Founder character avatar with tooltip showing name and specialty.
 * Falls back to an icon-based avatar if the image is not available.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Compass,
  DollarSign,
  TrendingUp,
  Shield,
  Cpu,
  Brain,
} from 'lucide-react';
import type { OwnerRole, FounderInfo } from '@/types/crewai';
import { FOUNDER_INFO } from '@/types/crewai';

interface FounderAvatarProps {
  role: OwnerRole;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

// Role-specific colors for fallback avatars
const ROLE_COLORS: Record<OwnerRole, { bg: string; text: string }> = {
  sage: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  forge: { bg: 'bg-orange-100', text: 'text-orange-600' },
  pulse: { bg: 'bg-green-100', text: 'text-green-600' },
  compass: { bg: 'bg-blue-100', text: 'text-blue-600' },
  guardian: { bg: 'bg-purple-100', text: 'text-purple-600' },
  ledger: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
};

// Role-specific icons for fallback
const ROLE_ICONS: Record<OwnerRole, React.ComponentType<{ className?: string }>> = {
  sage: Brain,
  forge: Cpu,
  pulse: TrendingUp,
  compass: Compass,
  guardian: Shield,
  ledger: DollarSign,
};

const SIZE_CLASSES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

const ICON_SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function FounderAvatar({
  role,
  size = 'md',
  showTooltip = true,
  className,
}: FounderAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const founderInfo = FOUNDER_INFO[role];
  const colors = ROLE_COLORS[role];
  const IconComponent = ROLE_ICONS[role];

  const avatarContent = (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      {!imageError && founderInfo.avatarPath ? (
        <div className="relative h-full w-full">
          <Image
            src={founderInfo.avatarPath}
            alt={founderInfo.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <AvatarFallback className={cn(colors.bg, colors.text)}>
          <IconComponent className={ICON_SIZE_CLASSES[size]} />
        </AvatarFallback>
      )}
    </Avatar>
  );

  if (!showTooltip) {
    return avatarContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {avatarContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{founderInfo.name}</p>
            <p className="text-xs text-muted-foreground">{founderInfo.title}</p>
            <p className="text-xs">{founderInfo.specialty}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * FounderAvatarWithLabel - Shows avatar with name and title inline
 */
interface FounderAvatarWithLabelProps extends FounderAvatarProps {
  showTitle?: boolean;
}

export function FounderAvatarWithLabel({
  role,
  size = 'md',
  showTitle = false,
  className,
}: FounderAvatarWithLabelProps) {
  const founderInfo = FOUNDER_INFO[role];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <FounderAvatar role={role} size={size} showTooltip={false} />
      <div className="min-w-0">
        <p className="font-medium truncate">{founderInfo.name}</p>
        {showTitle && (
          <p className="text-xs text-muted-foreground truncate">{founderInfo.title}</p>
        )}
      </div>
    </div>
  );
}

export default FounderAvatar;
