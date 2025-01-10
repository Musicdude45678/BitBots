import { useState, FormEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon, TrashIcon, PlusIcon, ShareIcon } from '@heroicons/react/24/solid';
import { auth } from '../config/firebase';
import { 
  createChat, 
  sendMessage, 
  getChatMessages, 
  getBotById,
  getUserBotChats,
  deleteChat,
  getChatById,
  Message as FirebaseMessage,
  Bot,
  Chat
} from '../services/chatService';
import { shareBot } from '../utils/sharing';

interface Message {
  id?: string;
  content: string;
  isBot: boolean;
  timestamp: any;
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
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const { botId } = useParams();
  const navigate = useNavigate();

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
            const timeA = a.lastMessageTimestamp?.seconds || 0;
            const timeB = b.lastMessageTimestamp?.seconds || 0;
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
          content: msg.content,
          isBot: msg.isBot,
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
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !auth.currentUser || !bot) return;

    try {
      setSending(true);

      // Add user message
      const userMessage: Message = {
        content: newMessage,
        isBot: false,
        timestamp: new Date(),
      };

      // Send message to Firebase
      await sendMessage(chatId, {
        content: newMessage,
        senderId: auth.currentUser.uid,
        isBot: false
      });

      // Update UI immediately
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

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
            { role: 'user', content: newMessage },
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
        content: assistantResponse,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
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
    <div className="fixed inset-0 flex">
      {/* Chat List Sidebar */}
      <div className="w-64 flex-shrink-0 border-r bg-gray-50 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <button
            onClick={handleNewChat}
            disabled={creatingChat}
            className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {creatingChat ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
            ) : (
              <PlusIcon className="h-4 w-4 mr-1" />
            )}
            {creatingChat ? 'Creating...' : 'New Chat'}
          </button>
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => chat.id && setChatId(chat.id)}
              className={`p-4 cursor-pointer hover:bg-gray-100 ${
                chat.id === chatId ? 'bg-gray-100' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {chat.lastMessage ? (
                      <span className="line-clamp-1">{chat.lastMessage}</span>
                    ) : (
                      'New Chat'
                    )}
                  </p>
                  {chat.lastMessageTimestamp && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(chat.lastMessageTimestamp.seconds * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {chats.length > 1 && chat.id === chatId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      chat.id && handleDeleteChat(chat.id);
                    }}
                    disabled={deletingChatId === chat.id}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
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
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{bot?.name}</h1>
                {bot?.description && (
                  <p className="text-sm text-gray-500">{bot.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
                  disabled={sharing}
                >
                  {sharing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600" />
                  ) : (
                    <ShareIcon className="h-4 w-4" />
                  )}
                  {shareSuccess ? 'Copied!' : 'Share'}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back to Dashboard
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
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto pt-20 pb-24">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        !message.isBot ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-sm md:max-w-lg p-4 rounded-lg ${
                          !message.isBot
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="max-w-sm md:max-w-lg p-4 rounded-lg bg-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t">
              <div className="max-w-3xl mx-auto p-4">
                <form onSubmit={handleSubmit} className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-w-0 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-offset-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    {sending ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
