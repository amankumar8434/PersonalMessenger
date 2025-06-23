import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import { Send, Paperclip, MoreVertical, User as UserIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Message, User } from '@shared/schema';

interface ChatProps {
  currentUser: User;
  chatPartner: User;
  onBack: () => void;
}

export default function Chat({ currentUser, chatPartner, onBack }: ChatProps) {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { isConnected, sendMessage, sendTyping, messages, typingUsers, error } = useWebSocket();

  // Fetch message history
  const { data: messageHistory = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages', currentUser.id, chatPartner.id],
  });

  // Combine message history with real-time messages
  const allMessages = [...messageHistory, ...messages.filter(
    msg => !messageHistory.some(histMsg => histMsg.id === msg.id)
  )];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
    
    // Send typing indicator
    sendTyping(currentUser.id, value.length > 0);
    
    // Clear typing indicator after 2 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(currentUser.id, false);
    }, 2000);
  };

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (content && isConnected) {
      sendMessage(content, currentUser.id, chatPartner.id);
      setMessageInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      sendTyping(currentUser.id, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isTyping = typingUsers.has(chatPartner.id);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-lg">
      {/* Chat Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft size={16} />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
            <UserIcon className="text-white" size={16} />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">{chatPartner.username}</h1>
            <p className="text-sm text-green-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span>Online</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4">
        <div className="flex justify-center">
          <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">Today</span>
        </div>

        {allMessages.map((message) => {
          const isCurrentUser = message.senderId === currentUser.id;
          
          return (
            <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'items-start space-x-2'} max-w-xs md:max-w-md ${isCurrentUser ? 'ml-auto' : ''}`}>
              {!isCurrentUser && (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="text-white" size={12} />
                </div>
              )}
              
              <div className={`${isCurrentUser 
                ? 'bg-blue-500 text-white rounded-2xl rounded-tr-md' 
                : 'bg-white text-gray-800 rounded-2xl rounded-tl-md'
              } px-4 py-2 shadow-sm`}>
                <p>{message.content}</p>
                <div className={`flex items-center ${isCurrentUser ? 'justify-end' : ''} mt-1 space-x-1`}>
                  <p className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                  {isCurrentUser && (
                    <i className={`fas ${message.read ? 'fa-check-double' : 'fa-check'} text-xs text-blue-200`}></i>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start space-x-2 max-w-xs md:max-w-md">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="text-white" size={12} />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors self-end mb-1">
            <Paperclip size={16} />
          </button>

          <div className="flex-1 relative">
            <textarea 
              ref={textareaRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-500"
            />
          </div>

          <button 
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !isConnected}
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed self-end"
          >
            <Send size={14} />
          </button>
        </div>

        {error && (
          <div className="mt-2 text-xs text-center">
            <span className="text-red-600">
              ⚠️ {error}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
