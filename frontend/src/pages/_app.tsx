import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
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

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <div className={`${displayFont.variable} ${bodyFont.variable}`}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </div>
  );
}
