import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthDirectService } from '@/lib/google-oauth-direct';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ATTACHMENT UPLOAD API ===');

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateId = formData.get('templateId') as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'No template ID provided'
      }, { status: 400 });
    }

    // Validate file size (20MB limit)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `File size exceeds 20MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`
      }, { status: 400 });
    }

    console.log('Uploading file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      templateId: templateId
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Google Drive
    const driveResult = await googleOAuthDirectService.uploadToDrive(
      buffer,
      file.name,
      file.type || 'application/octet-stream'
    );

    if (!driveResult) {
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file to Google Drive'
      }, { status: 500 });
    }

    console.log('File uploaded to Google Drive successfully:', driveResult);

    return NextResponse.json({
      success: true,
      data: {
        id: driveResult.id,
        url: driveResult.url,
        name: file.name,
        size: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Error uploading attachment:', error);
    
    // Handle specific Google API errors
    if (error instanceof Error) {
      if (error.message.includes('Token expired') || error.message.includes('Invalid token')) {
        return NextResponse.json({
          success: false,
          error: 'Token expired, please re-authenticate'
        }, { status: 401 });
      }
      
      // Handle insufficient permissions (need to re-auth with new scopes)
      if (error.message.includes('Google Drive upload failed: 403')) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient permissions for Google Drive. Please re-authenticate to grant Drive access.'
        }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to upload attachment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
