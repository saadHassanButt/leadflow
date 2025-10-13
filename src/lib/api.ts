import { ApiResponse, WebhookPayload } from '@/types/api';
import { Project, CreateProjectData } from '@/types/project';
import { Lead, CreateLeadData } from '@/types/lead';
import { EmailTemplate, Campaign } from '@/types/campaign';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Project endpoints
  async createProject(data: CreateProjectData): Promise<ApiResponse<Project>> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`);
  }

  async updateProject(id: string, data: Partial<Project>): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Lead endpoints
  async getLeads(projectId: string): Promise<ApiResponse<Lead[]>> {
    return this.request<Lead[]>(`/projects/${projectId}/leads`);
  }

  async createLead(projectId: string, data: CreateLeadData): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/projects/${projectId}/leads`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLead(projectId: string, leadId: string, data: Partial<Lead>): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/projects/${projectId}/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLead(projectId: string, leadId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/projects/${projectId}/leads/${leadId}`, {
      method: 'DELETE',
    });
  }

  // Template endpoints
  async getTemplate(projectId: string): Promise<ApiResponse<EmailTemplate>> {
    return this.request<EmailTemplate>(`/projects/${projectId}/template`);
  }

  async updateTemplate(projectId: string, data: Partial<EmailTemplate>): Promise<ApiResponse<EmailTemplate>> {
    return this.request<EmailTemplate>(`/projects/${projectId}/template`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Campaign endpoints
  async getCampaign(projectId: string): Promise<ApiResponse<Campaign>> {
    return this.request<Campaign>(`/projects/${projectId}/campaign`);
  }

  // N8N Webhook triggers
  async triggerWebhook(action: string, projectId: string, data: Record<string, unknown>): Promise<void> {
    const payload: WebhookPayload = {
      action,
      projectId,
      data,
      timestamp: new Date().toISOString(),
    };

    await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new ApiClient();
