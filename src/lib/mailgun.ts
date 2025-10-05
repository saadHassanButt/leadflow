// UPDATED MAILGUN API SERVICE - USING NEW METRICS API
// Documentation: https://documentation.mailgun.com/docs/mailgun/api-reference/openapi-final/tag/Metrics/

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const MAILGUN_BASE_URL = 'https://api.mailgun.net'; // Updated base URL

export interface MailgunMetrics {
  accepted_count: number;
  delivered_count: number;
  failed_permanent_count: number;
  failed_temporary_count: number;
  opened_count: number;
  clicked_count: number;
  complained_count: number;
  unsubscribed_count: number;
  stored_count: number;
  processed_count: number;
}

export interface MailgunStats {
  accepted: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  complained: number;
  unsubscribed: number;
  stored: number;
  total: number;
}

export interface MailgunMetricsResponse {
  start: string;
  end: string;
  resolution: string;
  metrics: MailgunMetrics;
  dimensions: any[];
}

class MailgunService {
  private apiKey: string;
  private domain: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = MAILGUN_API_KEY;
    this.domain = MAILGUN_DOMAIN;
    this.baseUrl = MAILGUN_BASE_URL;
    
    console.log('NEW Mailgun Metrics API Service initialized:');
    console.log('- API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');
    console.log('- Domain:', this.domain);
    console.log('- Base URL:', this.baseUrl);
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('Making Mailgun Metrics API request:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${btoa(`api:${this.apiKey}`)}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mailgun API error:', errorText);
      throw new Error(`Mailgun API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  // NEW METRICS API - Get domain metrics
  async getDomainMetrics(startDate?: string, endDate?: string): Promise<MailgunStats> {
    try {
      // Mailgun Metrics API expects dates in RFC 2822 format: "Thu, 13 Oct 2011 18:02:00 +0000"
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toUTCString();
      const defaultEndDate = new Date().toUTCString();
      
      const payload = {
        start: startDate || defaultStartDate,
        end: endDate || defaultEndDate,
        metrics: [
          'accepted_count',
          'delivered_count', 
          'failed_permanent_count',
          'failed_temporary_count',
          'opened_count',
          'clicked_count',
          'complained_count',
          'unsubscribed_count',
          'stored_count'
        ],
        filters: {
          domain: [this.domain]
        }
      };

      console.log('Fetching metrics with payload:', payload);
      
      const response = await this.makeRequest('/v1/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return this.convertMetricsToStats(response);
    } catch (error) {
      console.error('Error fetching domain metrics:', error);
      return this.getEmptyStats();
    }
  }

  // Get project-specific metrics (if using tags)
  async getProjectMetrics(projectId: string, startDate?: string, endDate?: string): Promise<MailgunStats> {
    try {
      // Mailgun Metrics API expects dates in RFC 2822 format: "Thu, 13 Oct 2011 18:02:00 +0000"
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toUTCString();
      const defaultEndDate = new Date().toUTCString();
      
      const payload = {
        start: startDate || defaultStartDate,
        end: endDate || defaultEndDate,
        metrics: [
          'accepted_count',
          'delivered_count',
          'failed_permanent_count', 
          'failed_temporary_count',
          'opened_count',
          'clicked_count',
          'complained_count',
          'unsubscribed_count'
        ],
        filters: {
          domain: [this.domain],
          tag: [projectId] // Filter by project tag
        }
      };

      const response = await this.makeRequest('/v1/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return this.convertMetricsToStats(response);
    } catch (error) {
      console.error('Error fetching project metrics:', error);
      return this.getEmptyStats();
    }
  }

  // Convert new metrics format to legacy stats format for compatibility
  private convertMetricsToStats(response: any): MailgunStats {
    // Handle the new API response structure with items array
    if (response.items && Array.isArray(response.items)) {
      // Aggregate metrics from all items
      const aggregatedMetrics = response.items.reduce((acc: any, item: any) => {
        const metrics = item.metrics || {};
        return {
          accepted_count: (acc.accepted_count || 0) + (metrics.accepted_count || 0),
          delivered_count: (acc.delivered_count || 0) + (metrics.delivered_count || 0),
          failed_permanent_count: (acc.failed_permanent_count || 0) + (metrics.failed_permanent_count || 0),
          failed_temporary_count: (acc.failed_temporary_count || 0) + (metrics.failed_temporary_count || 0),
          opened_count: (acc.opened_count || 0) + (metrics.opened_count || 0),
          clicked_count: (acc.clicked_count || 0) + (metrics.clicked_count || 0),
          complained_count: (acc.complained_count || 0) + (metrics.complained_count || 0),
          unsubscribed_count: (acc.unsubscribed_count || 0) + (metrics.unsubscribed_count || 0),
          stored_count: (acc.stored_count || 0) + (metrics.stored_count || 0)
        };
      }, {});

      return {
        accepted: aggregatedMetrics.accepted_count || 0,
        delivered: aggregatedMetrics.delivered_count || 0,
        failed: (aggregatedMetrics.failed_permanent_count || 0) + (aggregatedMetrics.failed_temporary_count || 0),
        opened: aggregatedMetrics.opened_count || 0,
        clicked: aggregatedMetrics.clicked_count || 0,
        complained: aggregatedMetrics.complained_count || 0,
        unsubscribed: aggregatedMetrics.unsubscribed_count || 0,
        stored: aggregatedMetrics.stored_count || 0,
        total: aggregatedMetrics.accepted_count || 0
      };
    }
    
    // Fallback to old format if response structure is different
    const metrics = response.metrics || {};
    return {
      accepted: metrics.accepted_count || 0,
      delivered: metrics.delivered_count || 0,
      failed: (metrics.failed_permanent_count || 0) + (metrics.failed_temporary_count || 0),
      opened: metrics.opened_count || 0,
      clicked: metrics.clicked_count || 0,
      complained: metrics.complained_count || 0,
      unsubscribed: metrics.unsubscribed_count || 0,
      stored: metrics.stored_count || 0,
      total: metrics.processed_count || 0
    };
  }

  private getEmptyStats(): MailgunStats {
    return {
      accepted: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
      complained: 0,
      unsubscribed: 0,
      stored: 0,
      total: 0
    };
  }

  // DEPRECATED - Keep for backward compatibility
  async getDomainStats(startDate?: string, endDate?: string): Promise<any> {
    console.warn('getDomainStats is deprecated, use getDomainMetrics instead');
    const stats = await this.getDomainMetrics(startDate, endDate);
    return {
      domain: this.domain,
      stats,
      time_range: {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toUTCString(),
        end: endDate || new Date().toUTCString()
      }
    };
  }

  // DEPRECATED - Keep for backward compatibility
  async getProjectEvents(projectId: string, limit: number = 100): Promise<any[]> {
    console.warn('getProjectEvents is deprecated, use getProjectMetrics instead');
    return [];
  }

  // Get campaign statistics
  async getCampaignStats(campaignId: string, startDate?: string, endDate?: string): Promise<MailgunCampaignStats> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      
      const queryString = params.toString();
      const endpoint = `/domains/${this.domain}/campaigns/${campaignId}/stats${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.makeRequest(endpoint);
      
      return {
        campaign_id: campaignId,
        campaign_name: response.campaign_name || 'Unknown Campaign',
        stats: this.parseStatsResponse(response),
        events: response.events || [],
        time_range: {
          start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
      throw error;
    }
  }

  // Get events for a specific campaign
  async getCampaignEvents(campaignId: string, eventType?: string, limit: number = 100): Promise<MailgunEvent[]> {
    try {
      const params = new URLSearchParams();
      if (eventType) params.append('event', eventType);
      params.append('limit', limit.toString());
      
      const queryString = params.toString();
      const endpoint = `/domains/${this.domain}/events${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.makeRequest(endpoint);
      return response.items || [];
    } catch (error) {
      console.error('Error fetching campaign events:', error);
      throw error;
    }
  }

  // Get all events for domain
  async getAllEvents(eventType?: string, limit: number = 1000): Promise<MailgunEvent[]> {
    try {
      const params = new URLSearchParams();
      if (eventType) params.append('event', eventType);
      params.append('limit', limit.toString());
      
      const queryString = params.toString();
      const endpoint = `/domains/${this.domain}/events${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching all events from endpoint:', endpoint);
      const response = await this.makeRequest(endpoint);
      console.log('All events response:', response);
      return response.items || [];
    } catch (error) {
      console.error('Error fetching all events:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  // Parse Mailgun stats response into our format
  private parseStatsResponse(response: any): MailgunStats {
    const stats = response.stats || response;
    
    return {
      accepted: stats.accepted || 0,
      delivered: stats.delivered || 0,
      failed: stats.failed || 0,
      opened: stats.opened || 0,
      clicked: stats.clicked || 0,
      complained: stats.complained || 0,
      unsubscribed: stats.unsubscribed || 0,
      stored: stats.stored || 0,
      total: stats.total || 0
    };
  }

  // Get recent events for a project (by searching for project ID in tags or user variables)
  async getProjectEvents(projectId: string, limit: number = 100): Promise<MailgunEvent[]> {
    try {
      console.log('Fetching project events for project:', projectId);
      const allEvents = await this.getAllEvents(undefined, limit);
      console.log('Total events fetched:', allEvents.length);
      
      // Filter events that contain the project ID in tags or user variables
      const projectEvents = allEvents.filter(event => 
        event.tags?.includes(projectId) || 
        event['user-variables']?.project_id === projectId ||
        event.campaigns?.includes(projectId)
      );
      
      console.log('Project-specific events found:', projectEvents.length);
      return projectEvents;
    } catch (error) {
      console.error('Error fetching project events:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  // Calculate delivery rate
  calculateDeliveryRate(stats: MailgunStats): number {
    if (stats.accepted === 0) return 0;
    return (stats.delivered / stats.accepted) * 100;
  }

  // Calculate open rate
  calculateOpenRate(stats: MailgunStats): number {
    if (stats.delivered === 0) return 0;
    return (stats.opened / stats.delivered) * 100;
  }

  // Calculate click rate
  calculateClickRate(stats: MailgunStats): number {
    if (stats.delivered === 0) return 0;
    return (stats.clicked / stats.delivered) * 100;
  }

  // Calculate bounce rate
  calculateBounceRate(stats: MailgunStats): number {
    if (stats.accepted === 0) return 0;
    return (stats.failed / stats.accepted) * 100;
  }
}

// Export singleton instance
export const mailgunService = new MailgunService();
export type { MailgunEvent, MailgunStats, MailgunCampaignStats, MailgunDomainStats };
