'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/chatbot';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isBot 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
          : 'bg-gray-300 text-gray-700'
      }`}>
        {isBot ? <Bot size={16} /> : <User size={16} />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[280px] ${isBot ? '' : 'text-right'}`}>
        <div className={`inline-block p-3 rounded-lg ${
          isBot 
            ? 'bg-white border border-gray-200 text-gray-800' 
            : 'bg-blue-500 text-white'
        }`}>
          {isBot ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown 
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 last:mb-0">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 last:mb-0">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessageComponent;
