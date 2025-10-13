// Google OAuth Service for Google Sheets API
// Uses service account authentication for persistent access

const GOOGLE_SHEETS_DOCUMENT_ID = '1ipsWabylSSq1m8GjO1lcyajjqFAqZ4BXoxYBEcRJDUE';

// Service Account Credentials (you'll need to create a service account in Google Cloud Console)
const SERVICE_ACCOUNT_EMAIL = 'your-service-account@your-project.iam.gserviceaccount.com';

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
}

interface GoogleSheetsProject {
  project_id: string;
  user_id: string;
  company_name: string;
  niche: string;
  no_of_leads: number;
  status: string;
  created_at: string;
  error?: string;
}

class GoogleOAuthService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Generate JWT token for service account authentication
  private async generateJWT(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600, // 1 hour
      sub: SERVICE_ACCOUNT_EMAIL
    };

    // For now, we'll use a simpler approach with API key
    // In production, you'd implement proper JWT signing here
    return 'jwt-token-placeholder';
  }

  // Get access token for Google Sheets API
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // For now, we'll use the API key approach
      // In production, implement proper OAuth flow here
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: await this.generateJWT()
        })
      });

      if (!response.ok) {
        throw new Error(`OAuth token request failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer

      if (!this.accessToken) {
        throw new Error('Failed to obtain access token');
      }
      return this.accessToken;
    } catch (error) {
      console.error('Error getting OAuth token:', error);
      throw error;
    }
  }

  // Make authenticated request to Google Sheets API
  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAccessToken();
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

  // Get all leads from the Leads tab
  async getLeads(): Promise<GoogleSheetsLead[]> {
    try {
      const response = await this.makeAuthenticatedRequest('/values/Leads!A2:N');
      
      if (!response.values || response.values.length === 0) {
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
          error: row[13] || ''
        }));
    } catch (error) {
      console.error('Error fetching leads from Google Sheets:', error);
      return [];
    }
  }

  // Get leads by project ID
  async getLeadsByProject(projectId: string): Promise<GoogleSheetsLead[]> {
    const allLeads = await this.getLeads();
    return allLeads.filter(lead => lead.project_id === projectId);
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
        lead.error || ''
      ];

      await this.makeAuthenticatedRequest('/values/Leads!A:N:append', {
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

  // Update an existing lead
  async updateLead(leadId: string, updates: Partial<GoogleSheetsLead>): Promise<boolean> {
    try {
      const leads = await this.getLeads();
      const leadIndex = leads.findIndex(lead => lead.lead_id === leadId);
      
      if (leadIndex === -1) {
        console.error('Lead not found:', leadId);
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
        updates.error || leads[leadIndex].error || ''
      ];

      await this.makeAuthenticatedRequest(`/values/Leads!A${rowNumber}:N${rowNumber}`, {
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
}

// Export singleton instance
export const googleOAuthService = new GoogleOAuthService();
export type { GoogleSheetsLead, GoogleSheetsProject };
