export interface Lead {
  lead_id: string;
  project_id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  source: string;
  status: string;
  // Email validation fields
  validation_status?: string;
  validation_score?: string;
  validation_reason?: string;
  is_deliverable?: string;
  is_free_email?: string;
  is_role_email?: string;
  is_disposable?: string;
  validated_at?: string;
}

export interface CreateLeadData {
  name: string;
  email: string;
  company: string;
  position: string;
  source: string;
  status: string;
}
