'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Play } from 'lucide-react';
import { Button, Stepper } from '@/components/ui';
import { useProject } from '@/lib/hooks/use-project';
import { PROJECT_STEPS } from '@/lib/constants';
import { StepNavigation } from '@/components/project/step-navigation';
import { apiClient } from '@/lib/api';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, loading, error } = useProject(projectId);
  const [startingProject, setStartingProject] = useState(false);

  const handleStartProject = async () => {
    if (!project) return;

    setStartingProject(true);
    try {
      // Trigger n8n workflow to initialize project
      await apiClient.triggerWebhook('initialize_project', projectId, {
        project: project,
      });

      // Navigate to first step
      router.push(`/project/${projectId}/leads`);
    } catch (error) {
      console.error('Failed to start project:', error);
    } finally {
      setStartingProject(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Project Not Found</h1>
          <p className="text-neutral-600 mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Page Header */}
      <div className="w-full py-12">
        <div className="flex items-center justify-center relative max-w-7xl mx-auto px-8">
          <StepNavigation className="hidden md:flex" />
          <div className="absolute right-8 text-right">
            <p className="text-sm text-neutral-300">Target: {project.targetCount} leads</p>
            <p className="text-sm text-neutral-300">Industry: {project.niche}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* Project Overview Card */}
          <div className="bg-neutral-800 rounded-xl p-8 mb-8 border border-neutral-700">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Campaign Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Company:</span>
                    <span className="font-medium text-white">{project.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Email:</span>
                    <span className="font-medium text-white">{project.companyEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Campaign Type:</span>
                    <span className="font-medium text-white">{project.campaignType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-300">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active' ? 'bg-success-100 text-success-800' :
                      project.status === 'completed' ? 'bg-primary-100 text-primary-800' :
                      'bg-neutral-100 text-neutral-800'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Next Steps
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 text-sm font-medium">1</span>
                    </div>
                    <span className="text-neutral-700">Discover and verify leads</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                      <span className="text-neutral-400 text-sm font-medium">2</span>
                    </div>
                    <span className="text-neutral-400">Generate email templates</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                      <span className="text-neutral-400 text-sm font-medium">3</span>
                    </div>
                    <span className="text-neutral-400">Launch outreach campaign</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Project Button */}
            <div className="mt-8 pt-6 border-t border-neutral-200 text-center">
              <Button
                size="lg"
                loading={startingProject}
                onClick={handleStartProject}
                icon={<Play className="w-5 h-5" />}
                className="px-8"
              >
                {startingProject ? 'Initializing Project...' : 'Start Project'}
              </Button>
              <p className="text-sm text-neutral-500 mt-2">
                This will begin the lead discovery process
              </p>
            </div>
          </div>

          {/* Workflow Preview */}
          <div className="card p-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-6">
              Workflow Overview
            </h3>
            <Stepper steps={PROJECT_STEPS} currentStep={-1} />
            
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              {PROJECT_STEPS.map((step: any, index: number) => (
                <div key={step.id} className="text-center p-4 bg-neutral-50 rounded-xl">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-soft">
                    <span className="text-lg font-bold text-neutral-400">{index + 1}</span>
                  </div>
                  <h4 className="font-medium text-neutral-900 mb-2">{step.name}</h4>
                  <p className="text-sm text-neutral-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
