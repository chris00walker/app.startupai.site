/**
 * Root Layout (App Router)
 * 
 * This is the root layout for all pages using the App Router.
 * Imports global styles and sets up the HTML structure.
 */

import '@fontsource/inter/latin.css';
import '@/styles/globals.css';

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
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
