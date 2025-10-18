// API route for bulk lead upload from Excel/CSV files
import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthDirectService, GoogleSheetsLead } from '@/lib/google-oauth-direct';

export async function POST(request: NextRequest) {
  try {
    console.log('=== BULK LEAD UPLOAD API ===');
    
    const body = await request.json();
    const { project_id, leads } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'Leads data is required' }, { status: 400 });
    }

    console.log('Project ID:', project_id);
    console.log('Number of leads to upload:', leads.length);

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
    console.log('Loading tokens into service...');
    const tokensLoaded = googleOAuthDirectService.loadTokensFromHeaders(request);
    console.log('Tokens loaded successfully:', tokensLoaded);

    // Process and validate leads
    const processedLeads = leads.map((lead: any, index: number) => {
      // Start with standard fields
      const processedLead: any = {
        lead_id: lead.lead_id || `lead_${project_id}_${Date.now()}_${index}`,
        project_id: project_id,
        name: lead.name || '',
        email: lead.email || '',
        company: lead.company || '',
        position: lead.position || '',
        source: lead.source || 'Excel Upload',
        status: lead.status || 'Active',
        phone: lead.phone || '',
        website: lead.website || '',
        address: lead.address || '',
        rating: lead.rating || '',
        scraped_at: lead.scraped_at || new Date().toISOString(),
        error: lead.error || '',
        // Email validation fields (empty for new uploads)
        validation_status: '',
        validation_score: '',
        validation_reason: '',
        is_deliverable: '',
        is_free_email: '',
        is_role_email: '',
        is_disposable: '',
        validated_at: ''
      };

        // Note: Extra columns are no longer processed

      return processedLead;
    });

    console.log('Processed leads sample:', processedLeads.slice(0, 2));

    // Upload leads to Google Sheets in batches
    const batchSize = 10; // Process in smaller batches to avoid timeouts
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < processedLeads.length; i += batchSize) {
      const batch = processedLeads.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(processedLeads.length / batchSize)}`);

        for (const lead of batch) {
          try {
            console.log(`Adding lead: ${lead.name}`);
            const success = await googleOAuthDirectService.addLead(lead);
          
          if (success) {
            results.successful++;
            console.log(`Successfully added lead: ${lead.name} (${lead.email})`);
          } else {
            results.failed++;
            results.errors.push(`Failed to add lead: ${lead.name} (${lead.email})`);
            console.error(`Failed to add lead: ${lead.name} (${lead.email})`);
          }
        } catch (error) {
          results.failed++;
          const errorMessage = `Error adding lead ${lead.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMessage);
          console.error(errorMessage);
        }

        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Longer delay between batches
      if (i + batchSize < processedLeads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('Bulk upload completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Bulk lead upload completed',
      data: {
        total_processed: processedLeads.length,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors.slice(0, 10) // Return max 10 errors
      }
    });

  } catch (error) {
    console.error('Error in bulk lead upload:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to upload leads',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
