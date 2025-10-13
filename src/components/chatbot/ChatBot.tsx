'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { ChatMessage, ChatbotContextData, ChatSession } from '@/types/chatbot';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import {
  saveChatHistory,
  loadChatHistory,
  saveCurrentSession,
  loadCurrentSession,
  createNewSession,
  updateSessionWithMessage,
  getSessionById,
  generateId,
  getConversationContext,
  getSuggestedQuestions
} from '@/lib/chatbot-utils';

interface ChatBotProps {
  projectId?: string;
  currentPage?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ projectId, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState<ChatbotContextData | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on component mount
  useEffect(() => {
    const sessions = loadChatHistory();
    setChatSessions(sessions);
    
    const currentSession = loadCurrentSession();
    if (currentSession && sessions.find(s => s.id === currentSession)) {
      setCurrentSessionId(currentSession);
      const session = getSessionById(sessions, currentSession);
      if (session) {
        setMessages(session.messages);
      }
    } else {
      // Create new session if none exists
      const newSession = createNewSession();
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: `Hi! I'm your LeadFlow assistant. I can help you with questions about your campaigns, leads, projects, and analytics. What would you like to know?`,
        sender: 'bot',
        timestamp: new Date()
      };
      
      newSession.messages = [welcomeMessage];
      const updatedSessions = [...sessions, newSession];
      
      setChatSessions(updatedSessions);
      setCurrentSessionId(newSession.id);
      setMessages([welcomeMessage]);
      
      saveChatHistory(updatedSessions);
      saveCurrentSession(newSession.id);
    }
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContextData = useCallback(async () => {
    try {
      // Get auth tokens from localStorage
      const accessToken = localStorage.getItem('google_access_token');
      const refreshToken = localStorage.getItem('google_refresh_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');

      if (!accessToken || !refreshToken || !tokenExpiry) {
        console.log('No auth tokens found for chatbot context');
        return;
      }

      const params = new URLSearchParams({
        include_projects: 'true',
        include_leads: 'true'
      });

      if (projectId) {
        params.append('project_id', projectId);
      }

      const response = await fetch(`/api/chatbot/context?${params}`, {
        headers: {
          'x-google-access-token': accessToken,
          'x-google-refresh-token': refreshToken,
          'x-google-token-expiry': tokenExpiry,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setContextData(result.data);
          console.log('Context data loaded for chatbot:', result.data.metadata);
        }
      }
    } catch (error) {
      console.error('Error fetching context data:', error);
    }
  }, [projectId]);

  // Fetch context data when chatbot opens
  useEffect(() => {
    if (isOpen && !contextData) {
      fetchContextData();
    }
  }, [isOpen, contextData, fetchContextData]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentSessionId) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    // Update messages and session
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Update session with user message
    const updatedSessions = updateSessionWithMessage(chatSessions, currentSessionId, userMessage);
    setChatSessions(updatedSessions);
    saveChatHistory(updatedSessions);
    
    setIsLoading(true);

    try {
      // Get conversation context for continuity
      const conversationContext = getConversationContext(messages, 3);
      
      // Prepare enhanced context with conversation history
      const enhancedContext = {
        ...contextData,
        conversationHistory: conversationContext,
        currentPage: currentPage,
        projectId: projectId
      };

      // Send message to chat API
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          context: enhancedContext,
          projectId: projectId
        }),
      });

      const result = await response.json();

      if (result.success) {
        const botMessage: ChatMessage = {
          id: generateId(),
          content: result.data.message,
          sender: 'bot',
          timestamp: new Date()
        };
        
        // Update messages and session with bot response
        const finalMessages = [...updatedMessages, botMessage];
        setMessages(finalMessages);
        
        const finalSessions = updateSessionWithMessage(updatedSessions, currentSessionId, botMessage);
        setChatSessions(finalSessions);
        saveChatHistory(finalSessions);
      } else {
        const errorMessage: ChatMessage = {
          id: generateId(),
          content: result.fallbackMessage || 'Sorry, I encountered an error processing your request.',
          sender: 'bot',
          timestamp: new Date()
        };
        
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);
        
        const finalSessions = updateSessionWithMessage(updatedSessions, currentSessionId, errorMessage);
        setChatSessions(finalSessions);
        saveChatHistory(finalSessions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: 'Sorry, I\'m having trouble connecting right now. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      
      const finalSessions = updateSessionWithMessage(updatedSessions, currentSessionId, errorMessage);
      setChatSessions(finalSessions);
      saveChatHistory(finalSessions);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    // Create new session
    const newSession = createNewSession();
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      content: `Hi! I'm your LeadFlow assistant. I can help you with questions about your campaigns, leads, projects, and analytics. What would you like to know?`,
      sender: 'bot',
      timestamp: new Date()
    };
    
    newSession.messages = [welcomeMessage];
    const updatedSessions = [...chatSessions, newSession];
    
    setChatSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    setMessages([welcomeMessage]);
    
    saveChatHistory(updatedSessions);
    saveCurrentSession(newSession.id);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle size={20} />
                <div>
                  <h3 className="font-semibold">LeadFlow Assistant</h3>
                  <p className="text-xs opacity-90">
                    {contextData ? `${contextData.metadata?.totalProjects || 0} projects, ${contextData.metadata?.totalLeads || 0} leads` : 'Loading...'}
                  </p>
                </div>
              </div>
              <button
                onClick={clearChat}
                className="text-white/80 hover:text-white text-sm"
              >
                Clear
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <ChatMessageComponent key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput 
              onSendMessage={sendMessage} 
              disabled={isLoading} 
              suggestions={contextData ? getSuggestedQuestions(contextData as unknown as Record<string, unknown>) : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
