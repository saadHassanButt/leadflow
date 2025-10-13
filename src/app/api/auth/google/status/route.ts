// Google OAuth authentication status
import { NextResponse } from 'next/server';
import { googleOAuthDirectService } from '@/lib/google-oauth-direct';

export async function GET() {
  try {
    // For server-side, we can't access localStorage
    // So we'll always return not authenticated and let the client handle it
    const authUrl = googleOAuthDirectService.getAuthUrl();
    
    return NextResponse.json({
      authenticated: false, // Always false on server-side
      authUrl: authUrl
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    );
  }
}
