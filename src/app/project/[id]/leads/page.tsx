'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Plus, Search, Edit3, Trash2, RefreshCw, Target, Mail, Building2, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Stepper, Table, Modal } from '@/components/ui';
import { PROJECT_STEPS, LEAD_STATUSES, EMAIL_STATUSES } from '@/lib/constants';
import { LeadForm } from '@/components/forms/lead-form';
import { CreateLeadData, Lead } from '@/types/lead';
import { useAuth } from '@/contexts/AuthContext';

export default function LeadsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { isAuthenticated, isLoading: authLoading, refreshAuth } = useAuth();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationStats, setValidationStats] = useState({
    total: 0,
    deliverable: 0,
    undeliverable: 0,
    risky: 0,
    unknown: 0
  });

  // Fetch leads from API
  const fetchLeads = async () => {
    try {
      setLoading(true);
      
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
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset auth check when project changes
  useEffect(() => {
    setAuthChecked(false);
    setLoading(true);
  }, [projectId]);

  useEffect(() => {
    // Only run this effect once when the component mounts or when authChecked is false
    if (!authChecked) {
      setAuthChecked(true);
      
      if (isAuthenticated) {
        // User is authenticated, fetch leads
        fetchLeads();
      } else if (!authLoading) {
        // User is not authenticated and auth is not loading
        // Check if we have tokens in localStorage but AuthContext hasn't picked them up
        const accessToken = localStorage.getItem('google_access_token');
        const refreshToken = localStorage.getItem('google_refresh_token');
        const tokenExpiry = localStorage.getItem('google_token_expiry');

        if (accessToken && refreshToken && tokenExpiry) {
          // We have tokens, refresh auth status
          refreshAuth();
        } else {
          // No tokens, stop loading and show authentication option
          setLoading(false);
        }
      }
    }
  }, [projectId, isAuthenticated, authLoading, refreshAuth, authChecked]);

  // Separate effect to handle authentication state changes
  useEffect(() => {
    if (authChecked && isAuthenticated && loading) {
      // User just got authenticated, fetch leads
      fetchLeads();
    } else if (authChecked && !isAuthenticated && !authLoading && loading) {
      // User is not authenticated and auth is not loading, stop loading
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, authChecked, loading]);

  const handleStartScraping = async () => {
    setScraping(true);
    try {
      console.log('Starting lead scraping for project:', projectId);
      
      // Call n8n webhook for lead scraping
      const n8nBaseUrl = 'http://192.168.18.180:5678';
      const response = await fetch(`${n8nBaseUrl}/webhook-test/start-scraping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook call failed: ${response.status} ${response.statusText}`);
      }

      // Check if response has content before parsing JSON
      const responseText = await response.text();
      console.log('Raw webhook response:', responseText);
      
      let result;
      if (responseText.trim()) {
        try {
          result = JSON.parse(responseText);
          console.log('Parsed webhook response:', result);
        } catch (parseError) {
          console.warn('Response is not valid JSON, treating as text:', responseText);
          result = { message: responseText };
        }
      } else {
        console.log('Empty response from webhook');
        result = { message: 'Scraping started successfully' };
      }
      
      // Refresh leads after scraping
      await fetchLeads();
    } catch (error) {
      console.error('Failed to start scraping:', error);
      // You might want to show a toast notification here
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error starting lead scraping: ${errorMessage}`);
    } finally {
      setScraping(false);
    }
  };

  const handleValidateEmails = async () => {
    // Check if there are leads to validate
    if (leads.length === 0) {
      alert('No leads found to validate. Please add some leads first or start lead scraping.');
      return;
    }

    // Prevent multiple validation calls
    if (validating) {
      console.log('Validation already in progress, skipping...');
      return;
    }

    setValidating(true);
    try {
      console.log('Starting email validation for project:', projectId);
      
      // Get tokens from localStorage
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      const response = await fetch('/api/validate-project-emails', {
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

      console.log('Validation response status:', response.status);
      console.log('Validation response headers:', response.headers);
      
      let data;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        if (!responseText.trim()) {
          throw new Error('Server returned empty response');
        }
        
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse response JSON:', jsonError);
        throw new Error(`Server returned invalid response: ${response.status} ${response.statusText} - ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`);
      }
      
      if (data.success) {
        console.log('Email validation completed:', data.data);
        
        // Update validation stats
        setValidationStats(data.data.statistics);
        
        // Refresh leads to get updated validation data
        await fetchLeads();
        
        if (data.data.already_validated) {
          alert(`All leads have already been validated!\n\nCurrent Results:\n• Deliverable: ${data.data.statistics.deliverable}\n• Undeliverable: ${data.data.statistics.undeliverable}\n• Risky: ${data.data.statistics.risky}\n• Unknown: ${data.data.statistics.unknown}`);
        } else {
          alert(`Email validation completed!\n\nResults:\n• Deliverable: ${data.data.statistics.deliverable}\n• Undeliverable: ${data.data.statistics.undeliverable}\n• Risky: ${data.data.statistics.risky}\n• Unknown: ${data.data.statistics.unknown}`);
        }
      } else if (data.error === 'Not authenticated with Google Sheets' || data.error === 'Token expired, please re-authenticate') {
        // Redirect to authentication page
        window.location.href = `/auth/google?project_id=${projectId}`;
        return;
      } else {
        console.error('Failed to validate emails:', data.error);
        const details = data.details ? (Array.isArray(data.details) ? data.details.join('\n') : data.details) : 'Unknown error';
        alert(`Error validating emails: ${data.error}\n\nDetails: ${details}`);
      }
    } catch (error) {
      console.error('Error validating emails:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error validating emails: ${errorMessage}`);
    } finally {
      setValidating(false);
    }
  };

  const handleNext = () => {
    router.push(`/project/${projectId}/template`);
  };

  const handleAddLead = async (leadData: CreateLeadData) => {
    try {
      // Get tokens from localStorage
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-google-access-token': accessToken || '',
          'x-google-refresh-token': refreshToken || '',
          'x-google-token-expiry': tokenExpiry || '0',
        },
        body: JSON.stringify({
          project_id: projectId,
          ...leadData
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setLeads(prev => [...prev, data.data]);
        setIsAddModalOpen(false);
      } else if (data.error === 'Not authenticated with Google Sheets' || data.error === 'Token expired, please re-authenticate') {
        // Redirect to authentication page
        window.location.href = `/auth/google?project_id=${projectId}`;
        return;
      } else {
        console.error('Failed to create lead:', data.error);
        alert(`Error creating lead: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Error creating lead. Please try again.');
    }
  };

  const handleEditLead = async (leadData: CreateLeadData) => {
    if (!editingLead) return;

    try {
      console.log('=== FRONTEND: UPDATING LEAD ===');
      console.log('Lead ID:', editingLead.lead_id);
      console.log('Lead Data:', leadData);
      
      // Get tokens from localStorage
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      const response = await fetch('/api/leads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-google-access-token': accessToken || '',
          'x-google-refresh-token': refreshToken || '',
          'x-google-token-expiry': tokenExpiry || '0',
        },
        body: JSON.stringify({
          lead_id: editingLead.lead_id,
          ...leadData
        }),
      });

      const data = await response.json();
      console.log('Update response:', data);
      
      if (data.success) {
        // Update the local state with the updated lead data
        setLeads(prev => prev.map(lead => 
          lead.lead_id === editingLead.lead_id 
            ? { ...lead, ...leadData, lead_id: editingLead.lead_id, project_id: lead.project_id }
            : lead
        ));
        setEditingLead(null);
        
        // Add a small delay and then refresh to ensure consistency
        setTimeout(() => {
          fetchLeads();
        }, 1000);
        
        console.log('Lead updated successfully');
      } else if (data.error === 'Not authenticated with Google Sheets' || data.error === 'Token expired, please re-authenticate') {
        // Redirect to authentication page
        window.location.href = `/auth/google?project_id=${projectId}`;
        return;
      } else {
        console.error('Failed to update lead:', data.error);
        alert(`Error updating lead: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error updating lead. Please try again.');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        // Get tokens from localStorage
        const accessToken = localStorage.getItem('google_access_token');
        const refreshToken = localStorage.getItem('google_refresh_token');
        const tokenExpiry = localStorage.getItem('google_token_expiry');

        const response = await fetch(`/api/leads?lead_id=${leadId}`, {
          method: 'DELETE',
          headers: {
            'x-google-access-token': accessToken || '',
            'x-google-refresh-token': refreshToken || '',
            'x-google-token-expiry': tokenExpiry || '0',
          },
        });

        const data = await response.json();
        
        if (data.success) {
          setLeads(prev => prev.filter(lead => lead.lead_id !== leadId));
        } else if (data.error === 'Not authenticated with Google Sheets' || data.error === 'Token expired, please re-authenticate') {
          // Redirect to authentication page
          window.location.href = `/auth/google?project_id=${projectId}`;
          return;
        } else {
          console.error('Failed to delete lead:', data.error);
          alert(`Error deleting lead: ${data.error}`);
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  };

  // Filter leads based on search term
  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'name' as keyof Lead,
      header: 'Name',
      render: (value: string | undefined, lead: Lead) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <div className="font-medium text-neutral-900">{value || 'N/A'}</div>
            <div className="text-sm text-neutral-500">{lead.position}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email' as keyof Lead,
      header: 'Email',
      render: (value: string | undefined) => (
        <div className="flex items-center space-x-2">
          <Mail className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-700">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'company' as keyof Lead,
      header: 'Company',
      render: (value: string | undefined) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-700">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'source' as keyof Lead,
      header: 'Source',
      render: (value: string | undefined) => (
        <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs">
          {value || 'Unknown'}
        </span>
      )
    },
    {
      key: 'status' as keyof Lead,
      header: 'Status',
      render: (value: string | undefined) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active' 
            ? 'bg-success-100 text-success-700' 
            : 'bg-neutral-100 text-neutral-700'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'validation_status' as keyof Lead,
      header: 'Email Status',
      render: (value: string | undefined, lead: Lead) => {
        if (!value || value === '') {
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
              Not Validated
            </span>
          );
        }
        
        return (
          <div className="flex items-center space-x-2">
            {value === 'deliverable' ? (
              <CheckCircle className="w-4 h-4 text-success-500" />
            ) : value === 'undeliverable' ? (
              <AlertCircle className="w-4 h-4 text-error-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-warning-500" />
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === 'deliverable' ? 'bg-success-100 text-success-700' :
              value === 'undeliverable' ? 'bg-error-100 text-error-700' :
              value === 'risky' ? 'bg-warning-100 text-warning-700' :
              'bg-neutral-100 text-neutral-700'
            }`}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions' as keyof Lead,
      header: 'Actions',
      render: (value: string | undefined, lead: Lead) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setEditingLead(lead)}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
            title="Edit lead"
          >
            <Edit3 className="w-4 h-4 text-neutral-500" />
          </button>
          <button
            onClick={() => handleDeleteLead(lead.lead_id)}
            className="p-1 hover:bg-error-100 rounded transition-colors"
            title="Delete lead"
          >
            <Trash2 className="w-4 h-4 text-error-500" />
          </button>
        </div>
      )
    }
  ];

  // Show authentication option if not authenticated and auth check is complete
  if (!isAuthenticated && !authLoading && authChecked && !loading) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <div className="container-custom py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-warning-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
              <p className="text-neutral-300 mb-6">
                You need to authenticate with Google Sheets to access your leads data.
              </p>
              <Button
                onClick={() => window.location.href = `/auth/google?project_id=${projectId}`}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Authenticate with Google Sheets
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication or fetching data
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <div className="container-custom py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
              <p className="text-neutral-300">
                {authLoading ? 'Checking authentication...' : 'Loading leads...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Lead Discovery</h1>
              <p className="text-neutral-300">Discover and manage your leads for this project</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={fetchLeads}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Lead
              </Button>
            </div>
          </div>

          {/* Stepper */}
          <Stepper
            steps={PROJECT_STEPS}
            currentStep={1}
            className="mb-8"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Lead Scraping Card */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Start Lead Scraping
                  </h3>
                  <p className="text-neutral-600">
                    Automatically discover leads based on your project criteria
                  </p>
                </div>
                <Button
                  onClick={handleStartScraping}
                  loading={scraping}
                  icon={<Target className="w-4 h-4" />}
                  size="lg"
                >
                  {scraping ? 'Scraping Leads...' : 'Start Lead Scraping'}
                </Button>
              </div>
            </div>

            {/* Email Validation Card */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Validate Email Addresses
                  </h3>
                  <p className="text-neutral-600">
                    Verify email deliverability using Emailable API
                  </p>
                </div>
                <Button
                  onClick={handleValidateEmails}
                  loading={validating}
                  icon={<CheckCircle className="w-4 h-4" />}
                  size="lg"
                  variant="secondary"
                >
                  {validating ? 'Validating...' : 'Validate Emails'}
                </Button>
              </div>
            </div>
          </div>

          {/* Validation Stats */}
          {validationStats.total > 0 && (
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Email Validation Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">{validationStats.total}</div>
                  <div className="text-sm text-neutral-600">Total Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">{validationStats.deliverable}</div>
                  <div className="text-sm text-neutral-600">Deliverable</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-error-600">{validationStats.undeliverable}</div>
                  <div className="text-sm text-neutral-600">Undeliverable</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-600">{validationStats.risky}</div>
                  <div className="text-sm text-neutral-600">Risky</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-600">{validationStats.unknown}</div>
                  <div className="text-sm text-neutral-600">Unknown</div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <span className="text-sm text-neutral-500">
                {filteredLeads.length} of {leads.length} leads
              </span>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-neutral-800 rounded-xl border border-neutral-700">
            <div className="p-6 border-b border-neutral-700">
              <h3 className="text-lg font-semibold text-white">Discovered Leads</h3>
              <p className="text-sm text-neutral-300 mt-1">
                Manage and edit your lead information
              </p>
            </div>
            
            {filteredLeads.length > 0 ? (
              <div className="overflow-x-auto overflow-y-auto max-h-96">
                <Table
                  columns={columns}
                  data={filteredLeads}
                  className="w-full min-w-max"
                />
              </div>
            ) : (
              <div className="p-12 text-center">
                <Target className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No leads found</h3>
                <p className="text-neutral-600 mb-6">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start by scraping leads or adding them manually'}
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={handleStartScraping}
                    loading={scraping}
                    icon={<Target className="w-4 h-4" />}
                  >
                    Start Scraping
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsAddModalOpen(true)}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add Manually
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Next Button */}
          {leads.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                size="lg"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Next: Email Templates
              </Button>
            </div>
          )}
        </div>

        {/* Add Lead Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Lead"
          size="lg"
        >
          <LeadForm
            onSave={handleAddLead}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </Modal>

        {/* Edit Lead Modal */}
        <Modal
          isOpen={!!editingLead}
          onClose={() => setEditingLead(null)}
          title="Edit Lead"
          size="lg"
        >
          {editingLead && (
            <LeadForm
              initialData={editingLead}
              onSave={handleEditLead}
              onCancel={() => setEditingLead(null)}
            />
          )}
        </Modal>
      </div>
    </div>
  );
}