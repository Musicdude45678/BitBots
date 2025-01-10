import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, PencilIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { deleteBot, updateBot } from '../services/chatService';
import { shareBot } from '../utils/sharing';

interface Bot {
  id: string;
  name: string;
  systemPrompt: string;
  description: string;
  createdAt: Date;
}

export default function Dashboard() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);
  const [sharingBotId, setSharingBotId] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBots() {
      if (!currentUser) return;

      try {
        const botsRef = collection(db, 'bots');
        const q = query(botsRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedBots: Bot[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedBots.push({
            id: doc.id,
            name: data.name,
            systemPrompt: data.systemPrompt,
            description: data.description,
            createdAt: data.createdAt.toDate(),
          });
        });

        setBots(fetchedBots);
      } catch (error) {
        console.error('Error fetching bots:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBots();
  }, [currentUser]);

  const handleShare = async (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    setSharingBotId(botId);
    
    const result = await shareBot({
      botId,
      name: bot?.name,
      description: bot?.description
    });

    if (result.copied) {
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
        setSharingBotId(null);
      }, 2000);
    } else {
      setSharingBotId(null);
    }
  };

  return (
    <div className="w-full min-h-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">My Bots</h1>
            <p className="mt-2 text-sm text-gray-500">
              Create and manage your AI bots
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => navigate('/create-bot')}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Create Bot
            </button>
          </div>
        </div>

        {/* Bot Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading your bots...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bots.map((bot) => (
                <div
                  key={bot.id}
                  className="relative group bg-white p-5 sm:p-6 rounded-lg shadow-sm ring-1 ring-gray-200 hover:ring-blue-400 transform transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex space-x-1 sm:space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit-bot/${bot.id}`);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
                      title="Edit Bot"
                    >
                      <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(bot.id);
                      }}
                      disabled={sharingBotId === bot.id}
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded-full hover:bg-green-50 disabled:opacity-50"
                      title="Share Bot"
                    >
                      {sharingBotId === bot.id ? (
                        shareSuccess ? (
                          <span className="text-green-600 text-sm">Copied!</span>
                        ) : (
                          <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-b-2 border-green-600" />
                        )
                      ) : (
                        <ShareIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this bot? This will delete all associated chats.')) {
                          setDeletingBotId(bot.id);
                          deleteBot(bot.id)
                            .then(() => {
                              setBots((prev) => prev.filter((b) => b.id !== bot.id));
                            })
                            .catch((error) => {
                              console.error('Error deleting bot:', error);
                              alert('Failed to delete bot. Please try again.');
                            })
                            .finally(() => {
                              setDeletingBotId(null);
                            });
                        }
                      }}
                      disabled={deletingBotId === bot.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 disabled:opacity-50"
                      title="Delete Bot"
                    >
                      {deletingBotId === bot.id ? (
                        <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-b-2 border-red-600" />
                      ) : (
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>

                  <div 
                    onClick={() => navigate(`/chat/${bot.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="block focus:outline-none">
                        <p className="text-sm font-medium text-gray-900 truncate">{bot.name}</p>
                        <p className="text-sm text-gray-500 line-clamp-2 h-10">
                          {bot.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="text-gray-500">
                        Created {bot.createdAt.toLocaleDateString()}
                      </div>
                      <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Open Chat →
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {bots.length === 0 && (
                <div className="col-span-full">
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 sm:p-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No bots</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new bot.</p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => navigate('/create-bot')}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Create Bot
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
