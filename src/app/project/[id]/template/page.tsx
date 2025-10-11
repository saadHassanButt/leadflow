'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Mail, Edit3, Sparkles } from 'lucide-react';
import { Button, Stepper, Input } from '@/components/ui';
import { useProject } from '@/lib/hooks/use-project';
import { PROJECT_STEPS } from '@/lib/constants';
import { apiClient } from '@/lib/api';

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, loading: projectLoading } = useProject(projectId);
  
  const [template, setTemplate] = useState({
    template_id: '',
    subject: '',
    content: ''
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      // Get tokens from localStorage
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      if (!accessToken || !refreshToken || !tokenExpiry) {
        setLoading(false);
        return;
      }

      // Fetch templates from Google Sheets
      const response = await fetch(`/api/templates?project_id=${projectId}`, {
        headers: {
          'x-google-access-token': accessToken,
          'x-google-refresh-token': refreshToken,
          'x-google-token-expiry': tokenExpiry,
        }
      });

      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Get the most recent template
        const latestTemplate = data.data.sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )[0];
        
        setTemplate({
          template_id: latestTemplate.template_id,
          subject: latestTemplate.subject,
          content: latestTemplate.body
        });
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTemplate();
    }
  }, [projectId]);

  const handleGenerateTemplate = async () => {
    setGenerating(true);
    try {
      // Get tokens from localStorage
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      // Call our API route that handles n8n webhook and template fetching
      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-google-access-token': accessToken || '',
          'x-google-refresh-token': refreshToken || '',
          'x-google-token-expiry': tokenExpiry || '0',
        },
        body: JSON.stringify({
          project_id: projectId,
          lead_data: {
            niche: project?.niche,
            companyName: project?.companyName,
            campaignType: project?.campaignType,
            targetAudience: (project as any)?.targetAudience || 'General audience',
            valueProposition: (project as any)?.valueProposition || 'Unique value proposition'
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTemplate({
          template_id: data.data.template_id,
          subject: data.data.subject,
          content: data.data.body
        });
      } else if (data.error === 'Not authenticated with Google Sheets' || data.error === 'Token expired, please re-authenticate') {
        // Redirect to authentication page
        window.location.href = `/auth/google?project_id=${projectId}`;
        return;
      } else {
        console.error('Failed to generate template:', data.error);
        alert(`Error generating template: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to generate template:', error);
      alert('Error generating template. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!template.template_id) {
      alert('No template to save. Please generate a template first.');
      return;
    }

    if (!template.subject.trim() || !template.content.trim()) {
      alert('Subject and content cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      console.log('=== FRONTEND: SAVING TEMPLATE ===');
      console.log('Template ID:', template.template_id);
      console.log('Subject:', template.subject);
      console.log('Content length:', template.content.length);
      
      // Get tokens from localStorage
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      const response = await fetch('/api/templates/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-google-access-token': accessToken || '',
          'x-google-refresh-token': refreshToken || '',
          'x-google-token-expiry': tokenExpiry || '0',
        },
        body: JSON.stringify({
          template_id: template.template_id,
          subject: template.subject,
          body: template.content
        }),
      });

      const data = await response.json();
      console.log('Save response:', data);
      
      if (data.success) {
        setIsEditing(false);
        alert('Template saved successfully!');
        
        // Refresh template data to ensure consistency
        setTimeout(() => {
          fetchTemplate();
        }, 1000);
        
        console.log('Template saved successfully');
      } else if (data.error === 'Not authenticated with Google Sheets' || data.error === 'Token expired, please re-authenticate') {
        // Redirect to authentication page
        window.location.href = `/auth/google?project_id=${projectId}`;
        return;
      } else {
        console.error('Failed to save template:', data.error);
        alert(`Error saving template: ${data.error}\n\nDetails: ${data.details || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Error saving template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    router.push(`/project/${projectId}/campaign`);
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
              <h1 className="text-2xl font-bold text-white">Email Template</h1>
              <p className="text-neutral-300 mt-1">Create personalized email templates for your campaign</p>
            </div>
            <Stepper steps={PROJECT_STEPS} currentStep={1} className="hidden md:flex" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Generate Template Section */}
          {!template.content && (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                Generate AI-Powered Email Template
              </h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                Let our AI create a personalized email template optimized for your {project?.niche} industry campaign
              </p>
              <Button
                size="lg"
                loading={generating}
                onClick={handleGenerateTemplate}
                icon={<Sparkles className="w-5 h-5" />}
              >
                {generating ? 'Generating Template...' : 'Generate Email Template'}
              </Button>
            </div>
          )}

          {/* Template Editor */}
          {template.content && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Email Template
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Review and customize your email template
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {!isEditing ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={generating}
                        onClick={handleGenerateTemplate}
                        icon={<Sparkles className="w-4 h-4" />}
                      >
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        icon={<Edit3 className="w-4 h-4" />}
                      >
                        Edit Template
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        loading={saving}
                        onClick={handleSaveTemplate}
                      >
                        Save Changes
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Subject Line */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Subject Line
                  </label>
                  {isEditing ? (
                    <Input
                      value={template.subject}
                      onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject..."
                    />
                  ) : (
                    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="font-medium text-neutral-900">{template.subject}</p>
                    </div>
                  )}
                </div>

                {/* Email Content */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Content
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={12}
                      className="input resize-none"
                      value={template.content}
                      onChange={(e) => setTemplate(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter email content..."
                    />
                  ) : (
                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <pre className="whitespace-pre-wrap font-sans text-neutral-900 leading-relaxed">
                        {template.content}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Template Variables */}
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                  <h4 className="font-medium text-primary-900 mb-3">Available Variables</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-white rounded text-primary-700 font-mono">
                        {`{{firstName}}`}
                      </code>
                      <span className="text-primary-700">First Name</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-white rounded text-primary-700 font-mono">
                        {`{{lastName}}`}
                      </code>
                      <span className="text-primary-700">Last Name</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-white rounded text-primary-700 font-mono">
                        {`{{company}}`}
                      </code>
                      <span className="text-primary-700">Company</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-white rounded text-primary-700 font-mono">
                        {`{{title}}`}
                      </code>
                      <span className="text-primary-700">Job Title</span>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <h4 className="font-medium text-neutral-900 mb-3">Preview</h4>
                  <div className="card p-4 bg-white">
                    <div className="border-b border-neutral-200 pb-3 mb-3">
                      <div className="flex items-center space-x-2 text-sm text-neutral-600">
                        <Mail className="w-4 h-4" />
                        <span>From: {project?.companyEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-neutral-600 mt-1">
                        <span>To: john.doe@example.com</span>
                      </div>
                      <div className="mt-2">
                        <p className="font-medium text-neutral-900">{template.subject}</p>
                      </div>
                    </div>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-neutral-900 leading-relaxed">
                        {template.content}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next Button */}
          {template.content && !isEditing && (
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Next: Launch Campaign
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
