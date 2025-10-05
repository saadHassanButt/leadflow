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
      const response = await this.makeAuthenticatedRequest('/values/Email_Templates!G2:N');
      
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
      const templates = await this.getTemplates();
      const templateIndex = templates.findIndex(template => template.template_id === templateId);

      if (templateIndex === -1) {
        console.error('Template not found:', templateId);
        return false;
      }

      const template = templates[templateIndex];
      const rowNumber = templateIndex + 2; // +2 because we start from row 2 (after header)

      const values = [
        template.template_id,
        template.project_id,
        updates.subject,
        updates.body,
        'Yes', // user_edited
        updates.body, // final_version
        template.ai_generated,
        template.model_used
      ];

      await this.makeAuthenticatedRequest(`/values/Email_Templates!G${rowNumber}:N${rowNumber}?valueInputOption=RAW`, {
        method: 'PUT',
        body: JSON.stringify({
          values: [values]
        })
      });

      console.log('Template successfully updated in Google Sheets:', templateId);
      return true;
    } catch (error) {
      console.error('Error updating template in Google Sheets:', error);
      return false;
    }
  }

  // Update an existing lead
  async updateLead(leadId: string, updates: Partial<GoogleSheetsLead>): Promise<boolean> {
    try {
      console.log('Updating lead:', leadId);
      const leads = await this.getLeads();
      console.log('Total leads fetched:', leads.length);
      
      const leadIndex = leads.findIndex(lead => lead.lead_id === leadId);
      console.log('Lead index found:', leadIndex);
      
      if (leadIndex === -1) {
        console.error('Lead not found:', leadId);
        console.log('Available lead IDs:', leads.map(l => l.lead_id));
        return false;
      }

      const rowNumber = leadIndex + 2;
      
      const values = [
        updates.lead_id || leads[leadIndex].lead_id,
        updates.project_id || leads[leadIndex].project_id,
        updates.name || leads[leadIndex].name,
        updates.email || leads[leadIndex].email,
        updates.company || leads[leadIndex].company,
        updates.position || leads[leadIndex].position,
        updates.source || leads[leadIndex].source,
        updates.status || leads[leadIndex].status,
        updates.phone || leads[leadIndex].phone || '',
        updates.website || leads[leadIndex].website || '',
        updates.address || leads[leadIndex].address || '',
        updates.rating || leads[leadIndex].rating || '',
        updates.scraped_at || leads[leadIndex].scraped_at || '',
        updates.error || leads[leadIndex].error || '',
        // Validation columns
        updates.validation_status || leads[leadIndex].validation_status || '',
        updates.validation_score || leads[leadIndex].validation_score || '',
        updates.validation_reason || leads[leadIndex].validation_reason || '',
        updates.is_deliverable || leads[leadIndex].is_deliverable || '',
        updates.is_free_email || leads[leadIndex].is_free_email || '',
        updates.is_role_email || leads[leadIndex].is_role_email || '',
        updates.is_disposable || leads[leadIndex].is_disposable || '',
        updates.validated_at || leads[leadIndex].validated_at || ''
      ];

      await this.makeAuthenticatedRequest(`/values/Leads!A${rowNumber}:V${rowNumber}?valueInputOption=RAW`, {
        method: 'PUT',
        body: JSON.stringify({
          values: [values]
        })
      });

      console.log('Lead successfully updated in Google Sheets:', leadId);
      return true;
    } catch (error) {
      console.error('Error updating lead in Google Sheets:', error);
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
      const response = await this.makeAuthenticatedRequest('/values/Campaign_Stats!A2:L');
      
      console.log('Campaign Stats response:', {
        hasValues: !!response.values,
        valuesLength: response.values?.length || 0,
        firstRow: response.values?.[0] || 'No rows'
      });
      
      if (!response.values || response.values.length === 0) {
        console.log('No campaign stats found in Google Sheets');
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
          complained: parseInt(row[11]) || 0
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
