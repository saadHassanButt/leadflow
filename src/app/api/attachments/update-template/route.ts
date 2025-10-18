import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthDirectService } from '@/lib/google-oauth-direct';

export async function POST(request: NextRequest) {
  try {
    console.log('=== UPDATE TEMPLATE ATTACHMENTS API ===');

    // Get authentication tokens from headers
    const accessToken = request.headers.get('x-google-access-token');
    const refreshToken = request.headers.get('x-google-refresh-token');
    const tokenExpiry = request.headers.get('x-google-token-expiry');

    if (!accessToken || !refreshToken || !tokenExpiry) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Google Sheets'
      }, { status: 401 });
    }

    // Set tokens for the service
    googleOAuthDirectService.setTokens(accessToken, refreshToken, parseInt(tokenExpiry));

    // Parse request body
    const body = await request.json();
    const { templateId, attachments } = body;

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'No template ID provided'
      }, { status: 400 });
    }

    if (!attachments || !Array.isArray(attachments)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid attachments data'
      }, { status: 400 });
    }

    console.log('Updating template attachments:', {
      templateId,
      attachmentCount: attachments.length,
      attachments: attachments.map(a => ({ name: a.name, url: a.url }))
    });

    // Update the Email_Template tab with attachment information
    const success = await googleOAuthDirectService.updateTemplateAttachments(templateId, attachments);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update template attachments in Google Sheets'
      }, { status: 500 });
    }

    console.log('Template attachments updated successfully');

    return NextResponse.json({
      success: true,
      data: {
        templateId,
        attachmentCount: attachments.length,
        attachments
      }
    });

  } catch (error) {
    console.error('Error updating template attachments:', error);
    
    // Handle specific Google API errors
    if (error instanceof Error) {
      if (error.message.includes('Token expired') || error.message.includes('Invalid token')) {
        return NextResponse.json({
          success: false,
          error: 'Token expired, please re-authenticate'
        }, { status: 401 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update template attachments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
