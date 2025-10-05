'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // Project ID
        const error = searchParams.get('error');

        if (error) {
          setError(`OAuth error: ${error}`);
          setStatus('error');
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setStatus('error');
          return;
        }

        // Exchange code for tokens
        const success = await exchangeCodeForToken(code);

        if (success) {
          setStatus('success');
          // Re-check authentication status
          await checkAuth();
          
          // Redirect to the appropriate page
          setTimeout(() => {
            if (state) {
              router.push(`/project/${state}/leads?success=authenticated`);
            } else {
              router.push('/?success=authenticated');
            }
          }, 1000);
        } else {
          setError('Failed to exchange code for tokens');
          setStatus('error');
        }
      } catch (error) {
        console.error('Callback error:', error);
        setError('An error occurred during authentication');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, checkAuth, router]);

  const exchangeCodeForToken = async (code: string): Promise<boolean> => {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || '',
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Store tokens in localStorage
      localStorage.setItem('google_access_token', data.access_token);
      localStorage.setItem('google_refresh_token', data.refresh_token);
      localStorage.setItem('google_token_expiry', (Date.now() + (data.expires_in * 1000)).toString());

      // Trigger custom event to notify AuthContext
      window.dispatchEvent(new CustomEvent('googleAuthUpdate'));

      return true;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return false;
    }
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-2xl font-bold text-gray-900">Processing Authentication...</h2>
          <p className="text-gray-600">Please wait while we complete your Google Sheets authentication.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="text-red-600 text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900">Authentication Failed</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="text-green-600 text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900">Authentication Successful!</h2>
        <p className="text-gray-600">You have been successfully authenticated with Google Sheets.</p>
        <p className="text-sm text-gray-500">Redirecting you back to your project...</p>
      </div>
    </div>
  );
}
