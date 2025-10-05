// Google Sheets API Service
// Direct integration with Google Sheets API using service account credentials

const GOOGLE_SHEETS_DOCUMENT_ID = '1ipsWabylSSq1m8GjO1lcyajjqFAqZ4BXoxYBEcRJDUE';
const GOOGLE_API_KEY = 'AIzaSyA3-KviaVtVGXrJhTplcHkMN7RAFq_YeTM';

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

class GoogleSheetsService {
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  private apiKey = GOOGLE_API_KEY;

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/${GOOGLE_SHEETS_DOCUMENT_ID}${endpoint}?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
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
      const response = await this.makeRequest('/values/Leads!A2:N');
      
      if (!response.values || response.values.length === 0) {
        return [];
      }

      return response.values
        .filter((row: string[]) => row.length >= 4 && row[0] && row[1] && row[2] && row[3]) // Filter out empty rows
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

      await this.makeRequest('/values/Leads!A:N:append', {
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
      // First, find the row number of the lead
      const leads = await this.getLeads();
      const leadIndex = leads.findIndex(lead => lead.lead_id === leadId);
      
      if (leadIndex === -1) {
        console.error('Lead not found:', leadId);
        return false;
      }

      const rowNumber = leadIndex + 2; // +2 because we skip header and arrays are 0-indexed
      
      // Update the specific row
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

      await this.makeRequest(`/values/Leads!A${rowNumber}:N${rowNumber}`, {
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
      // First, find the row number of the lead
      const leads = await this.getLeads();
      const leadIndex = leads.findIndex(lead => lead.lead_id === leadId);
      
      if (leadIndex === -1) {
        console.error('Lead not found:', leadId);
        return false;
      }

      const rowNumber = leadIndex + 2; // +2 because we skip header and arrays are 0-indexed
      
      // Delete the row
      await this.makeRequest(`/values/Leads!A${rowNumber}:N${rowNumber}`, {
        method: 'DELETE'
      });

      console.log('Lead successfully deleted from Google Sheets:', leadId);
      return true;
    } catch (error) {
      console.error('Error deleting lead from Google Sheets:', error);
      return false;
    }
  }

  // Get all projects from the Projects tab
  async getProjects(): Promise<GoogleSheetsProject[]> {
    try {
      const response = await this.makeRequest('/values/Projects!A2:H');
      
      if (!response.values || response.values.length === 0) {
        return [];
      }

      return response.values
        .filter((row: string[]) => row.length >= 2 && row[0] && row[1]) // Filter out empty rows
        .map((row: string[]) => ({
          project_id: row[0] || '',
          user_id: row[1] || '',
          company_name: row[2] || '',
          niche: row[3] || '',
          no_of_leads: parseInt(row[4]) || 0,
          status: row[5] || 'Created',
          created_at: row[6] || '',
          error: row[7] || ''
        }));
    } catch (error) {
      console.error('Error fetching projects from Google Sheets:', error);
      return [];
    }
  }

  // Add a new project
  async addProject(project: GoogleSheetsProject): Promise<boolean> {
    try {
      const values = [
        project.project_id,
        project.user_id,
        project.company_name,
        project.niche,
        project.no_of_leads.toString(),
        project.status,
        project.created_at,
        project.error || 'FALSE'
      ];

      await this.makeRequest('/values/Projects!A:H:append', {
        method: 'POST',
        body: JSON.stringify({
          values: [values]
        })
      });

      console.log('Project successfully added to Google Sheets:', project.project_id);
      return true;
    } catch (error) {
      console.error('Error adding project to Google Sheets:', error);
      return false;
    }
  }

  // Update project lead count
  async updateProjectLeadCount(projectId: string, leadCount: number): Promise<boolean> {
    try {
      const projects = await this.getProjects();
      const projectIndex = projects.findIndex(project => project.project_id === projectId);
      
      if (projectIndex === -1) {
        console.error('Project not found:', projectId);
        return false;
      }

      const rowNumber = projectIndex + 2; // +2 because we skip header and arrays are 0-indexed
      
      // Update the lead count (column E)
      await this.makeRequest(`/values/Projects!E${rowNumber}`, {
        method: 'PUT',
        body: JSON.stringify({
          values: [[leadCount.toString()]]
        })
      });

      console.log('Project lead count updated in Google Sheets:', projectId, leadCount);
      return true;
    } catch (error) {
      console.error('Error updating project lead count in Google Sheets:', error);
      return false;
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
export type { GoogleSheetsLead, GoogleSheetsProject };
