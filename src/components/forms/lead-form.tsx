import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { CreateLeadData, Lead } from '@/types/lead';

interface LeadFormProps {
  initialData?: Lead;
  onSave: (data: CreateLeadData) => void;
  onCancel: () => void;
}

export function LeadForm({ initialData, onSave, onCancel }: LeadFormProps) {
  const [formData, setFormData] = useState<CreateLeadData>({
    name: '',
    email: '',
    company: '',
    position: '',
    source: 'Manual Entry',
    status: 'Active'
  });

  const [errors, setErrors] = useState<Partial<CreateLeadData>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        company: initialData.company || '',
        position: initialData.position || '',
        source: initialData.source || 'Manual Entry',
        status: initialData.status || 'Active'
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateLeadData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field: keyof CreateLeadData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
        />
        
        <Input
          label="Email"
          type="email"
          placeholder="john@company.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="Company"
          placeholder="Acme Corp"
          value={formData.company}
          onChange={(e) => handleInputChange('company', e.target.value)}
          error={errors.company}
        />
        
        <Input
          label="Position"
          placeholder="CEO, Marketing Manager, etc."
          value={formData.position}
          onChange={(e) => handleInputChange('position', e.target.value)}
          error={errors.position}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Source
          </label>
          <select
            value={formData.source}
            onChange={(e) => handleInputChange('source', e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="Manual Entry">Manual Entry</option>
            <option value="Generated Lead">Generated Lead</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Apollo">Apollo</option>
            <option value="Apify">Apify</option>
            <option value="Cold Email">Cold Email</option>
            <option value="Referral">Referral</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Qualified">Qualified</option>
            <option value="Unqualified">Unqualified</option>
            <option value="Contacted">Contacted</option>
            <option value="Responded">Responded</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-neutral-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="px-8"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="px-8"
        >
          {initialData ? 'Update Lead' : 'Add Lead'}
        </Button>
      </div>
    </form>
  );
}