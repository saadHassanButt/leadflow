'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Target, Mail, BarChart3, Users, Zap, ArrowRight, CheckCircle, Star, Play, X } from 'lucide-react';
import { Button } from '@/components/ui';

export default function HomePage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyName: '',
    companyEmail: '',
    niche: '',
    targetCount: '5',
    campaignType: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.companyEmail.trim()) {
      newErrors.companyEmail = 'Company email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Please enter a valid email address';
    }
    if (!formData.niche) {
      newErrors.niche = 'Please select a niche';
    }
    if (!formData.campaignType) {
      newErrors.campaignType = 'Please select a campaign type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);

    try {
      setWebhookStatus('idle');
      
      // Prepare the webhook payload
      const webhookPayload = {
        company_name: formData.companyName,
        niche: formData.niche,
        no_of_leads: parseInt(formData.targetCount),
        user_id: "test_user", // You can make this dynamic later
        project_name: formData.name,
        project_description: formData.description,
        company_email: formData.companyEmail,
        campaign_type: formData.campaignType
      };

      console.log('Sending webhook payload:', webhookPayload);

      // Call n8n webhook
      // IP address of the laptop running n8n workflow
      const n8nBaseUrl = 'http://192.168.18.180:5678';
      const response = await fetch(`${n8nBaseUrl}/webhook/create-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        throw new Error(`Webhook call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Webhook response:', result);
      
      setWebhookStatus('success');
      
      // Generate a project ID (you might want to get this from the webhook response)
      const projectId = result.project_id || Math.random().toString(36).substr(2, 9);
      
      // Close modal and navigate to project leads page
      setTimeout(() => {
        setIsCreateModalOpen(false);
        router.push(`/project/${projectId}/leads`);
      }, 1000); // Small delay to show success state
      
    } catch (error) {
      console.error('Error creating project:', error);
      setWebhookStatus('error');
      // You might want to show a toast notification here
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error creating project: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      companyName: '',
      companyEmail: '',
      niche: '',
      targetCount: '5',
      campaignType: ''
    });
    setErrors({});
    setWebhookStatus('idle');
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <main id="get-started" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium border border-orange-200 mb-8">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Trusted by 100+ companies worldwide
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Generate Leads on
            <span className="block text-gradient">
              Autopilot
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Complete end-to-end solution for lead generation. Discover, verify, 
            and convert prospects into meetings with our AI-powered automation platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              size="lg"
              className="px-8 py-4 text-lg"
            >
              Create Your First Project
            </Button>
            <Button 
              variant="secondary"
              size="lg"
              className="px-8 py-4 text-lg border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Leads Generated', value: '10,000+', color: 'text-orange-500' },
              { label: 'Meetings Scheduled', value: '500+', color: 'text-orange-400' },
              { label: 'Response Rate', value: '25%', color: 'text-orange-300' },
              { label: 'Active Users', value: '100+', color: 'text-orange-200' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-300 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything you need to scale your outreach
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From lead discovery to meeting scheduling, our platform handles 
              every step of your sales pipeline automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Smart Lead Discovery',
                description: 'AI-powered prospect identification across multiple channels with advanced filtering and targeting capabilities.',
              },
              {
                icon: '📧',
                title: 'Automated Outreach',
                description: 'Personalized email campaigns that convert with dynamic content and intelligent send timing.',
              },
              {
                icon: '📊',
                title: 'Real-time Analytics',
                description: 'Track performance and optimize your campaigns with comprehensive reporting and insights.',
              },
              {
                icon: '👥',
                title: 'Meeting Management',
                description: 'Seamless calendar integration and scheduling with automated follow-up sequences.',
              },
              {
                icon: '⚡',
                title: 'Workflow Automation',
                description: 'End-to-end pipeline management with n8n integration for complex automation workflows.',
              },
              {
                icon: '🛡️',
                title: 'Email Validation',
                description: 'Advanced email verification to ensure high deliverability and maintain sender reputation.',
              },
            ].map((feature, index) => (
              <div key={index} className="bg-gray-700 rounded-xl p-8 shadow-lg border border-gray-600 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to 10x your lead generation?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto">
            Join hundreds of businesses already using LeadFlow to automate 
            their sales pipeline and book more meetings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              variant="secondary"
              size="lg"
              className="px-8 py-4 text-lg bg-white text-orange-600 hover:bg-orange-50"
            >
              Start Your Free Trial
            </Button>
            <Button 
              variant="ghost"
              size="lg"
              className="px-8 py-4 text-lg border-2 border-white text-white hover:bg-white/10"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-bold">LeadFlow</span>
          </div>
          <p className="text-gray-400">
            © 2024 LeadFlow. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Enhanced Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] scrollable-y shadow-2xl" data-lenis-prevent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Create New Project</h3>
                <p className="text-gray-600 mt-1">Start your lead generation campaign in minutes</p>
              </div>
              <Button
                onClick={handleModalClose}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 text-gray-500"
                disabled={isCreating}
                icon={<X className="w-6 h-6" />}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 bg-white placeholder-gray-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="My Lead Generation Campaign"
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 bg-white placeholder-gray-500 ${
                      errors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Your Company Ltd."
                  />
                  {errors.companyName && <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none text-gray-900 bg-white placeholder-gray-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your lead generation goals and target audience..."
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 bg-white placeholder-gray-500 ${
                    errors.companyEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="hello@yourcompany.com"
                />
                {errors.companyEmail && <p className="text-sm text-red-600 mt-1">{errors.companyEmail}</p>}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Niche
                  </label>
                  <select 
                    value={formData.niche}
                    onChange={(e) => handleInputChange('niche', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 bg-white ${
                      errors.niche ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Choose a niche</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="saas">SaaS</option>
                  </select>
                  {errors.niche && <p className="text-sm text-red-600 mt-1">{errors.niche}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Count
                  </label>
                  <select 
                    value={formData.targetCount}
                    onChange={(e) => handleInputChange('targetCount', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 bg-white"
                  >
                    <option value="5">5 leads</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Type
                  </label>
                  <select 
                    value={formData.campaignType}
                    onChange={(e) => handleInputChange('campaignType', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 bg-white ${
                      errors.campaignType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Choose type</option>
                    <option value="cold-email">Cold Email</option>
                    <option value="linkedin">LinkedIn Outreach</option>
                    <option value="multi-channel">Multi-Channel</option>
                  </select>
                  {errors.campaignType && <p className="text-sm text-red-600 mt-1">{errors.campaignType}</p>}
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-orange-600" />
                  Campaign Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Target Audience:</span>
                    <p className="font-medium text-gray-900">
                      {formData.niche ? `${formData.niche.charAt(0).toUpperCase() + formData.niche.slice(1)} industry` : 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Lead Target:</span>
                    <p className="font-medium text-gray-900">
                      {formData.targetCount ? `${parseInt(formData.targetCount).toLocaleString()} prospects` : '5 prospects'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Channel:</span>
                    <p className="font-medium text-gray-900">
                      {formData.campaignType ? formData.campaignType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Timeline:</span>
                    <p className="font-medium text-gray-900">2-3 weeks</p>
                  </div>
                </div>
              </div>

              {/* Webhook Status Message */}
              {webhookStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-green-800 font-medium">Project created successfully! Redirecting to lead generation...</p>
                  </div>
                </div>
              )}

              {webhookStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-800 font-medium">Failed to create project. Please try again.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={handleModalClose}
                  variant="secondary"
                  size="md"
                  className="px-8 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="px-8 py-3"
                  disabled={isCreating}
                  loading={isCreating}
                  icon={webhookStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                >
                  {isCreating ? 'Creating Project...' : webhookStatus === 'success' ? 'Project Created!' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}