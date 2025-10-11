import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthDirectService } from '@/lib/google-oauth-direct';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    // Get tokens from headers (same pattern as leads and templates APIs)
    const accessToken = request.headers.get('x-google-access-token');
    const refreshToken = request.headers.get('x-google-refresh-token');
    const tokenExpiry = request.headers.get('x-google-token-expiry');

    if (!accessToken || !refreshToken) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Google Sheets'
      }, { status: 401 });
    }

    // Set tokens in the service
    googleOAuthDirectService.setTokens(
      accessToken,
      refreshToken,
      parseInt(tokenExpiry || '0')
    );

    console.log('=== API: FETCHING CAMPAIGN STATS ===');
    console.log('Project ID:', projectId);
    console.log('Access Token present:', !!accessToken);
    console.log('Refresh Token present:', !!refreshToken);

    // Get campaign stats for this project
    const stats = await googleOAuthDirectService.getCampaignStatsByProject(projectId);

    console.log('Campaign stats found:', stats.length);
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific authentication errors
    if (errorMessage.includes('Token expired') || errorMessage.includes('Invalid token')) {
      return NextResponse.json({
        success: false,
        error: 'Token expired, please re-authenticate'
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { project_id } = await request.json();

    if (!project_id) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    // Get tokens from headers
    const accessToken = request.headers.get('x-google-access-token');
    const refreshToken = request.headers.get('x-google-refresh-token');
    const tokenExpiry = request.headers.get('x-google-token-expiry');

    if (!accessToken || !refreshToken) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Google Sheets'
      }, { status: 401 });
    }

    // Set tokens in the service
    googleOAuthDirectService.setTokens(
      accessToken,
      refreshToken,
      parseInt(tokenExpiry || '0')
    );

    console.log('=== API: TRIGGERING CAMPAIGN STATS REFRESH ===');
    console.log('Project ID:', project_id);

    // First, trigger n8n webhook to fetch fresh stats
    console.log('Triggering n8n webhook to fetch fresh stats...');
    const n8nBaseUrl = 'http://192.168.18.180:5678';
    
    try {
      const webhookResponse = await fetch(`${n8nBaseUrl}/webhook-test/fetch-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: project_id,
          timestamp: new Date().toISOString()
        }),
      });

      console.log('n8n webhook response status:', webhookResponse.status);
      
      if (webhookResponse.ok) {
        const responseText = await webhookResponse.text();
        console.log('n8n webhook response:', responseText);
        
        // Wait a moment for the webhook to update the sheets
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.warn('n8n webhook failed, continuing with existing data');
      }
    } catch (webhookError) {
      console.warn('Failed to call n8n webhook, continuing with existing data:', webhookError);
    }

    // Get updated campaign stats for this project
    const stats = await googleOAuthDirectService.getCampaignStatsByProject(project_id);

    console.log('Updated campaign stats found:', stats.length);
    
    return NextResponse.json({
      success: true,
      data: stats,
      webhook_triggered: true
    });

  } catch (error) {
    console.error('Error refreshing campaign stats:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific authentication errors
    if (errorMessage.includes('Token expired') || errorMessage.includes('Invalid token')) {
      return NextResponse.json({
        success: false,
        error: 'Token expired, please re-authenticate'
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
