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
  projects?: any[];
  leads?: any[];
  campaignStats?: any;
  currentProjectId?: string;
  currentPage?: string;
}

export interface ChatbotState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  currentSession: string | null;
}
