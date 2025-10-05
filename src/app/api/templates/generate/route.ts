// Generate email template via n8n webhook
import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthDirectService } from '@/lib/google-oauth-direct';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, lead_data } = body;

    if (!project_id) {
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

    // Call n8n webhook to generate template
    const n8nBaseUrl = process.env.N8N_BASE_URL || 'http://192.168.18.180:5678';
    const webhookUrl = `${n8nBaseUrl}/webhook-test/generate-template`;
    
    console.log('=== TEMPLATE GENERATION DEBUG ===');
    console.log('Environment N8N_BASE_URL:', process.env.N8N_BASE_URL);
    console.log('Using n8nBaseUrl:', n8nBaseUrl);
    console.log('Webhook URL:', webhookUrl);
    console.log('Project ID:', project_id);
    console.log('Lead Data:', lead_data);
    console.log('================================');
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id,
        lead_data
      }),
    });

    console.log('Webhook response status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('=== WEBHOOK ERROR ===');
      console.error('Webhook URL:', webhookUrl);
      console.error('Response Status:', webhookResponse.status);
      console.error('Response Headers:', Object.fromEntries(webhookResponse.headers.entries()));
      console.error('Error Response Text:', errorText);
      console.error('====================');
      throw new Error(`n8n webhook failed (${webhookUrl}): ${webhookResponse.status} - ${errorText}`);
    }

    // Check if response has content
    const responseText = await webhookResponse.text();
    console.log('Webhook response text:', responseText);

    let webhookResult;
    try {
      webhookResult = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.log('Webhook response is not JSON, treating as empty response');
      webhookResult = {};
    }
    
    console.log('n8n webhook response:', webhookResult);

    // Wait a moment for the template to be written to Google Sheets
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch the generated template from Google Sheets
    console.log('Fetching generated template from Google Sheets...');
    let templates = await googleOAuthDirectService.getTemplatesByProject(project_id);
    console.log('Found templates after 2s:', templates.length);
    
    // If no templates found, wait a bit longer and try again
    if (templates.length === 0) {
      console.log('No templates found, waiting longer...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      templates = await googleOAuthDirectService.getTemplatesByProject(project_id);
      console.log('Found templates after 5s:', templates.length);
    }
    
    // Find the most recent template (assuming it's the one just generated)
    const latestTemplate = templates.sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )[0];

    if (!latestTemplate) {
      console.log('No template found after generation. Available templates:', templates);
      return NextResponse.json({
        success: false,
        error: 'No template found after generation. Please check if n8n workflow wrote to Google Sheets correctly.',
        details: `Found ${templates.length} templates for project ${project_id}`
      }, { status: 404 });
    }

    console.log('Latest template found:', latestTemplate);

    return NextResponse.json({
      success: true,
      data: latestTemplate,
      message: 'Template generated successfully'
    });

  } catch (error) {
    console.error('=== TEMPLATE GENERATION ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('================================');
    
    // Check if it's a connection error
    if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('fetch'))) {
      return NextResponse.json(
        { 
          error: 'Cannot connect to n8n webhook. Please check:',
          details: [
            '1. n8n server is running on the other laptop',
            '2. IP address is correct (check with ipconfig on n8n laptop)',
            '3. Both machines are on the same network',
            '4. Firewall allows port 5678',
            `5. Current webhook URL: ${process.env.N8N_BASE_URL || 'http://192.168.18.180:5678'}/webhook-test/generate-template`,
            `6. Error: ${error.message}`
          ]
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate template', 
        details: error instanceof Error ? error.message : 'Unknown error',
        webhookUrl: `${process.env.N8N_BASE_URL || 'http://192.168.18.180:5678'}/webhook-test/generate-template`
      },
      { status: 500 }
    );
  }
}
