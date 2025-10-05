'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, BarChart3, Users, Mail, TrendingUp, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Stepper } from '@/components/ui';
import { useProject } from '@/lib/hooks/use-project';
import { useLeads } from '@/lib/hooks/use-leads';
import { PROJECT_STEPS } from '@/lib/constants';
import { apiClient } from '@/lib/api';
import { Campaign } from '@/types/campaign';
import { mailgunService, MailgunStats } from '@/lib/mailgun';
import { googleOAuthDirectService } from '@/lib/google-oauth-direct';
import { GoogleSheetsCampaignStats } from '@/types/mailgun';

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, loading: projectLoading } = useProject(projectId);
  const { leads, loading: leadsLoading } = useLeads(projectId);
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [launching, setLaunching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaignStats, setCampaignStats] = useState<GoogleSheetsCampaignStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await apiClient.getCampaign(projectId);
        if (response.data) {
          setCampaign(response.data);
        }
      } catch (error) {
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
      const n8nBaseUrl = 'http://192.168.18.180:5678';
      const webhookPayload = {
        project_id: projectId,
        leads: leads,
        project: project,
        timestamp: new Date().toISOString()
      };

      console.log('Launching campaign with payload:', webhookPayload);
      console.log('Attempting to call webhook:', `${n8nBaseUrl}/webhook-test/launch-campaign`);

      const response = await fetch(`${n8nBaseUrl}/webhook-test/launch-campaign`, {
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
        } catch (jsonError) {
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
          errorMessage = 'Cannot connect to n8n server. Please ensure n8n is running on localhost:5678';
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

  const fetchCampaignStats = async () => {
    if (!projectId) return;
    
    setLoadingStats(true);
    setApiError(null);
    
    try {
      console.log('Fetching campaign stats from Google Sheets...');
      
      // Get campaign stats for this project from Google Sheets
      const stats = await googleOAuthDirectService.getCampaignStatsByProject(projectId);
      
      if (stats.length > 0) {
        // Use the first campaign stats found for this project
        // In the future, you might want to aggregate multiple campaigns
        const campaignStat = stats[0];
        setCampaignStats(campaignStat);
        console.log('Successfully fetched campaign stats from Google Sheets:', campaignStat);
        setApiError(null);
      } else {
        // No stats found for this project
        setCampaignStats(null);
        setApiError('No campaign statistics found for this project');
        console.log('No campaign stats found for project:', projectId);
      }
      
    } catch (error) {
      console.error('Failed to fetch campaign stats from Google Sheets:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to fetch campaign statistics');
      setCampaignStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch campaign stats when component mounts
  useEffect(() => {
    if (projectId) {
      fetchCampaignStats();
    }
  }, [projectId]);

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
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Launch Campaign</h1>
              <p className="text-neutral-300 mt-1">Send personalized emails to your prospects</p>
            </div>
            <Stepper steps={PROJECT_STEPS} currentStep={2} className="hidden md:flex" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Campaign Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                {getStatusIcon(campaign?.status)}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Campaign Status
                  </h3>
                  <p className="text-sm text-neutral-600">
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
              <div className="text-center p-4 bg-neutral-50 rounded-xl">
                <div className="text-2xl font-bold text-neutral-900">{leads.length}</div>
                <div className="text-sm text-neutral-600">Total Leads</div>
              </div>
              <div className="text-center p-4 bg-primary-50 rounded-xl">
                <div className="text-2xl font-bold text-primary-600">{campaign?.sentEmails || 0}</div>
                <div className="text-sm text-primary-700">Emails Sent</div>
              </div>
              <div className="text-center p-4 bg-success-50 rounded-xl">
                <div className="text-2xl font-bold text-success-600">{campaign?.repliedEmails || 0}</div>
                <div className="text-sm text-success-700">Replies</div>
              </div>
              <div className="text-center p-4 bg-accent-50 rounded-xl">
                <div className="text-2xl font-bold text-accent-600">{campaign?.meetingsScheduled || 0}</div>
                <div className="text-sm text-accent-700">Meetings</div>
              </div>
            </div>
          </div>

          {/* Launch Section */}
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Send className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">
              Ready to Launch Your Campaign?
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
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
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Email Delivery Statistics
                </h3>
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
                        <strong>Note:</strong> Statistics are now fetched from Google Sheets Campaign_Stats tab.
                        Make sure your n8n workflow is updating the sheet with campaign data.
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
                      <div className="font-medium">✅ Campaign Statistics Loaded from Google Sheets</div>
                      <div className="text-sm text-green-700 mt-1">
                        Statistics are being fetched from the Campaign_Stats sheet.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Campaign Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{campaignStats.accepted}</div>
                  <div className="text-sm text-green-700">Accepted</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{campaignStats.delivered}</div>
                  <div className="text-sm text-blue-700">Delivered</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{campaignStats.failed}</div>
                  <div className="text-sm text-orange-700">Failed</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <div className="text-2xl font-bold text-teal-600">{campaignStats.opened_unique}</div>
                  <div className="text-sm text-teal-700">Opened</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-neutral-900">Delivery Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Delivery Rate:</span>
                      <span className="font-medium">
                        {campaignStats.accepted > 0 ? Math.round((campaignStats.delivered / campaignStats.accepted) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Open Rate:</span>
                      <span className="font-medium">
                        {campaignStats.delivered > 0 ? Math.round((campaignStats.opened_unique / campaignStats.delivered) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Click Rate:</span>
                      <span className="font-medium">
                        {campaignStats.delivered > 0 ? Math.round((campaignStats.clicked_unique / campaignStats.delivered) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Bounce Rate:</span>
                      <span className="font-medium text-error-600">
                        {campaignStats.accepted > 0 ? Math.round((campaignStats.bounced / campaignStats.accepted) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-neutral-900">Additional Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Total Sent:</span>
                      <span className="font-medium text-neutral-600">{campaignStats.total_sent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Clicked (Total):</span>
                      <span className="font-medium text-accent-600">{campaignStats.clicked_total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Clicked (Unique):</span>
                      <span className="font-medium text-accent-600">{campaignStats.clicked_unique}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Complained:</span>
                      <span className="font-medium text-warning-600">{campaignStats.complained}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Stats Found */}
          {!campaignStats && !loadingStats && (
            <div className="card p-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  No Campaign Statistics Found
                </h3>
                <p className="text-neutral-600 mb-4">
                  No campaign statistics were found for this project in the Google Sheets Campaign_Stats tab.
                </p>
                <div className="text-sm text-neutral-500 space-y-2">
                  <p>This could mean:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your n8n workflow hasn't updated the Campaign_Stats sheet yet</li>
                    <li>The campaign hasn't been launched</li>
                    <li>The project ID doesn't match any entries in the sheet</li>
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
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">
                Campaign Progress
              </h3>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-neutral-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((campaign?.sentEmails || 0) / leads.length) * 100)}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((campaign?.sentEmails || 0) / leads.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-neutral-900">Email Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Emails Sent:</span>
                      <span className="font-medium">{campaign?.sentEmails || 0} / {leads.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Open Rate:</span>
                      <span className="font-medium">
                        {(campaign?.sentEmails || 0) > 0 ? Math.round(((campaign?.openedEmails || 0) / (campaign?.sentEmails || 1)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Click Rate:</span>
                      <span className="font-medium">
                        {(campaign?.sentEmails || 0) > 0 ? Math.round(((campaign?.clickedEmails || 0) / (campaign?.sentEmails || 1)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Reply Rate:</span>
                      <span className="font-medium">
                        {(campaign?.sentEmails || 0) > 0 ? Math.round(((campaign?.repliedEmails || 0) / (campaign?.sentEmails || 1)) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-neutral-900">Results</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Meetings Scheduled:</span>
                      <span className="font-medium text-success-600">{campaign?.meetingsScheduled || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Bounced Emails:</span>
                      <span className="font-medium text-error-600">{campaign?.bouncedEmails || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Campaign Status:</span>
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
