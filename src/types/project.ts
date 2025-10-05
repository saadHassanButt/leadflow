export interface Project {
  id: string;
  name: string;
  description: string;
  companyName: string;
  companyEmail: string;
  niche: string;
  targetCount: number;
  campaignType: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  totalSteps: number;
}

export interface CreateProjectData {
  name: string;
  description: string;
  companyName: string;
  companyEmail: string;
  niche: string;
  targetCount: number;
  campaignType: string;
}

export const NICHES = [
  'Technology',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Marketing',
  'Education',
  'Real Estate',
  'Manufacturing',
  'Consulting',
  'Other'
] as const;

export const TARGET_COUNTS = [
  { value: 50, label: '50 leads' },
  { value: 100, label: '100 leads' },
  { value: 250, label: '250 leads' },
  { value: 500, label: '500 leads' },
  { value: 1000, label: '1000 leads' },
] as const;

export const CAMPAIGN_TYPES = [
  'Cold Email',
  'LinkedIn Outreach',
  'Multi-channel',
] as const;
