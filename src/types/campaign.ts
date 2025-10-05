export interface EmailTemplate {
  id: string;
  projectId: string;
  subject: string;
  content: string;
  variables: string[];
  type: 'initial' | 'follow_up_1' | 'follow_up_2' | 'follow_up_3';
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  projectId: string;
  templateId: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  totalEmails: number;
  sentEmails: number;
  openedEmails: number;
  clickedEmails: number;
  repliedEmails: number;
  bouncedEmails: number;
  meetingsScheduled: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  totalSent: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  meetingsScheduled: number;
}
