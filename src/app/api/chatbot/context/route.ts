// Chatbot Context API - Provides Google Sheets data for grounding
import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthDirectService } from '@/lib/google-oauth-direct';

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHATBOT CONTEXT API ===');
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const includeLeads = searchParams.get('include_leads') === 'true';
    const includeProjects = searchParams.get('include_projects') === 'true';
    
    // Get authentication tokens from headers
    const accessToken = request.headers.get('x-google-access-token');
    const refreshToken = request.headers.get('x-google-refresh-token');
    const tokenExpiry = request.headers.get('x-google-token-expiry');

    if (!accessToken || !refreshToken || !tokenExpiry) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Google Sheets',
        authUrl: googleOAuthDirectService.getAuthUrl(projectId || '')
      }, { status: 401 });
    }

    // Check if token is expired
    const expiryTime = parseInt(tokenExpiry);
    if (Date.now() >= expiryTime) {
      return NextResponse.json({
        success: false,
        error: 'Token expired, please re-authenticate',
        authUrl: googleOAuthDirectService.getAuthUrl(projectId || '')
      }, { status: 401 });
    }

    // Load tokens into the service
    console.log('Loading tokens into service...');
    googleOAuthDirectService.loadTokensFromHeaders(request);

    const contextData: any = {};

    // Fetch projects if requested
    if (includeProjects) {
      console.log('Fetching projects for context...');
      const projects = await googleOAuthDirectService.getProjects();
      
      // Get lead counts for each project
      const allLeads = await googleOAuthDirectService.getLeads();
      const projectsWithLeadCounts = projects.map(project => {
        const projectLeads = allLeads.filter(lead => lead.project_id === project.project_id);
        return {
          ...project,
          leads_count: projectLeads.length
        };
      });
      
      contextData.projects = projectsWithLeadCounts;
    }

    // Fetch leads if requested
    if (includeLeads) {
      console.log('Fetching leads for context...');
      if (projectId) {
        // Get leads for specific project
        contextData.leads = await googleOAuthDirectService.getLeadsByProject(projectId);
      } else {
        // Get all leads
        contextData.leads = await googleOAuthDirectService.getLeads();
      }
    }

    // Add metadata
    contextData.metadata = {
      projectId: projectId || null,
      timestamp: new Date().toISOString(),
      totalProjects: contextData.projects?.length || 0,
      totalLeads: contextData.leads?.length || 0
    };

    console.log(`Context data prepared: ${contextData.metadata.totalProjects} projects, ${contextData.metadata.totalLeads} leads`);

    return NextResponse.json({
      success: true,
      data: contextData
    });

  } catch (error) {
    console.error('Error in chatbot context API:', error);
    
    let errorMessage = 'Failed to fetch context data';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
