'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  Mail, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Plus,
  Target,
  Send,
  Eye,
  Calendar,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui';
import { BarChart, PieChart, DonutChart, ProgressBar, LineChart } from '@/components/charts';

interface Project {
  project_id: string;
  user_id: string;
  company_name: string;
  niche: string;
  no_of_leads: number;
  leads_count: number; // This will be calculated from actual leads
  status: string;
  created_at: string;
  error: string;
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  totalLeads: number;
  totalCampaigns: number;
  niches: { [key: string]: number };
  campaignTypes: { [key: string]: number };
}

export default function MainDashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalLeads: 0,
    totalCampaigns: 0,
    niches: {},
    campaignTypes: {}
  });

  const fetchProjects = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Get tokens from localStorage
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      const response = await fetch('/api/projects', {
        headers: {
          'x-google-access-token': accessToken || '',
          'x-google-refresh-token': refreshToken || '',
          'x-google-token-expiry': tokenExpiry || '0',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data);
        calculateStats(data.data);
      } else if (data.error === 'Not authenticated with Google Sheets' || data.error === 'Token expired, please re-authenticate') {
        // Redirect to authentication page
        window.location.href = '/auth/google';
        return;
      } else {
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to connect to Google Sheets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (projectsData: Project[]) => {
    const niches: { [key: string]: number } = {};
    const campaignTypes: { [key: string]: number } = {};
    let totalLeads = 0;

    projectsData.forEach(project => {
      // Count niches
      if (project.niche) {
        niches[project.niche] = (niches[project.niche] || 0) + 1;
      }
      
      // Count statuses as campaign types
      if (project.status) {
        campaignTypes[project.status] = (campaignTypes[project.status] || 0) + 1;
      }
      
      // Sum total leads
      totalLeads += project.leads_count || 0;
    });

    setStats({
      totalProjects: projectsData.length,
      activeProjects: projectsData.length, // Assuming all projects are active
      totalLeads,
      totalCampaigns: projectsData.length, // One campaign per project
      niches,
      campaignTypes
    });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}/dashboard`);
  };

  const handleCreateProject = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-neutral-300">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Projects</h2>
          <p className="text-neutral-300 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchProjects} icon={<RefreshCw className="w-4 h-4" />}>
              Retry
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => window.location.href = '/auth/google'}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Re-authenticate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <div className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Main Dashboard</h1>
              <p className="text-neutral-300 mt-2">
                Manage all your lead generation projects from one place
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={fetchProjects}
                loading={refreshing}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
              <Button
                onClick={handleCreateProject}
                icon={<Plus className="w-4 h-4" />}
              >
                Create Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalProjects}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Total Projects</h3>
              <p className="text-sm text-neutral-300 mt-1">Active campaigns running</p>
            </div>

            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalLeads.toLocaleString()}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Total Leads</h3>
              <p className="text-sm text-neutral-300 mt-1">Across all projects</p>
            </div>

            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Send className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalCampaigns}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Active Campaigns</h3>
              <p className="text-sm text-neutral-300 mt-1">Email campaigns launched</p>
            </div>

            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-white">{Object.keys(stats.niches).length}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Industries</h3>
              <p className="text-sm text-neutral-300 mt-1">Different niches targeted</p>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Niche Distribution */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-xl font-semibold text-white mb-6">Projects by Industry</h3>
              {Object.keys(stats.niches).length > 0 ? (
                <PieChart
                  data={Object.entries(stats.niches).map(([niche, count], index) => ({
                    label: niche.charAt(0).toUpperCase() + niche.slice(1),
                    value: count,
                    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6]
                  }))}
                  size={200}
                />
              ) : (
                <div className="text-center py-8 text-neutral-400">No data available</div>
              )}
            </div>

            {/* Project Status */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-xl font-semibold text-white mb-6">Project Status</h3>
              {Object.keys(stats.campaignTypes).length > 0 ? (
                <BarChart
                  data={Object.entries(stats.campaignTypes).map(([status, count], index) => ({
                    label: status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value: count,
                    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
                  }))}
                  height={200}
                />
              ) : (
                <div className="text-center py-8 text-neutral-400">No data available</div>
              )}
            </div>
          </div>

          {/* Projects List */}
          <div className="bg-neutral-800 rounded-xl border border-neutral-700">
            <div className="p-6 border-b border-neutral-700">
              <h3 className="text-xl font-semibold text-white">All Projects</h3>
              <p className="text-sm text-neutral-300 mt-1">
                Click on any project to view its detailed dashboard
              </p>
            </div>
            
            {projects.length > 0 ? (
              <div className="divide-y divide-neutral-700">
                {projects.map((project, index) => (
                  <div
                    key={`${project.project_id}-${index}`}
                    className="p-6 hover:bg-neutral-700 transition-colors cursor-pointer"
                    onClick={() => handleProjectClick(project.project_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white">{project.company_name || 'Unnamed Company'}</h4>
                            <p className="text-sm text-neutral-300">ID: {project.project_id}</p>
                            <p className="text-xs text-neutral-400 mt-1">User: {project.user_id}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-8">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-white">{project.leads_count || 0}</div>
                          <div className="text-xs text-neutral-300">Leads</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {project.niche?.charAt(0).toUpperCase() + project.niche?.slice(1) || 'N/A'}
                          </div>
                          <div className="text-xs text-neutral-300 mt-1">Industry</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {project.status?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                          </div>
                          <div className="text-xs text-neutral-300 mt-1">Status</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-neutral-300">
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-neutral-400">Created</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Building2 className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Projects Found</h3>
                <p className="text-neutral-300 mb-6">
                  Get started by creating your first lead generation project
                </p>
                <Button
                  onClick={handleCreateProject}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Create Your First Project
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
