import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthDirectService } from '@/lib/google-oauth-direct';

export async function GET(request: NextRequest) {
  try {
    console.log('=== PROJECTS API ROUTE ===');
    
    // Get authentication tokens from headers
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

    // Check if token is expired
    const expiryTime = parseInt(tokenExpiry);
    if (Date.now() >= expiryTime) {
      return NextResponse.json({
        success: false,
        error: 'Token expired, please re-authenticate',
        authUrl: googleOAuthDirectService.getAuthUrl('')
      }, { status: 401 });
    }

    // Load tokens into the service
    console.log('Loading tokens into service...');
    const tokensLoaded = googleOAuthDirectService.loadTokensFromHeaders(request);
    console.log('Tokens loaded successfully:', tokensLoaded);

    // Fetch projects from Google Sheets
    console.log('Fetching projects from Google Sheets...');
    const projects = await googleOAuthDirectService.getProjects();

    // Fetch leads to get accurate lead counts for each project
    console.log('Fetching leads to calculate accurate lead counts...');
    const allLeads = await googleOAuthDirectService.getLeads();
    
    // Calculate lead counts for each project
    const projectsWithLeadCounts = projects.map(project => {
      const projectLeads = allLeads.filter(lead => lead.project_id === project.project_id);
      return {
        ...project,
        leads_count: projectLeads.length
      };
    });

    console.log(`Successfully fetched ${projectsWithLeadCounts.length} projects with lead counts`);

    return NextResponse.json({
      success: true,
      data: projectsWithLeadCounts
    });

  } catch (error) {
    console.error('Error in projects API route:', error);
    
    let errorMessage = 'Failed to fetch projects';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}