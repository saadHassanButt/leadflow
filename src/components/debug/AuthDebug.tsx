'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui';

export default function AuthDebug() {
  const { isAuthenticated, isLoading } = useAuth();
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [tokens, setTokens] = useState({
    accessToken: '',
    refreshToken: '',
    tokenExpiry: '',
    isValid: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const checkTokens = () => {
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');
      
      const isValid = accessToken && refreshToken && tokenExpiry && 
        Date.now() < parseInt(tokenExpiry);

      setTokens({
        accessToken: accessToken || '',
        refreshToken: refreshToken || '',
        tokenExpiry: tokenExpiry || '',
        isValid: !!isValid
      });
    };

    checkTokens();
    
    // Check every second
    const interval = setInterval(checkTokens, 1000);
    
    return () => clearInterval(interval);
  }, [mounted]);

  const handleReAuthenticate = () => {
    // Get current project ID if available
    const projectId = params?.id || '';
    
    // Clear existing tokens
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    localStorage.removeItem('google_token_expiry');
    
    // Redirect to authentication page
    const authUrl = `/auth/google${projectId ? `?project_id=${projectId}` : ''}`;
    window.location.href = authUrl;
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const needsReAuth = !isAuthenticated || !tokens.isValid;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1 mb-3">
        <div>Context Auth: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Loading: {isLoading ? '⏳' : '✅'}</div>
        <div>Access Token: {tokens.accessToken ? '✅' : '❌'}</div>
        <div>Refresh Token: {tokens.refreshToken ? '✅' : '❌'}</div>
        <div>Token Valid: {tokens.isValid ? '✅' : '❌'}</div>
        <div>Expiry: {tokens.tokenExpiry ? new Date(parseInt(tokens.tokenExpiry)).toLocaleTimeString() : 'N/A'}</div>
      </div>
      
      <div className="space-y-2">
        {needsReAuth && (
          <Button
            onClick={handleReAuthenticate}
            variant="primary"
            size="sm"
            className="w-full bg-red-600 hover:bg-red-700 text-xs"
          >
            🔑 Re-authenticate (Required)
          </Button>
        )}
        
        {!needsReAuth && (
          <div className="text-center text-green-400 font-medium mb-2">
            ✅ Authentication OK
          </div>
        )}
        
        {/* Always show re-authenticate button for forcing new permissions */}
        <Button
          onClick={handleReAuthenticate}
          variant="secondary"
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
        >
          🔄 Force Re-authenticate
        </Button>
      </div>
    </div>
  );
}
