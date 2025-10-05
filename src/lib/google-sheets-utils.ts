// Utility functions for Google Sheets operations
import { googleSheetsService } from './google-sheets';

// Utility function to refresh lead count for a project
export async function refreshProjectLeadCount(projectId: string): Promise<number> {
  try {
    const leads = await googleSheetsService.getLeadsByProject(projectId);
    const leadCount = leads.length;
    
    // Update the project's lead count
    await googleSheetsService.updateProjectLeadCount(projectId, leadCount);
    
    return leadCount;
  } catch (error) {
    console.error('Error refreshing project lead count:', error);
    return 0;
  }
}

// Utility function to get project statistics
export async function getProjectStats(projectId: string) {
  try {
    const leads = await googleSheetsService.getLeadsByProject(projectId);
    
    const stats = {
      totalLeads: leads.length,
      activeLeads: leads.filter(lead => lead.status === 'Active').length,
      sources: leads.reduce((acc: Record<string, number>, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {}),
      companies: [...new Set(leads.map(lead => lead.company))].length,
      lastUpdated: leads.length > 0 ? Math.max(...leads.map(lead => new Date(lead.scraped_at || 0).getTime())) : 0
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting project stats:', error);
    return {
      totalLeads: 0,
      activeLeads: 0,
      sources: {},
      companies: 0,
      lastUpdated: 0
    };
  }
}

// Utility function to export leads to CSV format
export function exportLeadsToCSV(leads: any[]): string {
  const headers = [
    'Lead ID',
    'Project ID',
    'Name',
    'Email',
    'Company',
    'Position',
    'Source',
    'Status',
    'Phone',
    'Website',
    'Address',
    'Rating',
    'Scraped At',
    'Error'
  ];
  
  const csvRows = [headers.join(',')];
  
  leads.forEach(lead => {
    const row = [
      lead.lead_id || '',
      lead.project_id || '',
      `"${(lead.name || '').replace(/"/g, '""')}"`,
      `"${(lead.email || '').replace(/"/g, '""')}"`,
      `"${(lead.company || '').replace(/"/g, '""')}"`,
      `"${(lead.position || '').replace(/"/g, '""')}"`,
      `"${(lead.source || '').replace(/"/g, '""')}"`,
      `"${(lead.status || '').replace(/"/g, '""')}"`,
      `"${(lead.phone || '').replace(/"/g, '""')}"`,
      `"${(lead.website || '').replace(/"/g, '""')}"`,
      `"${(lead.address || '').replace(/"/g, '""')}"`,
      `"${(lead.rating || '').replace(/"/g, '""')}"`,
      `"${(lead.scraped_at || '').replace(/"/g, '""')}"`,
      `"${(lead.error || '').replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

// Utility function to validate lead data
export function validateLeadData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (!data.email || data.email.trim() === '') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email format is invalid');
  }
  
  if (!data.company || data.company.trim() === '') {
    errors.push('Company is required');
  }
  
  if (!data.project_id || data.project_id.trim() === '') {
    errors.push('Project ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Utility function to generate lead ID
export function generateLeadId(projectId: string): string {
  return `lead_${projectId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// Utility function to generate project ID
export function generateProjectId(companyName: string): string {
  const cleanName = companyName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `${cleanName}-${Date.now()}`;
}
