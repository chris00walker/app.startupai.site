/**
 * Compass Illustration Component
 *
 * A reusable illustration component featuring the 404 compass design from Figma.
 * Used for navigation-related pages like 404 errors to reinforce the "finding your way" metaphor.
 *
 * Design Source: Figma file 4yEXWnVK7tFJQzLKvIcsWo, node 25:3
 *
 * @story US-UX01
 */

import * as React from 'react';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const COMPASS_IMAGE_URL =
  'https://eqxropalhxjeyvfcoyxg.supabase.co/storage/v1/object/public/design-assets/shared/illustrations/fedb30aa-a517-42fa-96e2-b8337e02708b.png';

const compassVariants = cva('object-contain', {
  variants: {
    size: {
      sm: 'w-32 h-32 sm:w-40 sm:h-40',
      md: 'w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64',
      lg: 'w-64 h-64 sm:w-80 sm:h-80 md:w-[400px] md:h-[400px]',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
});

export interface CompassIllustrationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof compassVariants> {
  /**
   * Alt text for accessibility. Defaults to a descriptive label.
   */
  alt?: string;
  /**
   * Whether to load the image with priority (above the fold).
   * @default true
   */
  priority?: boolean;
}

const CompassIllustration = React.forwardRef<
  HTMLDivElement,
  CompassIllustrationProps
>(
  (
    {
      className,
      size,
      alt = 'Compass illustration representing navigation and finding your way',
      priority = true,
      ...props
    },
    ref
  ) => {
    // Get the pixel dimensions for Next.js Image based on size variant
    const dimensions = {
      sm: { width: 160, height: 160 },
      md: { width: 256, height: 256 },
      lg: { width: 400, height: 400 },
    };

    const { width, height } = dimensions[size ?? 'lg'];

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <Image
          src={COMPASS_IMAGE_URL}
          alt={alt}
          width={width}
          height={height}
          className={cn(compassVariants({ size }))}
          priority={priority}
        />
      </div>
    );
  }
);

CompassIllustration.displayName = 'CompassIllustration';

export { CompassIllustration, compassVariants };
