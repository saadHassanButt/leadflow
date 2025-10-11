// Direct Google OAuth authentication for Google Sheets API
// This handles authentication directly in the app using your credentials

const GOOGLE_SHEETS_DOCUMENT_ID = process.env.GOOGLE_SHEETS_DOCUMENT_ID || '';

// Your Google OAuth credentials
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

interface GoogleSheetsLead {
  lead_id: string;
  project_id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  source: string;
  status: string;
  phone?: string;
  website?: string;
  address?: string;
  rating?: string;
  scraped_at?: string;
  error?: string;
  // Email validation fields
  validation_status?: string;
  validation_score?: string;
  validation_reason?: string;
  is_deliverable?: string;
  is_free_email?: string;
  is_role_email?: string;
  is_disposable?: string;
  validated_at?: string;
}

class GoogleOAuthDirectService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  // Set tokens manually (for API routes)
  setTokens(accessToken: string, refreshToken: string, tokenExpiry: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = tokenExpiry;
  }

  // Get OAuth URL for initial authentication
  getAuthUrl(projectId?: string): string {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      access_type: 'offline',
      prompt: 'consent select_account'
    });

    // Include project ID in state parameter for redirect after auth
    if (projectId) {
      params.set('state', projectId);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      // Store tokens in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('google_access_token', this.accessToken);
        localStorage.setItem('google_refresh_token', this.refreshToken);
        localStorage.setItem('google_token_expiry', this.tokenExpiry.toString());
      }

      console.log('Successfully authenticated with Google Sheets API');
      return true;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return false;
    }
  }

  // Load tokens from localStorage (client-side only)
  loadStoredTokens(): boolean {
    if (typeof window === 'undefined') return false;

    const accessToken = localStorage.getItem('google_access_token');
    const refreshToken = localStorage.getItem('google_refresh_token');
    const tokenExpiry = localStorage.getItem('google_token_expiry');

    if (accessToken && refreshToken && tokenExpiry) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiry = parseInt(tokenExpiry);

      // Check if token is still valid
      if (Date.now() < this.tokenExpiry) {
        return true;
      } else {
        // Token expired, try to refresh
        return this.refreshAccessToken();
      }
    }

    return false;
  }

  // Load tokens from request headers (server-side)
  loadTokensFromHeaders(request: Request): boolean {
    const accessToken = request.headers.get('x-google-access-token');
    const refreshToken = request.headers.get('x-google-refresh-token');
    const tokenExpiry = request.headers.get('x-google-token-expiry');

    console.log('Loading tokens from headers:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasTokenExpiry: !!tokenExpiry,
      tokenExpiry: tokenExpiry
    });

    if (accessToken && refreshToken && tokenExpiry) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiry = parseInt(tokenExpiry);

      // Check if token is still valid
      const now = Date.now();
      const isValid = now < this.tokenExpiry;
      
      console.log('Token validation:', {
        now,
        expiry: this.tokenExpiry,
        isValid,
        timeUntilExpiry: this.tokenExpiry - now
      });

      if (isValid) {
        return true;
      } else {
        console.log('Token expired, will need to refresh');
        // Don't try to refresh here as it's async
        // The calling code should handle refresh
        return false;
      }
    }

    console.log('Missing required tokens');
    return false;
  }

  // Refresh access token using refresh token
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      // Update stored tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('google_access_token', this.accessToken);
        localStorage.setItem('google_token_expiry', this.tokenExpiry.toString());
      }

      console.log('Successfully refreshed Google Sheets API token');
      return true;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return false;
    }
  }

  // Get valid access token
  async getValidAccessToken(): Promise<string | null> {
    console.log('getValidAccessToken called');
    console.log('Current instance state:', {
      accessToken: this.accessToken ? 'present' : 'missing',
      refreshToken: this.refreshToken ? 'present' : 'missing',
      tokenExpiry: this.tokenExpiry
    });
    
    // If we already have tokens loaded, use them
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('Using existing valid token');
      return this.accessToken;
    }
    
    // Try to load stored tokens from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const loaded = this.loadStoredTokens();
      console.log('loadStoredTokens returned:', loaded);
      
      if (loaded) {
        console.log('Returning access token from localStorage:', this.accessToken ? 'present' : 'missing');
        return this.accessToken;
      }
    }

    // If no valid tokens, return null (user needs to authenticate)
    console.log('No valid tokens, returning null');
    return null;
  }

  // Make authenticated request to Google Sheets API
  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
    console.log('makeAuthenticatedRequest called with endpoint:', endpoint);
    console.log('Current token state:', {
      accessToken: this.accessToken ? 'present' : 'missing',
      refreshToken: this.refreshToken ? 'present' : 'missing',
      tokenExpiry: this.tokenExpiry,
      isExpired: this.tokenExpiry ? Date.now() >= this.tokenExpiry : 'unknown'
    });
    
    const token = await this.getValidAccessToken();
    
    console.log('getValidAccessToken returned:', token ? 'token present' : 'no token');
    
    if (!token) {
      throw new Error('No valid access token. Please authenticate first.');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_DOCUMENT_ID}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidAccessToken();
    return token !== null;
  }

  // Add a new lead to the Leads tab
  async addLead(lead: GoogleSheetsLead): Promise<boolean> {
    try {
      const values = [
        lead.lead_id,
        lead.project_id,
        lead.name,
        lead.email,
        lead.company,
        lead.position,
        lead.source,
        lead.status,
        lead.phone || '',
        lead.website || '',
        lead.address || '',
        lead.rating || '',
        lead.scraped_at || new Date().toISOString(),
        lead.error || '',
        // Validation columns (empty for new leads)
        lead.validation_status || '',
        lead.validation_score || '',
        lead.validation_reason || '',
        lead.is_deliverable || '',
        lead.is_free_email || '',
        lead.is_role_email || '',
        lead.is_disposable || '',
        lead.validated_at || ''
      ];

      await this.makeAuthenticatedRequest('/values/Leads!A:V:append?valueInputOption=RAW', {
        method: 'POST',
        body: JSON.stringify({
          values: [values]
        })
      });

      console.log('Lead successfully added to Google Sheets:', lead.lead_id);
      return true;
    } catch (error) {
      console.error('Error adding lead to Google Sheets:', error);
      return false;
    }
  }

  // Get all leads from the Leads tab
  async getLeads(): Promise<GoogleSheetsLead[]> {
    try {
      console.log('Fetching leads from Google Sheets...');
      const response = await this.makeAuthenticatedRequest('/values/Leads!A2:V');
      
      console.log('Google Sheets response:', {
        hasValues: !!response.values,
        valuesLength: response.values?.length || 0,
        firstRow: response.values?.[0] || 'No rows'
      });
      
      if (!response.values || response.values.length === 0) {
        console.log('No leads found in Google Sheets');
        return [];
      }

      return response.values
        .filter((row: string[]) => row.length >= 4 && row[0] && row[1] && row[2] && row[3])
        .map((row: string[]) => ({
          lead_id: row[0] || '',
          project_id: row[1] || '',
          name: row[2] || '',
          email: row[3] || '',
          company: row[4] || '',
          position: row[5] || '',
          source: row[6] || '',
          status: row[7] || 'Active',
          phone: row[8] || '',
          website: row[9] || '',
          address: row[10] || '',
          rating: row[11] || '',
          scraped_at: row[12] || '',
          error: row[13] || '',
          // Email validation fields (columns 14-21)
          validation_status: row[14] || '',
          validation_score: row[15] || '',
          validation_reason: row[16] || '',
          is_deliverable: row[17] || '',
          is_free_email: row[18] || '',
          is_role_email: row[19] || '',
          is_disposable: row[20] || '',
          validated_at: row[21] || ''
        }));
    } catch (error) {
      console.error('Error fetching leads from Google Sheets:', error);
      return [];
    }
  }

  // Get leads by project ID
  async getLeadsByProject(projectId: string): Promise<GoogleSheetsLead[]> {
    console.log('Getting leads for project:', projectId);
    const allLeads = await this.getLeads();
    console.log('Total leads found:', allLeads.length);
    
    const projectLeads = allLeads.filter(lead => lead.project_id === projectId);
    console.log('Leads for project', projectId + ':', projectLeads.length);
    console.log('Project leads:', projectLeads.map(lead => ({ lead_id: lead.lead_id, name: lead.name, email: lead.email })));
    
    return projectLeads;
  }

  // Get email templates from Google Sheets
  async getTemplates(): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest('/values/Email_Templates!A2:H');
      
      if (!response.values || response.values.length === 0) {
        return [];
      }

      return response.values
        .filter((row: string[]) => row.length >= 4 && row[0] && row[1]) // template_id and project_id
        .map((row: string[]) => ({
          template_id: row[0] || '',
          project_id: row[1] || '',
          subject: row[2] || '',
          body: row[3] || '',
          user_edited: row[4] === 'Yes' || row[4] === 'TRUE',
          final_version: row[5] || '',
          ai_generated: row[6] === 'TRUE' || row[6] === true,
          model_used: row[7] || '',
          created_at: new Date().toISOString() // We'll add this to the sheet structure
        }));
    } catch (error) {
      console.error('Error fetching templates from Google Sheets:', error);
      return [];
    }
  }

  // Get templates by project ID
  async getTemplatesByProject(projectId: string): Promise<any[]> {
    try {
      const allTemplates = await this.getTemplates();
      return allTemplates.filter(template => template.project_id === projectId);
    } catch (error) {
      console.error('Error fetching templates by project:', error);
      return [];
    }
  }

  // Update an existing template in Google Sheets
  async updateTemplate(templateId: string, updates: { subject: string; body: string }): Promise<boolean> {
    try {
      console.log('=== UPDATING TEMPLATE ===');
      console.log('Template ID:', templateId);
      console.log('Updates:', updates);
      
      // Get fresh data from Google Sheets to find the exact row
      console.log('Fetching fresh template data from Google Sheets...');
      const response = await this.makeAuthenticatedRequest('/values/Email_Templates!A2:H');
      
      if (!response.values || response.values.length === 0) {
        console.error('No templates found in Google Sheets');
        return false;
      }

      // Find the exact row by searching through all rows
      let targetRowNumber = -1;
      let templateData = null;
      
      for (let i = 0; i < response.values.length; i++) {
        const row = response.values[i];
        if (row[0] === templateId) { // template_id is in column A (index 0)
          targetRowNumber = i + 2; // +2 because sheets are 1-indexed and we skip header
          templateData = {
            template_id: row[0] || '',
            project_id: row[1] || '',
            subject: row[2] || '',
            body: row[3] || '',
            user_edited: row[4] || 'No',
            final_version: row[5] || '',
            ai_generated: row[6] || 'FALSE',
            model_used: row[7] || ''
          };
          break;
        }
      }

      if (targetRowNumber === -1 || !templateData) {
        console.error('Template not found in Google Sheets:', templateId);
        console.log('Available template IDs:', response.values.map((row: string[]) => row[0]).filter(Boolean));
        return false;
      }

      console.log('Found template at row:', targetRowNumber);
      console.log('Current template data:', templateData);

      // Prepare updated values, preserving existing data where updates are not provided
      const values = [
        templateData.template_id, // Never update the template_id
        templateData.project_id, // Never update the project_id
        updates.subject, // Update subject
        updates.body, // Update body
        'Yes', // Mark as user_edited
        updates.body, // Set final_version to the updated body
        templateData.ai_generated, // Preserve ai_generated flag
        templateData.model_used // Preserve model_used
      ];

      console.log('Final values to update:', values);
      console.log('Updating row:', targetRowNumber);

      // Update the specific row
      await this.makeAuthenticatedRequest(`/values/Email_Templates!A${targetRowNumber}:H${targetRowNumber}?valueInputOption=RAW`, {
        method: 'PUT',
        body: JSON.stringify({
          values: [values]
        })
      });

      console.log('Template successfully updated in Google Sheets at row:', targetRowNumber);
      console.log('=== TEMPLATE UPDATE COMPLETE ===');
      return true;
    } catch (error) {
      console.error('=== TEMPLATE UPDATE ERROR ===');
      console.error('Error updating template in Google Sheets:', error);
      console.error('Template ID:', templateId);
      console.error('Updates:', updates);
      console.error('========================');
      return false;
    }
  }

  // Update an existing lead
  async updateLead(leadId: string, updates: Partial<GoogleSheetsLead>): Promise<boolean> {
    try {
      console.log('=== UPDATING LEAD ===');
      console.log('Lead ID:', leadId);
      console.log('Updates:', updates);
      
      // Get fresh data from Google Sheets to find the exact row
      console.log('Fetching fresh data from Google Sheets...');
      const response = await this.makeAuthenticatedRequest('/values/Leads!A2:V');
      
      if (!response.values || response.values.length === 0) {
        console.error('No leads found in Google Sheets');
        return false;
      }

      // Find the exact row by searching through all rows
      let targetRowNumber = -1;
      let leadData = null;
      
      for (let i = 0; i < response.values.length; i++) {
        const row = response.values[i];
        if (row[0] === leadId) { // lead_id is in column A (index 0)
          targetRowNumber = i + 2; // +2 because sheets are 1-indexed and we skip header
          leadData = {
            lead_id: row[0] || '',
            project_id: row[1] || '',
            name: row[2] || '',
            email: row[3] || '',
            company: row[4] || '',
            position: row[5] || '',
            source: row[6] || '',
            status: row[7] || 'Active',
            phone: row[8] || '',
            website: row[9] || '',
            address: row[10] || '',
            rating: row[11] || '',
            scraped_at: row[12] || '',
            error: row[13] || '',
            validation_status: row[14] || '',
            validation_score: row[15] || '',
            validation_reason: row[16] || '',
            is_deliverable: row[17] || '',
            is_free_email: row[18] || '',
            is_role_email: row[19] || '',
            is_disposable: row[20] || '',
            validated_at: row[21] || ''
          };
          break;
        }
      }

      if (targetRowNumber === -1 || !leadData) {
        console.error('Lead not found in Google Sheets:', leadId);
        console.log('Available lead IDs:', response.values.map((row: string[]) => row[0]).filter(Boolean));
        return false;
      }

      console.log('Found lead at row:', targetRowNumber);
      console.log('Current lead data:', leadData);

      // Prepare updated values, preserving existing data where updates are not provided
      const values = [
        leadData.lead_id, // Never update the lead_id
        leadData.project_id, // Never update the project_id
        updates.name !== undefined ? updates.name : leadData.name,
        updates.email !== undefined ? updates.email : leadData.email,
        updates.company !== undefined ? updates.company : leadData.company,
        updates.position !== undefined ? updates.position : leadData.position,
        updates.source !== undefined ? updates.source : leadData.source,
        updates.status !== undefined ? updates.status : leadData.status,
        updates.phone !== undefined ? updates.phone : leadData.phone,
        updates.website !== undefined ? updates.website : leadData.website,
        updates.address !== undefined ? updates.address : leadData.address,
        updates.rating !== undefined ? updates.rating : leadData.rating,
        updates.scraped_at !== undefined ? updates.scraped_at : leadData.scraped_at,
        updates.error !== undefined ? updates.error : leadData.error,
        // Validation columns
        updates.validation_status !== undefined ? updates.validation_status : leadData.validation_status,
        updates.validation_score !== undefined ? updates.validation_score : leadData.validation_score,
        updates.validation_reason !== undefined ? updates.validation_reason : leadData.validation_reason,
        updates.is_deliverable !== undefined ? updates.is_deliverable : leadData.is_deliverable,
        updates.is_free_email !== undefined ? updates.is_free_email : leadData.is_free_email,
        updates.is_role_email !== undefined ? updates.is_role_email : leadData.is_role_email,
        updates.is_disposable !== undefined ? updates.is_disposable : leadData.is_disposable,
        updates.validated_at !== undefined ? updates.validated_at : leadData.validated_at
      ];

      console.log('Final values to update:', values);
      console.log('Updating row:', targetRowNumber);

      // Update the specific row
      await this.makeAuthenticatedRequest(`/values/Leads!A${targetRowNumber}:V${targetRowNumber}?valueInputOption=RAW`, {
        method: 'PUT',
        body: JSON.stringify({
          values: [values]
        })
      });

      console.log('Lead successfully updated in Google Sheets at row:', targetRowNumber);
      console.log('=== UPDATE COMPLETE ===');
      return true;
    } catch (error) {
      console.error('=== UPDATE ERROR ===');
      console.error('Error updating lead in Google Sheets:', error);
      console.error('Lead ID:', leadId);
      console.error('Updates:', updates);
      console.error('===================');
      return false;
    }
  }

  // Delete a lead
  async deleteLead(leadId: string): Promise<boolean> {
    try {
      const leads = await this.getLeads();
      const leadIndex = leads.findIndex(lead => lead.lead_id === leadId);
      
      if (leadIndex === -1) {
        console.error('Lead not found:', leadId);
        return false;
      }

      const rowNumber = leadIndex + 2;
      
      await this.makeAuthenticatedRequest(`/values/Leads!A${rowNumber}:N${rowNumber}`, {
        method: 'DELETE'
      });

      console.log('Lead successfully deleted from Google Sheets:', leadId);
      return true;
    } catch (error) {
      console.error('Error deleting lead from Google Sheets:', error);
      return false;
    }
  }

  // Get campaign statistics from Campaign_Stats sheet
  async getCampaignStats(): Promise<any[]> {
    try {
      console.log('Fetching campaign stats from Google Sheets...');
      
      // First, let's check what sheets are available
      console.log('Checking available sheets...');
      try {
        const sheetsResponse = await this.makeAuthenticatedRequest('');
        console.log('Available sheets:', sheetsResponse.sheets?.map((s: any) => s.properties?.title) || 'No sheets info');
      } catch (sheetsError) {
        console.log('Could not fetch sheets info:', sheetsError);
      }
      
      // Try different possible sheet names
      const possibleSheetNames = ['Campaign_Stats', 'campaign_stats', 'CampaignStats', 'Stats'];
      let response = null;
      let usedSheetName = '';
      
      for (const sheetName of possibleSheetNames) {
        try {
          console.log(`Trying sheet name: ${sheetName}`);
          response = await this.makeAuthenticatedRequest(`/values/${sheetName}!A2:Y`);
          usedSheetName = sheetName;
          console.log(`Successfully found sheet: ${sheetName}`);
          break;
        } catch (error) {
          console.log(`Sheet ${sheetName} not found, trying next...`);
          continue;
        }
      }
      
      if (!response) {
        console.log('No campaign stats sheet found. Available sheet names to try:', possibleSheetNames);
        return [];
      }
      
      console.log(`Campaign Stats response from ${usedSheetName}:`, {
        hasValues: !!response.values,
        valuesLength: response.values?.length || 0,
        firstRow: response.values?.[0] || 'No rows'
      });
      
      if (!response.values || response.values.length === 0) {
        console.log(`No campaign stats found in ${usedSheetName} sheet`);
        return [];
      }

      return response.values
        .filter((row: string[]) => row.length >= 3 && row[0] && row[1]) // campaign_id and project_id
        .map((row: string[]) => ({
          campaign_id: row[0] || '',
          project_id: row[1] || '',
          total_sent: parseInt(row[2]) || 0,
          accepted: parseInt(row[3]) || 0,
          delivered: parseInt(row[4]) || 0,
          opened_total: parseInt(row[5]) || 0,
          opened_unique: parseInt(row[6]) || 0,
          clicked_total: parseInt(row[7]) || 0,
          clicked_unique: parseInt(row[8]) || 0,
          failed: parseInt(row[9]) || 0,
          bounced: parseInt(row[10]) || 0,
          complained: parseInt(row[11]) || 0,
          unsubscribed: parseInt(row[12]) || 0,
          delivery_rate: parseFloat(row[13]) || 0,
          open_rate: parseFloat(row[14]) || 0,
          click_rate: parseFloat(row[15]) || 0,
          click_to_open_rate: parseFloat(row[16]) || 0,
          bounce_rate: parseFloat(row[17]) || 0,
          failure_rate: parseFloat(row[18]) || 0,
          complaint_rate: parseFloat(row[19]) || 0,
          stats_fetched_at: row[20] || '',
          mailgun_events_found: parseInt(row[21]) || 0,
          time_range_begin: row[22] || '',
          time_range_end: row[23] || '',
          update_type: row[24] || ''
        }));
    } catch (error) {
      console.error('Error fetching campaign stats from Google Sheets:', error);
      return [];
    }
  }

  // Get campaign stats by project ID
  async getCampaignStatsByProject(projectId: string): Promise<any[]> {
    try {
      console.log('Getting campaign stats for project:', projectId);
      const allStats = await this.getCampaignStats();
      console.log('Total campaign stats found:', allStats.length);
      
      const projectStats = allStats.filter(stat => stat.project_id === projectId);
      console.log('Campaign stats for project', projectId + ':', projectStats.length);
      
      return projectStats;
    } catch (error) {
      console.error('Error fetching campaign stats by project:', error);
      return [];
    }
  }

  // Get all projects from the Projects tab
  async getProjects(): Promise<any[]> {
    try {
      console.log('Fetching projects from Google Sheets...');
      const response = await this.makeAuthenticatedRequest('/values/Projects!A2:Z');
      
      console.log('Google Sheets projects response:', {
        hasValues: !!response.values,
        valuesLength: response.values?.length || 0,
        firstRow: response.values?.[0] || 'No rows'
      });
      
      if (!response.values || response.values.length === 0) {
        console.log('No projects found in Google Sheets');
        return [];
      }

      return response.values
        .filter((row: string[]) => row.length >= 3 && row[0] && row[2]) // project_id and company_name
        .map((row: string[]) => ({
          project_id: row[0] || '',
          user_id: row[1] || '',
          company_name: row[2] || '',
          niche: row[3] || '',
          no_of_leads: parseInt(row[4]) || 0,
          status: row[5] || 'Created',
          created_at: row[6] || '',
          error: row[7] || '',
          // Add any additional fields based on your Projects sheet structure
        }));
    } catch (error) {
      console.error('Error fetching projects from Google Sheets:', error);
      return [];
    }
  }

  // Clear stored tokens (logout)
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_refresh_token');
      localStorage.removeItem('google_token_expiry');
    }
  }
}

// Export singleton instance
export const googleOAuthDirectService = new GoogleOAuthDirectService();
export type { GoogleSheetsLead };
