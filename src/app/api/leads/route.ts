// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthDirectService, GoogleSheetsLead } from '@/lib/google-oauth-direct';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get tokens from request headers
    const accessToken = request.headers.get('x-google-access-token');
    const refreshToken = request.headers.get('x-google-refresh-token');
    const tokenExpiry = request.headers.get('x-google-token-expiry');

    if (!accessToken || !refreshToken || !tokenExpiry) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Google Sheets',
        authUrl: googleOAuthDirectService.getAuthUrl(projectId)
      }, { status: 401 });
    }

    // Check if token is still valid
    const expiry = parseInt(tokenExpiry);
    const now = Date.now();
    
    if (now >= expiry) {
      return NextResponse.json({
        success: false,
        error: 'Token expired, please re-authenticate',
        authUrl: googleOAuthDirectService.getAuthUrl(projectId)
      }, { status: 401 });
    }

    // Load tokens into the service
    console.log('Loading tokens into service...');
    const tokensLoaded = googleOAuthDirectService.loadTokensFromHeaders(request);
    console.log('Tokens loaded successfully:', tokensLoaded);

    // Fetch leads from Google Sheets
    console.log('Fetching leads from Google Sheets...');
    const leads = await googleOAuthDirectService.getLeadsByProject(projectId);

    return NextResponse.json({
      success: true,
      data: leads,
      count: leads.length
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, name, email, company, position, source, phone, website, address } = body;

    // Generate a new lead ID
    const leadId = `lead_${project_id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newLead: GoogleSheetsLead = {
      lead_id: leadId,
      project_id,
      name,
      email,
      company,
      position,
      source: source || 'Manual Entry',
      status: 'Active',
      phone: phone || '',
      website: website || '',
      address: address || '',
      scraped_at: new Date().toISOString()
    };

    // Get tokens from request headers
    const accessToken = request.headers.get('x-google-access-token');
    const refreshToken = request.headers.get('x-google-refresh-token');
    const tokenExpiry = request.headers.get('x-google-token-expiry');

    if (!accessToken || !refreshToken || !tokenExpiry) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Google Sheets',
        authUrl: googleOAuthDirectService.getAuthUrl(project_id)
      }, { status: 401 });
    }

    // Check if token is still valid
    const expiry = parseInt(tokenExpiry);
    const now = Date.now();
    
    if (now >= expiry) {
      return NextResponse.json({
        success: false,
        error: 'Token expired, please re-authenticate',
        authUrl: googleOAuthDirectService.getAuthUrl(project_id)
      }, { status: 401 });
    }

    // Load tokens into the service
    console.log('Loading tokens into service for POST...');
    const tokensLoaded = googleOAuthDirectService.loadTokensFromHeaders(request);
    console.log('Tokens loaded successfully for POST:', tokensLoaded);

    // Add lead to Google Sheets using the direct OAuth service
    console.log('Adding lead to Google Sheets...');
    const success = await googleOAuthDirectService.addLead(newLead);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to add lead to Google Sheets' },
        { status: 500 }
      );
    }

    console.log('New lead created and added to Google Sheets:', newLead);

    return NextResponse.json({
      success: true,
      data: newLead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, name, email, company, position, source, status, phone, website, address } = body;

    if (!lead_id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
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

    // Update lead in Google Sheets using the direct OAuth service
    const updates: Partial<GoogleSheetsLead> = {
      name,
      email,
      company,
      position,
      source,
      status,
      phone,
      website,
      address
    };

    const success = await googleOAuthDirectService.updateLead(lead_id, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update lead in Google Sheets' },
        { status: 500 }
      );
    }

    console.log('Lead updated in Google Sheets:', lead_id);

    return NextResponse.json({
      success: true,
      data: { lead_id, ...updates }
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('lead_id');

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
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

    // Delete lead from Google Sheets using the direct OAuth service
    const success = await googleOAuthDirectService.deleteLead(leadId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete lead from Google Sheets' },
        { status: 500 }
      );
    }

    console.log('Lead deleted from Google Sheets:', leadId);

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}

