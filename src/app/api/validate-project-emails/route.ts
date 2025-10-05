// Validate emails for a specific project using Emailable API
import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthDirectService } from '@/lib/google-oauth-direct';
import { emailableService } from '@/lib/emailable';

// Simple in-memory lock to prevent multiple validation calls for the same project
const validationLocks = new Map<string, boolean>();

export async function POST(request: NextRequest) {
  let project_id: string | undefined;
  
  try {
    const body = await request.json();
    project_id = body.project_id;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if validation is already in progress for this project
    if (validationLocks.get(project_id)) {
      return NextResponse.json({ 
        error: 'Validation already in progress for this project',
        details: 'Please wait for the current validation to complete'
      }, { status: 409 });
    }

    // Set lock for this project
    validationLocks.set(project_id, true);

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
    googleOAuthDirectService.loadTokensFromHeaders(request);

    console.log('=== EMAIL VALIDATION DEBUG ===');
    console.log('Project ID:', project_id);
    console.log('================================');

    // Fetch all leads for this project from Google Sheets
    console.log('Fetching leads for project:', project_id);
    const leads = await googleOAuthDirectService.getLeadsByProject(project_id);
    console.log('Found leads:', leads.length);

    if (leads.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No leads found for this project',
        details: 'Please scrape some leads first before validating emails'
      }, { status: 404 });
    }

    // Filter leads that have emails and haven't been validated yet
    const leadsToValidate = leads
      .filter(lead => lead.email && lead.email.trim() !== '')
      .filter(lead => !lead.validation_status || lead.validation_status === '')
      .map(lead => ({
        lead_id: lead.lead_id,
        email: lead.email
      }));

    console.log('Leads to validate:', leadsToValidate.length);

    if (leadsToValidate.length === 0) {
      // Check if there are any leads at all
      const totalLeads = leads.filter(lead => lead.email && lead.email.trim() !== '');
      
      if (totalLeads.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No leads found to validate',
          details: 'Please add some leads first or start lead scraping'
        }, { status: 404 });
      } else {
        // All leads are already validated
        const validationStats = {
          total_processed: totalLeads.length,
          deliverable: totalLeads.filter(lead => lead.validation_status === 'deliverable').length,
          undeliverable: totalLeads.filter(lead => lead.validation_status === 'undeliverable').length,
          risky: totalLeads.filter(lead => lead.validation_status === 'risky').length,
          unknown: totalLeads.filter(lead => lead.validation_status === 'unknown').length,
          free_emails: totalLeads.filter(lead => lead.is_free_email === 'TRUE').length,
          role_emails: totalLeads.filter(lead => lead.is_role_email === 'TRUE').length,
          disposable_emails: totalLeads.filter(lead => lead.is_disposable === 'TRUE').length
        };

        return NextResponse.json({
          success: true,
          message: 'All leads have already been validated',
          data: {
            project_id,
            validation_results: [],
            statistics: validationStats,
            sheets_update: {
              successful: 0,
              failed: 0
            },
            already_validated: true
          }
        });
      }
    }

    // Validate emails using Emailable API
    console.log('Starting email validation with Emailable API...');
    const validationResults = await emailableService.validateEmails(leadsToValidate);
    console.log('Validation completed. Results:', validationResults.length);

    // Update Google Sheets with validation results
    console.log('Updating Google Sheets with validation results...');
    let successCount = 0;
    let errorCount = 0;

    for (const result of validationResults) {
      try {
        console.log(`Processing validation result for lead: ${result.lead_id}`);
        const updates = {
          validation_status: result.validation_status,
          validation_score: (result.validation_score || 0).toString(),
          validation_reason: result.validation_reason || '',
          is_deliverable: result.is_deliverable ? 'TRUE' : 'FALSE',
          is_free_email: result.is_free_email ? 'TRUE' : 'FALSE',
          is_role_email: result.is_role_email ? 'TRUE' : 'FALSE',
          is_disposable: result.is_disposable ? 'TRUE' : 'FALSE',
          validated_at: result.validated_at
        };

        console.log('Updates to apply:', updates);
        const success = await googleOAuthDirectService.updateLead(result.lead_id, updates);
        console.log(`Update result for ${result.lead_id}:`, success);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error updating lead ${result.lead_id}:`, error);
        errorCount++;
      }
    }

    console.log('Google Sheets update completed. Success:', successCount, 'Errors:', errorCount);

    // Calculate validation statistics
    const stats = {
      total_processed: validationResults.length,
      deliverable: validationResults.filter(r => r.is_deliverable).length,
      undeliverable: validationResults.filter(r => r.validation_status === 'undeliverable').length,
      risky: validationResults.filter(r => r.validation_status === 'risky').length,
      unknown: validationResults.filter(r => r.validation_status === 'unknown').length,
      free_emails: validationResults.filter(r => r.is_free_email).length,
      role_emails: validationResults.filter(r => r.is_role_email).length,
      disposable_emails: validationResults.filter(r => r.is_disposable).length
    };

    const response = {
      success: true,
      message: 'Email validation completed successfully',
      data: {
        project_id,
        validation_results: validationResults,
        statistics: stats,
        sheets_update: {
          successful: successCount,
          failed: errorCount
        }
      }
    };

    console.log('Returning success response:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('=== EMAIL VALIDATION ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('================================');
    
    try {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to validate emails', 
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    } catch (jsonError) {
      console.error('Failed to create error response:', jsonError);
      return new Response('Internal Server Error', { status: 500 });
    }
  } finally {
    // Always release the lock
    if (project_id) {
      console.log('Releasing validation lock for project:', project_id);
      validationLocks.delete(project_id);
    }
  }
}
