export interface MailgunEvent {
  event: string;
  timestamp: number;
  id: string;
  message: {
    headers: {
      'message-id': string;
      to: string;
      from: string;
      subject: string;
    };
    recipients: string[];
    sender: string;
    'message-url': string;
  };
  recipient: string;
  'delivery-status': {
    'message': string;
    'code': number;
    'description': string;
  };
  'user-variables': Record<string, any>;
  'flags': {
    'is-routed': boolean;
    'is-authenticated': boolean;
    'is-system-message': boolean;
    'is-test-mode': boolean;
  };
  'log-level': string;
  'method': string;
  'tags': string[];
  'campaigns': string[];
  'envelope': {
    'sender': string;
    'transport': string;
    'targets': string;
  };
  'storage': {
    'url': string;
    'key': string;
  };
}

export interface MailgunStats {
  accepted: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  complained: number;
  unsubscribed: number;
  stored: number;
  total: number;
}

export interface MailgunCampaignStats {
  campaign_id: string;
  campaign_name: string;
  stats: MailgunStats;
  events: MailgunEvent[];
  time_range: {
    start: string;
    end: string;
  };
}

export interface MailgunDomainStats {
  domain: string;
  stats: MailgunStats;
  time_range: {
    start: string;
    end: string;
  };
}

// Google Sheets Campaign Statistics Interface
export interface GoogleSheetsCampaignStats {
  campaign_id: string;
  project_id: string;
  total_sent: number;
  accepted: number;
  delivered: number;
  opened_total: number;
  opened_unique: number;
  clicked_total: number;
  clicked_unique: number;
  failed: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  click_to_open_rate: number;
  bounce_rate: number;
  failure_rate: number;
  complaint_rate: number;
  stats_fetched_at: string;
  mailgun_events_found: number;
  time_range_begin: string;
  time_range_end: string;
  update_type: string;
}

export interface ProjectAnalytics {
  project_id: string;
  project_name: string;
  leads: {
    total: number;
    validated: number;
    deliverable: number;
    undeliverable: number;
    risky: number;
  };
  templates: {
    total: number;
    generated: number;
    edited: number;
  };
  campaigns: {
    total: number;
    active: number;
    completed: number;
  };
  mailgun_stats: MailgunStats;
  performance_metrics: {
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
  };
  time_range: {
    start: string;
    end: string;
  };
}
