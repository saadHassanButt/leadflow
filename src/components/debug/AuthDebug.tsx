'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function AuthDebug() {
  const { isAuthenticated, isLoading } = useAuth();
  const [tokens, setTokens] = useState({
    accessToken: '',
    refreshToken: '',
    tokenExpiry: '',
    isValid: false
  });

  useEffect(() => {
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
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Context Auth: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Loading: {isLoading ? '⏳' : '✅'}</div>
        <div>Access Token: {tokens.accessToken ? '✅' : '❌'}</div>
        <div>Refresh Token: {tokens.refreshToken ? '✅' : '❌'}</div>
        <div>Token Valid: {tokens.isValid ? '✅' : '❌'}</div>
        <div>Expiry: {tokens.tokenExpiry ? new Date(parseInt(tokens.tokenExpiry)).toLocaleTimeString() : 'N/A'}</div>
      </div>
    </div>
  );
}
