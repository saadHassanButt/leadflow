'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, BarChart3, Mail, TrendingUp, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { useProject } from '@/lib/hooks/use-project';
import { StepNavigation } from '@/components/project/step-navigation';
import { apiClient } from '@/lib/api';
import { Campaign } from '@/types/campaign';
import { GoogleSheetsCampaignStats } from '@/types/mailgun';

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, loading: projectLoading } = useProject(projectId);
  const [leads, setLeads] = useState<Record<string, unknown>[]>([]);
  const [, setLeadsLoading] = useState(true);
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [launching, setLaunching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaignStats, setCampaignStats] = useState<GoogleSheetsCampaignStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch leads from Google Sheets
  const fetchLeads = useCallback(async () => {
    try {
      setLeadsLoading(true);
      
      // Get tokens from localStorage
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      const response = await fetch(`/api/leads?project_id=${projectId}`, {
        headers: {
          'x-google-access-token': accessToken || '',
          'x-google-refresh-token': refreshToken || '',
          'x-google-token-expiry': tokenExpiry || '0',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLeads(data.data);
      } else if (data.error === 'Not authenticated with Google Sheets' || data.error === 'Token expired, please re-authenticate') {
        // Redirect to authentication page
        window.location.href = `/auth/google?project_id=${projectId}`;
        return;
      } else {
        console.error('Failed to fetch leads:', data.error);
        setLeads([]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchLeads();
    }
  }, [projectId, fetchLeads]);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await apiClient.getCampaign(projectId);
        if (response.data) {
          setCampaign(response.data);
        }
      } catch {
        // Campaign API endpoint doesn't exist yet - this is expected for new campaigns
        console.log('Campaign endpoint not found (expected for new campaigns)');
        // Initialize with draft status if no campaign exists
        setCampaign({
          id: projectId,
          projectId: projectId,
          templateId: '',
          status: 'draft',
          totalEmails: 0,
          sentEmails: 0,
          openedEmails: 0,
          clickedEmails: 0,
          repliedEmails: 0,
          bouncedEmails: 0,
          meetingsScheduled: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchCampaign();
    }
  }, [projectId]);

  const handleLaunchCampaign = async () => {
    setLaunching(true);
    try {
      // Call the n8n webhook directly
      const n8nBaseUrl = process.env.NEXT_PUBLIC_N8N_BASE_URL || 'https://n8n.brokemediaio.com';
      const webhookPayload = {
        project_id: projectId,
        leads: leads,
        project: project,
        timestamp: new Date().toISOString()
      };

      console.log('Launching campaign with payload:', webhookPayload);
      console.log('Attempting to call webhook:', `${n8nBaseUrl}/webhook/launch-campaign`);

      const response = await fetch(`${n8nBaseUrl}/webhook/launch-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`Webhook call failed: ${response.status} ${response.statusText}`);
      }

      // Check if response has content before trying to parse JSON
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let result;
      if (responseText.trim()) {
        try {
          result = JSON.parse(responseText);
          console.log('Campaign launch response:', result);
        } catch {
          console.log('Response is not JSON, treating as text:', responseText);
          result = { message: responseText, success: true };
        }
      } else {
        console.log('Empty response received');
        result = { message: 'Campaign launched successfully', success: true };
      }
      
      // Update campaign status
      setCampaign(prev => prev ? { ...prev, status: 'sending' } : null);
      
      // Show success message
      alert('Campaign launched successfully!');
      
    } catch (error) {
      console.error('Failed to launch campaign:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check if n8n server is running.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to n8n server. Please check your n8n installation at n8n.brokemediaio.com';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Error launching campaign: ${errorMessage}`);
    } finally {
      setLaunching(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push(`/project/${projectId}/dashboard`);
  };

  const fetchCampaignStats = useCallback(async () => {
    if (!projectId) return;
    
    setLoadingStats(true);
    setApiError(null);
    
    try {
      console.log('=== FETCHING CAMPAIGN STATS ===');
      console.log('Project ID:', projectId);
      
      // Get tokens from localStorage (same pattern as leads and templates)
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      // Call our API route that handles webhook trigger and stats fetching
      const response = await fetch('/api/campaign-stats', {
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

      const data = await response.json();
      
      if (data.success) {
        if (data.data.length > 0) {
          // Use the first campaign stats found for this project
          const campaignStat = data.data[0];
          setCampaignStats(campaignStat);
          console.log('Successfully fetched campaign stats:', campaignStat);
          setApiError(null);
        } else {
          // No stats found for this project
          setCampaignStats(null);
          setApiError('No campaign statistics found for this project. Make sure your n8n workflow has created the Campaign_Stats sheet and populated it with data.');
          console.log('No campaign stats found for project:', projectId);
        }
      } else if (data.error === 'Not authenticated with Google Sheets' || data.error === 'Token expired, please re-authenticate') {
        // Redirect to authentication page
        window.location.href = `/auth/google?project_id=${projectId}`;
        return;
      } else {
        console.error('Failed to fetch campaign stats:', data.error);
        setApiError(data.error);
        setCampaignStats(null);
      }
      
    } catch (error) {
      console.error('Failed to fetch campaign stats:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to fetch campaign statistics');
      setCampaignStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [projectId]);

  // Fetch campaign stats when component mounts
  useEffect(() => {
    if (projectId) {
      fetchCampaignStats();
    }
  }, [projectId, fetchCampaignStats]);

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'sending':
        return <Clock className="w-5 h-5 text-warning-600" />;
      case 'draft':
        return <AlertCircle className="w-5 h-5 text-neutral-400" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'sending':
        return 'bg-warning-100 text-warning-800';
      case 'draft':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  if (projectLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Page Header */}
      <div className="w-full py-12">
        <div className="flex items-center justify-center">
          <StepNavigation className="hidden md:flex" />
        </div>
      </div>

      {/* Main Content */}
      <main className="container-custom py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Campaign Status */}
          <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                {getStatusIcon(campaign?.status)}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Campaign Status
                  </h3>
                  <p className="text-sm text-neutral-300">
                    {campaign?.status === 'draft' && 'Ready to launch your campaign'}
                    {campaign?.status === 'sending' && 'Campaign is currently sending emails'}
                    {campaign?.status === 'completed' && 'Campaign has been completed'}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign?.status)}`}>
                {campaign?.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : 'Unknown'}
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-neutral-700 rounded-xl border border-neutral-600">
                <div className="text-2xl font-bold text-white">{leads?.length || 0}</div>
                <div className="text-sm text-neutral-300">Total Leads</div>
              </div>
              <div className="text-center p-4 bg-primary-900/20 rounded-xl border border-primary-500/30">
                <div className="text-2xl font-bold text-primary-400">{campaignStats?.total_sent || campaign?.sentEmails || 0}</div>
                <div className="text-sm text-primary-300">Emails Sent</div>
              </div>
              <div className="text-center p-4 bg-success-900/20 rounded-xl border border-success-500/30">
                <div className="text-2xl font-bold text-success-400">{campaignStats?.opened_unique || campaign?.repliedEmails || 0}</div>
                <div className="text-sm text-success-300">Opened</div>
              </div>
              <div className="text-center p-4 bg-accent-900/20 rounded-xl border border-accent-500/30">
                <div className="text-2xl font-bold text-accent-400">{campaignStats?.clicked_unique || campaign?.meetingsScheduled || 0}</div>
                <div className="text-sm text-accent-300">Clicked</div>
              </div>
            </div>
          </div>

          {/* Launch Section */}
          <div className="bg-neutral-800 rounded-xl p-12 text-center border border-neutral-700">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Send className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Ready to Launch Your Campaign?
            </h3>
            <p className="text-neutral-300 mb-6 max-w-md mx-auto">
              Send personalized emails to {leads.length} qualified leads in the {project?.niche} industry
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                loading={launching}
                onClick={handleLaunchCampaign}
                icon={<Send className="w-5 h-5" />}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {launching ? 'Launching Campaign...' : 'Launch Campaign'}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                loading={loadingStats}
                onClick={fetchCampaignStats}
                icon={<RefreshCw className="w-5 h-5" />}
              >
                {loadingStats ? 'Loading Stats...' : 'Check Email Stats'}
              </Button>
            </div>
          </div>

          {/* Campaign Statistics */}
          {campaignStats && (
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Email Campaign Analytics
                  </h3>
                  <p className="text-sm text-neutral-300 mt-1">
                    Last updated: {campaignStats.stats_fetched_at ? new Date(campaignStats.stats_fetched_at).toLocaleString() : 'Never'}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchCampaignStats}
                  loading={loadingStats}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Refresh Stats
                </Button>
              </div>

              {apiError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Error Loading Statistics</div>
                      <div className="text-sm text-red-700 mt-1">
                        {apiError}
                      </div>
                      <div className="text-sm text-red-600 mt-2">
                        <strong>Note:</strong> Statistics are fetched from Google Sheets Campaign_Stats tab via n8n webhook.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!apiError && campaignStats && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <div className="font-medium">✅ Live Campaign Statistics</div>
                      <div className="text-sm text-green-700 mt-1">
                        Found {campaignStats.mailgun_events_found} Mailgun events • Campaign ID: {campaignStats.campaign_id}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{campaignStats.total_sent}</div>
                  <div className="text-sm font-medium text-blue-700">Total Sent</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-2">{campaignStats.delivered}</div>
                  <div className="text-sm font-medium text-green-700">Delivered</div>
                  <div className="text-xs text-green-600 mt-1">{campaignStats.delivery_rate.toFixed(1)}%</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{campaignStats.opened_unique}</div>
                  <div className="text-sm font-medium text-purple-700">Opened</div>
                  <div className="text-xs text-purple-600 mt-1">{campaignStats.open_rate.toFixed(1)}%</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-2">{campaignStats.clicked_unique}</div>
                  <div className="text-sm font-medium text-orange-700">Clicked</div>
                  <div className="text-xs text-orange-600 mt-1">{campaignStats.click_rate.toFixed(1)}%</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-white flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                    Delivery Performance
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Delivery Rate:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-neutral-600 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(campaignStats.delivery_rate, 100)}%` }}
                          />
                        </div>
                        <span className="font-medium text-green-600">{campaignStats.delivery_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Bounce Rate:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-neutral-600 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(campaignStats.bounce_rate, 100)}%` }}
                          />
                        </div>
                        <span className="font-medium text-red-400">{campaignStats.bounce_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Failure Rate:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-neutral-600 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(campaignStats.failure_rate, 100)}%` }}
                          />
                        </div>
                        <span className="font-medium text-orange-400">{campaignStats.failure_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-white flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-purple-600" />
                    Engagement Metrics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Open Rate:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-neutral-600 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(campaignStats.open_rate, 100)}%` }}
                          />
                        </div>
                        <span className="font-medium text-purple-400">{campaignStats.open_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Click Rate:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-neutral-600 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(campaignStats.click_rate, 100)}%` }}
                          />
                        </div>
                        <span className="font-medium text-orange-400">{campaignStats.click_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Click-to-Open:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-neutral-600 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(campaignStats.click_to_open_rate, 100)}%` }}
                          />
                        </div>
                        <span className="font-medium text-blue-400">{campaignStats.click_to_open_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-white flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                    Additional Stats
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Total Opens:</span>
                      <span className="font-medium text-blue-400">{campaignStats.opened_total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Total Clicks:</span>
                      <span className="font-medium text-orange-400">{campaignStats.clicked_total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Complaints:</span>
                      <span className="font-medium text-yellow-400">{campaignStats.complained}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Unsubscribed:</span>
                      <span className="font-medium text-red-400">{campaignStats.unsubscribed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Range Info */}
              {campaignStats.time_range_begin && campaignStats.time_range_end && (
                <div className="mt-6 p-4 bg-neutral-700 rounded-lg border border-neutral-600">
                  <div className="text-sm text-neutral-300">
                    <strong>Data Range:</strong> {new Date(campaignStats.time_range_begin).toLocaleDateString()} - {new Date(campaignStats.time_range_end).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Stats Found */}
          {!campaignStats && !loadingStats && (
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Campaign Statistics Found
                </h3>
                <p className="text-neutral-300 mb-4">
                  No campaign statistics were found for this project in the Google Sheets Campaign_Stats tab.
                </p>
                <div className="text-sm text-neutral-400 space-y-2">
                  <p>This could mean:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your n8n workflow hasn&apos;t updated the Campaign_Stats sheet yet</li>
                    <li>The campaign hasn&apos;t been launched</li>
                    <li>The project ID doesn&apos;t match any entries in the sheet</li>
                  </ul>
                </div>
                <Button
                  onClick={fetchCampaignStats}
                  loading={loadingStats}
                  className="mt-4"
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Refresh Statistics
                </Button>
              </div>
            </div>
          )}

          {/* Campaign Progress */}
          {(campaign?.status === 'sending' || campaign?.status === 'completed') && (
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-lg font-semibold text-white mb-6">
                Campaign Progress
              </h3>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-neutral-300 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((campaign?.sentEmails || 0) / leads.length) * 100)}%</span>
                </div>
                <div className="w-full bg-neutral-600 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((campaign?.sentEmails || 0) / leads.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Email Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Emails Sent:</span>
                      <span className="font-medium text-white">{campaign?.sentEmails || 0} / {leads.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Open Rate:</span>
                      <span className="font-medium text-white">
                        {(campaign?.sentEmails || 0) > 0 ? Math.round(((campaign?.openedEmails || 0) / (campaign?.sentEmails || 1)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Click Rate:</span>
                      <span className="font-medium text-white">
                        {(campaign?.sentEmails || 0) > 0 ? Math.round(((campaign?.clickedEmails || 0) / (campaign?.sentEmails || 1)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Reply Rate:</span>
                      <span className="font-medium text-white">
                        {(campaign?.sentEmails || 0) > 0 ? Math.round(((campaign?.repliedEmails || 0) / (campaign?.sentEmails || 1)) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-white">Results</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Meetings Scheduled:</span>
                      <span className="font-medium text-success-400">{campaign?.meetingsScheduled || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Bounced Emails:</span>
                      <span className="font-medium text-red-400">{campaign?.bouncedEmails || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Campaign Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign?.status)}`}>
                        {campaign?.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={() => router.push(`/project/${projectId}/template`)}
            >
              Back to Template
            </Button>
            
            <Button
              onClick={handleGoToDashboard}
              icon={<BarChart3 className="w-4 h-4" />}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </main>

    </div>
  );
}

