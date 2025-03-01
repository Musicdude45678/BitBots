import { useState, FormEvent, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon, TrashIcon, PlusIcon, ShareIcon, Bars3Icon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { auth } from '../config/firebase';
import { 
  createChat, 
  sendMessage, 
  getChatMessages, 
  getBotById,
  getUserBotChats,
  deleteChat,
  getChatById,
  Bot,
  Chat
} from '../services/chatService';
import { shareBot } from '../utils/sharing';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Timestamp;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [bot, setBot] = useState<Bot | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { botId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const loadBotAndChats = async () => {
      if (!auth.currentUser || !botId) return;
      
      try {
        setLoading(true);
        // Load bot details
        const botDetails = await getBotById(botId);
        if (botDetails) {
          setBot(botDetails);
        } else {
          console.error('Bot not found');
          return;
        }
        
        // Load all chats for this bot
        const userBotChats = await getUserBotChats(auth.currentUser.uid, botId);
        setChats(userBotChats);
        
        // If no chats exist, create a new one
        if (userBotChats.length === 0) {
          setCreatingChat(true);
          try {
            const newChatId = await createChat(auth.currentUser.uid, botId);
            if (newChatId) {
              const newChat = await getChatById(newChatId);
              if (newChat) {
                setChats([newChat]);
                setChatId(newChatId);
              }
            }
          } finally {
            setCreatingChat(false);
          }
        } else {
          // Sort chats by timestamp and select the most recent
          const sortedChats = [...userBotChats].sort((a, b) => {
            if (!a.lastMessageTimestamp || !b.lastMessageTimestamp) return 0;
            const timeA = (a.lastMessageTimestamp as Timestamp).seconds || 0;
            const timeB = (b.lastMessageTimestamp as Timestamp).seconds || 0;
            return timeB - timeA;
          });
          
          if (sortedChats[0]?.id) {
            setChatId(sortedChats[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading bot and chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBotAndChats();
  }, [botId]);

  // Load messages when chat changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) return;
      
      try {
        setLoadingMessages(true);
        const chatMessages = await getChatMessages(chatId);
        setMessages(chatMessages.map(msg => ({
          id: msg.id || uuidv4(),
          content: msg.content,
          role: msg.isBot ? 'assistant' : 'user',
          timestamp: msg.timestamp
        })));
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    if (chatId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chatId]);

  const handleNewChat = async () => {
    if (!auth.currentUser || !botId || creatingChat) return;
    
    try {
      setCreatingChat(true);
      const newChatId = await createChat(auth.currentUser.uid, botId);
      const newChat = await getChatById(newChatId);
      if (newChat) {
        setChats(prev => [newChat, ...prev]);
        setChatId(newChatId);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chatIdToDelete: string) => {
    if (!auth.currentUser || chats.length <= 1 || deletingChatId) return;
    
    try {
      setDeletingChatId(chatIdToDelete);
      await deleteChat(chatIdToDelete);
      setChats(prev => prev.filter(chat => chat.id !== chatIdToDelete));
      
      // If we're deleting the current chat, switch to another one
      if (chatId === chatIdToDelete) {
        const remainingChats = chats.filter(chat => chat.id !== chatIdToDelete);
        if (remainingChats.length > 0 && remainingChats[0]?.id) {
          setChatId(remainingChats[0].id);
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setDeletingChatId(null);
    }
  };

  async function handleSubmit(e: FormEvent) {
    const messageText = newMessage;
    e.preventDefault();
    if (!messageText.trim() || !chatId || !auth.currentUser || !bot) return;

    const messageId = uuidv4();
    try {
      setSending(true);

      // Create the message object for UI
      const newMessage: Message = {
        id: messageId,
        content: messageText,
        role: 'user',
        timestamp: Timestamp.now(),
      };

      // Update UI immediately
      setMessages(prev => [...prev, newMessage]);
      setNewMessage('');

      // Send message to Firebase
      await sendMessage(chatId, {
        content: messageText,
        senderId: auth.currentUser.uid,
        isBot: false
      });

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: bot.systemPrompt },
            { role: 'user', content: messageText },
          ],
        }),
      });

      const data = await response.json();
      const assistantResponse = data.choices[0].message.content;

      // Send bot's response to Firebase
      if (botId && chatId) {
        await sendMessage(chatId, {
          content: assistantResponse,
          senderId: botId,
          isBot: true
        });
      }

      // Add assistant message to UI
      const assistantMessage: Message = {
        id: uuidv4(),
        content: assistantResponse,
        role: 'assistant',
        timestamp: Timestamp.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally remove the message from UI if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } finally {
      setSending(false);
    }
  }

  const handleShare = async () => {
    if (!botId) return;
    
    setSharing(true);
    const result = await shareBot({
      botId,
      name: bot?.name,
      description: bot?.systemPrompt
    });

    if (result.copied) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
    setSharing(false);
  };

  if (!bot || !auth.currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat List Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:relative lg:translate-x-0 
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}
      >
        {/* Sidebar Header with New Chat Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <button
              onClick={handleNewChat}
              disabled={creatingChat}
              className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {creatingChat ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              ) : (
                <PlusIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              )}
              <span className="truncate">{creatingChat ? 'Creating...' : 'New Chat'}</span>
            </button>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-1 flex-shrink-0 p-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:hidden"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                if (chat.id) {
                  setChatId(chat.id);
                  setSidebarOpen(false);
                }
              }}
              className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                chat.id === chatId ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {chat.lastMessage ? (
                      <span className="line-clamp-1">{chat.lastMessage}</span>
                    ) : (
                      'New Chat'
                    )}
                  </p>
                  {chat.lastMessageTimestamp && (chat.lastMessageTimestamp as Timestamp).seconds
                    ? new Date((chat.lastMessageTimestamp as Timestamp).seconds * 1000).toLocaleDateString()
                    : 'No date'}
                </div>
                {chats.length > 1 && chat.id === chatId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      chat.id && handleDeleteChat(chat.id);
                    }}
                    disabled={deletingChatId === chat.id}
                    className="ml-2 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-500 disabled:opacity-50"
                  >
                    {deletingChatId === chat.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative lg:pl-72">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex items-center">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{bot?.name}</h1>
                  {bot?.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{bot.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={sharing}
                  title="Share Bot"
                >
                  {sharing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600" />
                  ) : (
                    <ShareIcon className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">
                    {shareSuccess ? 'Copied!' : 'Share'}
                  </span>
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title="Back to Dashboard"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">
                    Back to Dashboard
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-6" ref={messagesEndRef}>
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.role === 'assistant'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'bg-blue-600 dark:bg-blue-500 text-white'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {loadingMessages && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input form */}
              <div className="border-t border-gray-200 dark:border-gray-700 py-4">
                <form onSubmit={handleSubmit} className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="rounded-lg bg-blue-600 dark:bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
