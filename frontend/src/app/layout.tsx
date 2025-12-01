/**
 * Root Layout (App Router)
 *
 * This is the root layout for all pages using the App Router.
 * Imports global styles and sets up the HTML structure.
 *
 * Typography: Distinctive font pairing per frontend-design skill
 * - Display: DM Serif Display (strategic, sophisticated headings)
 * - Body: Outfit (modern, readable sans-serif with character)
 */

import '@/styles/globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { DM_Serif_Display, Outfit } from 'next/font/google';

// Display font for headings - sophisticated serif
const displayFont = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Body font for content - modern geometric sans-serif
const bodyFont = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'StartupAI - Evidence-Led Strategy Platform',
  description: 'Transform your startup validation with AI-powered evidence collection and analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} font-body antialiased`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
