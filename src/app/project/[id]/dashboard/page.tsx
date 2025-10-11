'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  Mail, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Target,
  Send,
  Eye,
  MousePointer,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useProject } from '@/lib/hooks/use-project';
import { useLeads } from '@/lib/hooks/use-leads';
import { mailgunService, MailgunStats } from '@/lib/mailgun';
import { ProjectAnalytics, GoogleSheetsCampaignStats } from '@/types/mailgun';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, loading: projectLoading } = useProject(projectId);
  const { leads, loading: leadsLoading } = useLeads(projectId);
  
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    if (!projectId) return;
    
    // Use project data if available, otherwise use fallback values
    const projectName = project?.name || `Project ${projectId.slice(-8)}`;
    
    setRefreshing(true);
    try {
      console.log('=== FETCHING DASHBOARD ANALYTICS ===');
      console.log('Project ID:', projectId);
      
      // Get tokens from localStorage (same pattern as leads and templates)
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');
      
      // Fetch leads data using API route (same pattern as other pages)
      let allLeads = [];
      try {
        console.log('Fetching leads from API...');
        const leadsResponse = await fetch(`/api/leads?project_id=${projectId}`, {
          headers: {
            'x-google-access-token': accessToken || '',
            'x-google-refresh-token': refreshToken || '',
            'x-google-token-expiry': tokenExpiry || '0',
          }
        });
        
        const leadsData = await leadsResponse.json();
        
        if (leadsData.success) {
          allLeads = leadsData.data;
          console.log('Successfully fetched leads:', allLeads.length);
        } else if (leadsData.error === 'Not authenticated with Google Sheets' || leadsData.error === 'Token expired, please re-authenticate') {
          // Redirect to authentication page
          window.location.href = `/auth/google?project_id=${projectId}`;
          return;
        } else {
          console.warn('Failed to fetch leads from API, using local leads:', leadsData.error);
          allLeads = leads || [];
        }
      } catch (error) {
        console.warn('Failed to fetch leads from API, using local leads:', error);
        // Fallback to local leads data
        allLeads = leads || [];
      }
      
      // Calculate lead statistics
      const leadStats = {
        total: allLeads.length,
        validated: allLeads.filter(lead => lead.validation_status && lead.validation_status !== '').length,
        deliverable: allLeads.filter(lead => lead.validation_status === 'deliverable').length,
        undeliverable: allLeads.filter(lead => lead.validation_status === 'undeliverable').length,
        risky: allLeads.filter(lead => lead.validation_status === 'risky').length,
      };

      // Fetch email templates using API route
      let templates = [];
      try {
        console.log('Fetching templates from API...');
        const templatesResponse = await fetch(`/api/templates?project_id=${projectId}`, {
          headers: {
            'x-google-access-token': accessToken || '',
            'x-google-refresh-token': refreshToken || '',
            'x-google-token-expiry': tokenExpiry || '0',
          }
        });
        
        const templatesData = await templatesResponse.json();
        
        if (templatesData.success) {
          templates = templatesData.data;
          console.log('Successfully fetched templates:', templates.length);
        } else if (templatesData.error === 'Not authenticated with Google Sheets' || templatesData.error === 'Token expired, please re-authenticate') {
          // Redirect to authentication page
          window.location.href = `/auth/google?project_id=${projectId}`;
          return;
        } else {
          console.warn('Failed to fetch templates from API:', templatesData.error);
        }
      } catch (error) {
        console.warn('Failed to fetch templates from API:', error);
      }

      const templateStats = {
        total: templates.length,
        generated: templates.filter(t => t.ai_generated).length,
        edited: templates.filter(t => t.user_edited).length,
      };

      // Fetch campaign statistics using API route
      let campaignStats: GoogleSheetsCampaignStats | null = null;
      let mailgunStats: MailgunStats = {
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

      try {
        console.log('Fetching campaign statistics from API...');
        const statsResponse = await fetch('/api/campaign-stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-google-access-token': accessToken || '',
            'x-google-refresh-token': refreshToken || '',
            'x-google-token-expiry': tokenExpiry || '0',
          },
          body: JSON.stringify({
            project_id: projectId
          }),
        });
        
        const statsData = await statsResponse.json();
        
        if (statsData.success && statsData.data.length > 0) {
          campaignStats = statsData.data[0]; // Use the first campaign stats found
          
          // Convert Google Sheets stats to MailgunStats format for compatibility
          mailgunStats = {
            accepted: campaignStats.accepted,
            delivered: campaignStats.delivered,
            failed: campaignStats.failed,
            opened: campaignStats.opened_unique,
            clicked: campaignStats.clicked_unique,
            complained: campaignStats.complained,
            unsubscribed: campaignStats.unsubscribed,
            stored: 0, // Not available in Google Sheets
            total: campaignStats.total_sent
          };
          
          console.log('Successfully fetched campaign stats from API:', campaignStats);
        } else if (statsData.error === 'Not authenticated with Google Sheets' || statsData.error === 'Token expired, please re-authenticate') {
          // Redirect to authentication page
          window.location.href = `/auth/google?project_id=${projectId}`;
          return;
        } else {
          console.log('No campaign stats found for project:', projectId);
        }
      } catch (error) {
        console.warn('Failed to fetch campaign stats from API:', error);
        // Keep the empty stats initialized above
      }

      // Use pre-calculated performance metrics from Google Sheets if available
      const performanceMetrics = campaignStats ? {
        delivery_rate: campaignStats.delivery_rate,
        open_rate: campaignStats.open_rate,
        click_rate: campaignStats.click_rate,
        bounce_rate: campaignStats.bounce_rate,
      } : {
        delivery_rate: mailgunStats.accepted > 0 ? (mailgunStats.delivered / mailgunStats.accepted) * 100 : 0,
        open_rate: mailgunStats.delivered > 0 ? (mailgunStats.opened / mailgunStats.delivered) * 100 : 0,
        click_rate: mailgunStats.delivered > 0 ? (mailgunStats.clicked / mailgunStats.delivered) * 100 : 0,
        bounce_rate: mailgunStats.accepted > 0 ? (mailgunStats.failed / mailgunStats.accepted) * 100 : 0,
      };

      // Create comprehensive analytics object
      const projectAnalytics: ProjectAnalytics = {
        project_id: projectId,
        project_name: projectName,
        leads: leadStats,
        templates: templateStats,
        campaigns: {
          total: campaignStats ? 1 : 0, // One campaign per project if stats exist
          active: campaignStats && campaignStats.accepted > 0 ? 1 : 0,
          completed: campaignStats && campaignStats.delivered > 0 ? 1 : 0,
        },
        mailgun_stats: mailgunStats,
        performance_metrics: performanceMetrics,
        time_range: {
          start: campaignStats?.time_range_begin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: campaignStats?.time_range_end || new Date().toISOString()
        }
      };

      setAnalytics(projectAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      // Start fetching analytics as soon as we have projectId
      // Don't wait for project to load completely
      fetchAnalytics();
    }
  }, [projectId]);

  // Separate effect to refetch when project loads
  useEffect(() => {
    if (projectId && project && !analytics) {
      fetchAnalytics();
    }
  }, [project]);

  if (projectLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-neutral-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-error-500 mx-auto mb-4" />
          <p className="text-neutral-300">Failed to load analytics</p>
          <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/project/${projectId}`)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Project
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Project Dashboard</h1>
                <p className="text-neutral-300 mt-1">{analytics.project_name}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={fetchAnalytics}
              loading={refreshing}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Leads Card */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-white">{analytics.leads.total}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Total Leads</h3>
              <div className="space-y-2 text-sm text-neutral-300">
                <div className="flex justify-between">
                  <span>Validated:</span>
                  <span className="text-green-400">{analytics.leads.validated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deliverable:</span>
                  <span className="text-green-400">{analytics.leads.deliverable}</span>
                </div>
                <div className="flex justify-between">
                  <span>Undeliverable:</span>
                  <span className="text-red-400">{analytics.leads.undeliverable}</span>
                </div>
              </div>
            </div>

            {/* Templates Card */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-white">{analytics.templates.total}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email Templates</h3>
              <div className="space-y-2 text-sm text-neutral-300">
                <div className="flex justify-between">
                  <span>Generated:</span>
                  <span className="text-blue-400">{analytics.templates.generated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Edited:</span>
                  <span className="text-orange-400">{analytics.templates.edited}</span>
                </div>
              </div>
            </div>

            {/* Campaigns Card */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Send className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-white">{analytics.campaigns.total}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Campaigns</h3>
              <div className="space-y-2 text-sm text-neutral-300">
                <div className="flex justify-between">
                  <span>Active:</span>
                  <span className="text-green-400">{analytics.campaigns.active}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="text-blue-400">{analytics.campaigns.completed}</span>
                </div>
              </div>
            </div>

            {/* Performance Card */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-white">
                  {Math.round(analytics.performance_metrics.delivery_rate)}%
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delivery Rate</h3>
              <div className="space-y-2 text-sm text-neutral-300">
                <div className="flex justify-between">
                  <span>Open Rate:</span>
                  <span className="text-green-400">{Math.round(analytics.performance_metrics.open_rate)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Click Rate:</span>
                  <span className="text-blue-400">{Math.round(analytics.performance_metrics.click_rate)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Email Statistics */}
          <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Email Delivery Statistics</h3>
              <div className="text-sm text-neutral-400">
                Data from Google Sheets Campaign_Stats
              </div>
            </div>
            
            {/* Mailgun Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-3xl font-bold text-green-600">{analytics.mailgun_stats.accepted}</div>
                <div className="text-sm text-green-700 font-medium">Accepted</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{analytics.mailgun_stats.delivered}</div>
                <div className="text-sm text-blue-700 font-medium">Delivered</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{analytics.mailgun_stats.failed}</div>
                <div className="text-sm text-orange-700 font-medium">Failed</div>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-xl border border-teal-200">
                <div className="text-3xl font-bold text-teal-600">{analytics.mailgun_stats.opened}</div>
                <div className="text-sm text-teal-700 font-medium">Opened</div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-white">Performance Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Delivery Rate:</span>
                    <span className="font-medium text-white">
                      {Math.round(analytics.performance_metrics.delivery_rate)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Open Rate:</span>
                    <span className="font-medium text-white">
                      {Math.round(analytics.performance_metrics.open_rate)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Click Rate:</span>
                    <span className="font-medium text-white">
                      {Math.round(analytics.performance_metrics.click_rate)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Bounce Rate:</span>
                    <span className="font-medium text-red-400">
                      {Math.round(analytics.performance_metrics.bounce_rate)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Engagement Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Clicked:</span>
                    <span className="font-medium text-blue-400">{analytics.mailgun_stats.clicked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Complained:</span>
                    <span className="font-medium text-yellow-400">{analytics.mailgun_stats.complained}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Unsubscribed:</span>
                    <span className="font-medium text-red-400">{analytics.mailgun_stats.unsubscribed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Total Events:</span>
                    <span className="font-medium text-neutral-400">{analytics.mailgun_stats.total}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* No Stats Message */}
            {analytics.mailgun_stats.total === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">
                  No campaign statistics found for this project in Google Sheets.
                </p>
                <p className="text-neutral-500 text-xs mt-1">
                  Make sure your n8n workflow is updating the Campaign_Stats sheet.
                </p>
              </div>
            )}
          </div>

          {/* Lead Quality Analysis */}
          <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
            <h3 className="text-xl font-semibold text-white mb-6">Lead Quality Analysis</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-white">Email Validation Results</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Total Leads:</span>
                    <span className="font-medium text-white">{analytics.leads.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Validated:</span>
                    <span className="font-medium text-blue-400">{analytics.leads.validated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Deliverable:</span>
                    <span className="font-medium text-green-400">{analytics.leads.deliverable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Undeliverable:</span>
                    <span className="font-medium text-red-400">{analytics.leads.undeliverable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Risky:</span>
                    <span className="font-medium text-yellow-400">{analytics.leads.risky}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Quality Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Validation Rate:</span>
                    <span className="font-medium text-white">
                      {analytics.leads.total > 0 ? Math.round((analytics.leads.validated / analytics.leads.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Deliverable Rate:</span>
                    <span className="font-medium text-green-400">
                      {analytics.leads.validated > 0 ? Math.round((analytics.leads.deliverable / analytics.leads.validated) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Bounce Rate:</span>
                    <span className="font-medium text-red-400">
                      {analytics.leads.validated > 0 ? Math.round((analytics.leads.undeliverable / analytics.leads.validated) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => router.push(`/project/${projectId}/leads`)}
              icon={<Users className="w-4 h-4" />}
            >
              Manage Leads
            </Button>
            <Button
              onClick={() => router.push(`/project/${projectId}/template`)}
              icon={<FileText className="w-4 h-4" />}
            >
              Email Templates
            </Button>
            <Button
              onClick={() => router.push(`/project/${projectId}/campaign`)}
              icon={<Send className="w-4 h-4" />}
            >
              Launch Campaign
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
