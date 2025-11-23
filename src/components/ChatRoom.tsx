import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMessaging } from '../hooks/useMessaging';
import { usePresence } from '../hooks/usePresence';
import ImageModal from './ImageModal';
import ImageEditor from './ImageEditor';
import Preloader from './Preloader';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: number;
  unread: number;
  avatar?: string;
  participants: number;
}

export default function ChatRoom() {
  const { currentUser } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  
  // Real-time messaging hook
  const { messages, typingUsers, isLoading, sendMessage, handleTyping } = useMessaging(selectedConversation);
  
  // Presence for current user
  usePresence();
  
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'General Chat',
      lastMessage: 'That\'s awesome! Check out...',
      timestamp: Date.now() - 2400000,
      unread: 2,
      participants: 5,
    },
    {
      id: '2',
      name: 'Project Team',
      lastMessage: 'Meeting at 3 PM today',
      timestamp: Date.now() - 7200000,
      unread: 0,
      participants: 8,
    },
    {
      id: '3',
      name: 'Design Review',
      lastMessage: 'Looks good to me!',
      timestamp: Date.now() - 86400000,
      unread: 0,
      participants: 3,
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(newMessage, 'text');
    setNewMessage('');
    handleTyping(false);
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Trigger typing indicator
    if (value.length > 0) {
      handleTyping(true);
    } else {
      handleTyping(false);
    }
  };

  const handleSaveEditedImage = async (imageData: string, prompt: string) => {
    // Send edited image as a message with AI metadata
    await sendMessage(prompt, 'image', { aiEdited: true, aiPrompt: prompt }, imageData);
  };

  const handleEditImage = (imageUrl: string) => {
    setImageToEdit(imageUrl);
    setShowImageEditor(true);
    setSelectedImage(null); // Close image modal if open
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isOwnMessage = (senderId: string) => senderId === currentUser?.uid || senderId === 'me';

  // Show loading state
  if (isLoading && messages.length === 0) {
    return <Preloader message="Loading messages" />;
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left Sidebar - Conversations */}
      <div
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative z-30 w-80 flex-shrink-0 transition-transform duration-300`}
      >
        <div className="liquid-glass-light h-full flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-glass-primary">Conversations</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="input-glass w-full px-4 py-2 pl-10 text-sm"
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-glass-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto glass-scrollbar p-2">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => {
                  setSelectedConversation(conv.id);
                  setShowSidebar(false);
                }}
                className={`w-full p-3 rounded-xl mb-2 text-left transition-all ${
                  selectedConversation === conv.id
                    ? 'liquid-glass-active'
                    : 'liquid-glass-hover hover:bg-white/8'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {conv.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-glass-primary truncate">{conv.name}</h3>
                      <span className="text-xs text-glass-tertiary">{formatTime(conv.timestamp)}</span>
                    </div>
                    <p className="text-sm text-glass-secondary truncate">{conv.lastMessage}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-glass-tertiary">{conv.participants} members</span>
                      {conv.unread > 0 && (
                        <span className="badge-glass bg-blue-500/80 text-white">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center - Chat Area */}
      <div className="flex-1 liquid-glass-light flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(true)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
              G
            </div>
            <div>
              <h2 className="font-bold text-glass-primary">General Chat</h2>
              <p className="text-xs text-glass-secondary">5 members • 3 online</p>
            </div>
          </div>
          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto glass-scrollbar p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message.senderId) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isOwnMessage(message.senderId) ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwnMessage(message.senderId) && (
                  <span className="text-xs text-glass-secondary mb-1 px-2">{message.senderName}</span>
                )}
                {message.type === 'text' ? (
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwnMessage(message.senderId)
                        ? 'bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white'
                        : 'liquid-glass-subtle text-glass-primary'
                    } ${(message as any).pending ? 'opacity-60' : ''} ${(message as any).error ? 'bg-red-500/50' : ''}`}
                  >
                    <p className="text-sm break-words">{message.text}</p>
                    {(message as any).pending && (
                      <span className="text-xs opacity-75">Sending...</span>
                    )}
                    {(message as any).error && (
                      <span className="text-xs text-red-200">Failed to send</span>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      onClick={() => setSelectedImage(message.storageRef || null)}
                      className="cursor-pointer group relative overflow-hidden rounded-2xl liquid-glass-subtle"
                    >
                      <img
                        src={message.storageRef}
                        alt="Message attachment"
                        className="max-w-xs h-auto transition-transform group-hover:scale-105"
                      />
                      
                      {/* AI Edited Badge */}
                      {message.metadata?.aiEdited && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-sm border border-white/20 flex items-center gap-1">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          <span className="text-xs font-medium text-white">AI Edited</span>
                        </div>
                      )}

                      {/* Hover overlay with zoom icon */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Edit Image Button */}
                    {!message.metadata?.aiEdited && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditImage(message.storageRef || '');
                        }}
                        className="mt-2 px-3 py-1 rounded-lg liquid-glass-hover text-xs text-glass-primary hover:text-blue-400 transition-colors flex items-center gap-1"
                        title="Edit with AI"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Edit with AI</span>
                      </button>
                    )}

                    {/* Show AI prompt if available */}
                    {message.metadata?.aiEdited && message.metadata?.aiPrompt && (
                      <div className="mt-2 text-xs text-glass-secondary italic px-2">
                        "{message.metadata.aiPrompt}"
                      </div>
                    )}
                  </div>
                )}
                <span className="text-xs text-glass-tertiary mt-1 px-2">{formatTime(message.createdAt)}</span>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="liquid-glass-subtle px-4 py-2 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
          <div className="flex gap-2 items-end">
            <button
              type="button"
              className="p-3 button-glass flex-shrink-0"
              title="Attach file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowImageEditor(true)}
              className="p-3 button-glass flex-shrink-0"
              title="AI Image Editor"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </button>
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                onBlur={() => handleTyping(false)}
                placeholder="Type a message..."
                className="input-glass w-full px-4 py-3 pr-12 resize-none max-h-32"
                rows={1}
              />
              <button
                type="button"
                className="absolute right-3 top-3 p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-glass-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600/80 hover:to-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex-shrink-0 backdrop-blur-xl border border-white/10"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Right Panel - Settings */}
      {showRightPanel && (
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="liquid-glass-light h-full overflow-y-auto glass-scrollbar p-4">
            <h3 className="font-bold text-glass-primary mb-4">Conversation Info</h3>
            
            {/* Members */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-glass-secondary mb-3">Members (5)</h4>
              <div className="space-y-2">
                {['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'You'].map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg liquid-glass-hover">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                      {member[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-glass-primary truncate">{member}</p>
                      <p className="text-xs text-glass-tertiary">
                        {idx < 3 ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    {idx < 3 && (
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="glass-divider mb-4"></div>
            <h4 className="text-sm font-semibold text-glass-secondary mb-3">Settings</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-lg liquid-glass-hover text-sm text-glass-primary">
                🔔 Notifications
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg liquid-glass-hover text-sm text-glass-primary">
                🎨 Customize
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg liquid-glass-hover text-sm text-glass-primary">
                📁 Shared Files
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg liquid-glass-hover text-sm text-red-500">
                🚪 Leave Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Image Editor Modal */}
      {showImageEditor && (
        <ImageEditor
          isOpen={showImageEditor}
          onClose={() => {
            setShowImageEditor(false);
            setImageToEdit(null);
          }}
          initialImage={imageToEdit || undefined}
          onSaveToConversation={handleSaveEditedImage}
          conversationId={selectedConversation || undefined}
        />
      )}

      {/* Mobile Overlay */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
        />
      )}
    </div>
  );
}
