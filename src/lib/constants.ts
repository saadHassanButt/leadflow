import { Step } from '@/components/ui/stepper';

export const PROJECT_STEPS: Step[] = [
  {
    id: 'leads',
    name: 'Discover Leads',
    description: 'Find and verify prospects',
  },
  {
    id: 'template',
    name: 'Create Template',
    description: 'Generate email templates',
  },
  {
    id: 'campaign',
    name: 'Launch Campaign',
    description: 'Send personalized emails',
  },
];

export const LEAD_STATUSES = {
  new: {
    label: 'New',
    color: 'bg-neutral-100 text-neutral-800',
  },
  contacted: {
    label: 'Contacted',
    color: 'bg-primary-100 text-primary-800',
  },
  replied: {
    label: 'Replied',
    color: 'bg-success-100 text-success-800',
  },
  interested: {
    label: 'Interested',
    color: 'bg-accent-100 text-accent-800',
  },
  not_interested: {
    label: 'Not Interested',
    color: 'bg-error-100 text-error-800',
  },
  meeting_scheduled: {
    label: 'Meeting Scheduled',
    color: 'bg-success-100 text-success-800',
  },
} as const;

export const EMAIL_STATUSES = {
  pending: {
    label: 'Pending',
    color: 'bg-neutral-100 text-neutral-800',
  },
  sent: {
    label: 'Sent',
    color: 'bg-primary-100 text-primary-800',
  },
  opened: {
    label: 'Opened',
    color: 'bg-success-100 text-success-800',
  },
  clicked: {
    label: 'Clicked',
    color: 'bg-accent-100 text-accent-800',
  },
  replied: {
    label: 'Replied',
    color: 'bg-success-100 text-success-800',
  },
  bounced: {
    label: 'Bounced',
    color: 'bg-error-100 text-error-800',
  },
} as const;
