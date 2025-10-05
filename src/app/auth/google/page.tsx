'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';

export default function GoogleAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const [authStatus, setAuthStatus] = useState<{
    authenticated: boolean;
    authUrl: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/google/status');
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = () => {
    if (authStatus?.authUrl) {
      // If we have a project ID, append it to the auth URL
      const authUrl = projectId ? `${authStatus.authUrl}&state=${projectId}` : authStatus.authUrl;
      window.location.href = authUrl;
    }
  };

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    localStorage.removeItem('google_token_expiry');
    
    // Refresh the page
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container-custom py-8">
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                Google Sheets Authentication
              </h1>
              <p className="text-neutral-600">
                Connect your app to Google Sheets to manage leads
              </p>
            </div>

            {authStatus?.authenticated ? (
              <div className="space-y-4">
                <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <span className="text-success-700 font-medium">
                      Successfully authenticated with Google Sheets
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push(projectId ? `/project/${projectId}/leads` : '/')}
                    className="w-full"
                  >
                    {projectId ? 'Go to Leads Page' : 'Go to Dashboard'}
                  </Button>
                  
                  <Button
                    onClick={handleLogout}
                    variant="secondary"
                    className="w-full"
                  >
                    Disconnect Google Sheets
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-warning-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <span className="text-warning-700 font-medium">
                      Not authenticated with Google Sheets
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleAuthenticate}
                    className="w-full"
                    icon={
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    }
                  >
                    Connect with Google
                  </Button>
                  
                  <Button
                    onClick={() => router.push(projectId ? `/project/${projectId}/leads` : '/')}
                    variant="secondary"
                    className="w-full"
                  >
                    {projectId ? 'Back to Leads Page' : 'Back to Dashboard'}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-500">
                This will allow the app to read and write data to your Google Sheets.
                You can revoke access at any time from your Google Account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
