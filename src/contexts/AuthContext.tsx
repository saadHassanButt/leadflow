'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check localStorage directly for tokens
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      if (accessToken && refreshToken && tokenExpiry) {
        const expiry = parseInt(tokenExpiry);
        const now = Date.now();
        
        if (now < expiry) {
          // Token is still valid
          setIsAuthenticated(true);
        } else {
          // Token expired, try to refresh
          const refreshed = await refreshTokenIfNeeded();
          setIsAuthenticated(refreshed);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshTokenIfNeeded = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('google_refresh_token');
      if (!refreshToken) return false;

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      const newExpiry = Date.now() + (data.expires_in * 1000);

      // Update stored tokens
      localStorage.setItem('google_access_token', newAccessToken);
      localStorage.setItem('google_token_expiry', newExpiry.toString());

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    localStorage.removeItem('google_token_expiry');
    
    setIsAuthenticated(false);
    
    // Refresh the page to clear any cached state
    window.location.reload();
  };

  const refreshAuth = () => {
    // Force a re-check of authentication status
    checkAuth();
  };

  useEffect(() => {
    checkAuth();

    // Listen for storage changes (when tokens are added/removed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('google_')) {
        checkAuth();
      }
    };

    // Listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('googleAuthUpdate', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('googleAuthUpdate', handleCustomStorageChange);
    };
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, checkAuth, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
