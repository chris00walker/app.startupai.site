/**
 * OAuth Debug Page
 * 
 * Helps diagnose OAuth configuration issues
 */

"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithGitHub } from '@/lib/auth/actions';

export default function DebugOAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testOAuth = async () => {
    setIsLoading(true);
    try {
      console.log('Environment variables:');
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
      console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('window.location.origin:', window.location.origin);
      
      const result = await signInWithGitHub();
      setDebugInfo({
        success: !result.error,
        result,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          windowOrigin: window.location.origin,
        }
      });
    } catch (error) {
      setDebugInfo({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          windowOrigin: window.location.origin,
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>OAuth Debug Tool</CardTitle>
          <CardDescription>
            Diagnose GitHub OAuth configuration issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testOAuth} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test GitHub OAuth'}
          </Button>
          
          {debugInfo && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Expected Redirect URL:</h4>
                <code className="text-blue-800">
                  {debugInfo.environment.NEXT_PUBLIC_APP_URL || debugInfo.environment.windowOrigin}/auth/callback
                </code>
                
                <div className="mt-2">
                  <p className="text-sm text-blue-700">
                    <strong>To fix the 500 error:</strong> Add this URL to your Supabase project's GitHub OAuth configuration:
                  </p>
                  <ol className="text-sm text-blue-700 mt-1 ml-4 list-decimal">
                    <li>Go to Supabase Dashboard → Authentication → Providers → GitHub</li>
                    <li>Add the redirect URL above to "Authorized redirect URIs"</li>
                    <li>Make sure both localhost:3001 and your production URLs are listed</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
