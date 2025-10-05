// Update email template in Google Sheets
import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthDirectService } from '@/lib/google-oauth-direct';

export async function PUT(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { template_id, subject, body } = requestBody;

    if (!template_id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    // Get tokens from request headers
    const accessToken = request.headers.get('x-google-access-token');
    const refreshToken = request.headers.get('x-google-refresh-token');
    const tokenExpiry = request.headers.get('x-google-token-expiry');

    if (!accessToken || !refreshToken || !tokenExpiry) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Google Sheets',
        authUrl: googleOAuthDirectService.getAuthUrl('')
      }, { status: 401 });
    }

    // Check if token is still valid
    const expiry = parseInt(tokenExpiry);
    const now = Date.now();
    
    if (now >= expiry) {
      return NextResponse.json({
        success: false,
        error: 'Token expired, please re-authenticate',
        authUrl: googleOAuthDirectService.getAuthUrl('')
      }, { status: 401 });
    }

    // Load tokens into the service
    googleOAuthDirectService.loadTokensFromHeaders(request);

    // Update template in Google Sheets
    const success = await googleOAuthDirectService.updateTemplate(template_id, { subject, body });
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update template in Google Sheets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
