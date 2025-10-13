// Chatbot Types
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatbotContextData {
  projects?: Record<string, unknown>[];
  leads?: Record<string, unknown>[];
  campaignStats?: Record<string, unknown>;
  currentProjectId?: string;
  currentPage?: string;
  metadata?: {
    projectId?: string | null;
    timestamp?: string;
    totalProjects?: number;
    totalLeads?: number;
  };
}

export interface ChatbotState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  currentSession: string | null;
}
