// src/components/forms/project-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Target, Briefcase } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { CreateProjectData, NICHES, TARGET_COUNTS, CAMPAIGN_TYPES } from '@/types/project';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    companyName: '',
    companyEmail: '',
    niche: '',
    targetCount: 100,
    campaignType: ''
  });
  const [errors, setErrors] = useState<Partial<CreateProjectData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateProjectData> = {};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call API to create project
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const { data: project } = await response.json();
      
      // Close modal and redirect to project page
      onClose();
      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateProjectData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Project Name"
            placeholder="My Lead Generation Campaign"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            icon={<Briefcase className="w-4 h-4" />}
          />
          
          <Input
            label="Company Name"
            placeholder="Your Company Ltd."
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            error={errors.companyName}
            icon={<Building2 className="w-4 h-4" />}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Project Description
          </label>
          <textarea
            rows={3}
            className="input resize-none text-neutral-900"
            placeholder="Describe your lead generation goals and target audience..."
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
          {errors.description && (
            <p className="text-sm text-error-600">{errors.description}</p>
          )}
        </div>

        <Input
          label="Company Email"
          type="email"
          placeholder="hello@yourcompany.com"
          value={formData.companyEmail}
          onChange={(e) => handleInputChange('companyEmail', e.target.value)}
          error={errors.companyEmail}
          icon={<Mail className="w-4 h-4" />}
        />

        {/* Target Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              Select Niche
            </label>
            <select
              className="input"
              value={formData.niche}
              onChange={(e) => handleInputChange('niche', e.target.value)}
            >
              <option value="">Choose a niche</option>
              {NICHES.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
            {errors.niche && (
              <p className="text-sm text-error-600">{errors.niche}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              Target Count
            </label>
            <select
              className="input"
              value={formData.targetCount}
              onChange={(e) => handleInputChange('targetCount', parseInt(e.target.value))}
            >
              {TARGET_COUNTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              Campaign Type
            </label>
            <select
              className="input"
              value={formData.campaignType}
              onChange={(e) => handleInputChange('campaignType', e.target.value)}
            >
              <option value="">Choose type</option>
              {CAMPAIGN_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.campaignType && (
              <p className="text-sm text-error-600">{errors.campaignType}</p>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
          <h4 className="font-medium text-neutral-900 mb-3">Campaign Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-500">Target Audience:</span>
              <p className="font-medium text-neutral-900">
                {formData.niche || 'Not selected'} industry
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Lead Target:</span>
              <p className="font-medium text-neutral-900">
                {formData.targetCount} prospects
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Channel:</span>
              <p className="font-medium text-neutral-900">
                {formData.campaignType || 'Not selected'}
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Estimated Timeline:</span>
              <p className="font-medium text-neutral-900">2-3 weeks</p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            icon={<Target className="w-4 h-4" />}
          >
            {loading ? 'Creating Project...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}