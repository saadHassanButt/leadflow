// Chatbot utility functions
import { ChatMessage, ChatSession } from '@/types/chatbot';

// Local storage keys
const CHAT_HISTORY_KEY = 'leadflow_chat_history';
const CURRENT_SESSION_KEY = 'leadflow_current_session';

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Chat history management
export function saveChatHistory(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

export function loadChatHistory(): ChatSession[] {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (stored) {
      const sessions = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  return [];
}

export function saveCurrentSession(sessionId: string): void {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
  } catch (error) {
    console.error('Error saving current session:', error);
  }
}

export function loadCurrentSession(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error('Error loading current session:', error);
    return null;
  }
}

// Create new chat session
export function createNewSession(): ChatSession {
  const sessionId = generateId();
  const session: ChatSession = {
    id: sessionId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return session;
}

// Update session with new message
export function updateSessionWithMessage(
  sessions: ChatSession[],
  sessionId: string,
  message: ChatMessage
): ChatSession[] {
  return sessions.map(session => {
    if (session.id === sessionId) {
      return {
        ...session,
        messages: [...session.messages, message],
        updatedAt: new Date()
      };
    }
    return session;
  });
}

// Get session by ID
export function getSessionById(sessions: ChatSession[], sessionId: string): ChatSession | null {
  return sessions.find(session => session.id === sessionId) || null;
}

// Delete session
export function deleteSession(sessions: ChatSession[], sessionId: string): ChatSession[] {
  return sessions.filter(session => session.id !== sessionId);
}

// Clear all chat history
export function clearAllChatHistory(): void {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
    localStorage.removeItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
}

// Export chat session to text
export function exportSessionToText(session: ChatSession): string {
  const header = `LeadFlow Chat Session - ${session.createdAt.toLocaleString()}\n${'='.repeat(50)}\n\n`;
  
  const messages = session.messages.map(msg => {
    const sender = msg.sender === 'user' ? 'You' : 'LeadFlow Assistant';
    const timestamp = msg.timestamp.toLocaleTimeString();
    return `[${timestamp}] ${sender}:\n${msg.content}\n`;
  }).join('\n');
  
  return header + messages;
}

// Get conversation context for continuity
export function getConversationContext(messages: ChatMessage[], maxMessages: number = 5): string {
  const recentMessages = messages.slice(-maxMessages);
  
  if (recentMessages.length === 0) return '';
  
  let context = 'Previous conversation context:\n';
  recentMessages.forEach(msg => {
    const sender = msg.sender === 'user' ? 'User' : 'Assistant';
    context += `${sender}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`;
  });
  
  return context + '\n';
}

// Suggested questions based on context
export function getSuggestedQuestions(contextData: any): string[] {
  const suggestions: string[] = [];
  
  if (contextData?.projects?.length > 0) {
    suggestions.push("How are my projects performing?");
    suggestions.push("Which project has the most leads?");
  }
  
  if (contextData?.leads?.length > 0) {
    suggestions.push("Show me my recent leads");
    suggestions.push("What's my lead conversion rate?");
    suggestions.push("Which lead source is most effective?");
  }
  
  if (contextData?.projects?.some((p: any) => p.status === 'active')) {
    suggestions.push("What's the status of my active campaigns?");
  }
  
  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      "How does LeadFlow work?",
      "Show me my campaign analytics",
      "Help me understand my data",
      "What can you help me with?"
    );
  }
  
  return suggestions.slice(0, 4); // Limit to 4 suggestions
}
