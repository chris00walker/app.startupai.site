/**
 * PDF Font Registration
 *
 * Registers Inter font family with @react-pdf/renderer at module level.
 * Font files are read from the filesystem (public/fonts/) for server-side rendering.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :3196-3199
 */

import { Font } from '@react-pdf/renderer';
import path from 'path';

const fontsDir = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: path.join(fontsDir, 'Inter-Regular.ttf'),
      fontWeight: 400,
    },
    {
      src: path.join(fontsDir, 'Inter-Medium.ttf'),
      fontWeight: 500,
    },
    {
      src: path.join(fontsDir, 'Inter-SemiBold.ttf'),
      fontWeight: 600,
    },
    {
      src: path.join(fontsDir, 'Inter-Bold.ttf'),
      fontWeight: 700,
    },
  ],
});

// Disable hyphenation for cleaner layout
Font.registerHyphenationCallback((word) => [word]);

export const FONT_REGISTERED = true;
