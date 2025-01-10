import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function EditBot() {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { botId } = useParams();

  useEffect(() => {
    async function loadBot() {
      if (!botId || !currentUser) return;

      try {
        const botDoc = await getDoc(doc(db, 'bots', botId));
        if (botDoc.exists()) {
          const botData = botDoc.data();
          if (botData.userId !== currentUser.uid) {
            setError('You do not have permission to edit this bot');
            return;
          }
          setName(botData.name);
          setSystemPrompt(botData.systemPrompt);
        } else {
          setError('Bot not found');
        }
      } catch (err) {
        console.error('Error loading bot:', err);
        setError('Failed to load bot');
      } finally {
        setLoading(false);
      }
    }

    loadBot();
  }, [botId, currentUser]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!currentUser || !botId) {
      setError('You must be logged in to edit a bot');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const botRef = doc(db, 'bots', botId);
      await updateDoc(botRef, {
        name,
        systemPrompt,
        updatedAt: new Date(),
      });

      navigate('/');
    } catch (err) {
      setError('Failed to update bot');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading bot details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Bot</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Bot Name
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Bot"
              />
            </div>

            <div>
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700">
                System Prompt
              </label>
              <textarea
                id="systemPrompt"
                required
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant that..."
              />
              <p className="mt-2 text-sm text-gray-500">
                This is the initial prompt that defines your bot's personality and capabilities.
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
