import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function CreateBot() {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sharedBotId = searchParams.get('sharedBot');

  useEffect(() => {
    async function loadSharedBot() {
      if (!sharedBotId) return;

      try {
        setLoading(true);
        const botDoc = await getDoc(doc(db, 'bots', sharedBotId));
        
        if (botDoc.exists()) {
          const botData = botDoc.data();
          setName(`${botData.name} (Copy)`);
          setSystemPrompt(botData.systemPrompt);
        }
      } catch (err) {
        console.error('Error loading shared bot:', err);
        setError('Failed to load shared bot details');
      } finally {
        setLoading(false);
      }
    }

    loadSharedBot();
  }, [sharedBotId]);

  useEffect(() => {
    if (!currentUser) {
      // Store the shared bot ID in session storage before redirecting
      if (sharedBotId) {
        sessionStorage.setItem('pendingSharedBot', sharedBotId);
      }
      navigate('/login');
    } else if (sessionStorage.getItem('pendingSharedBot')) {
      // If we have a pending shared bot after login, redirect to create with the ID
      const pendingBotId = sessionStorage.getItem('pendingSharedBot');
      sessionStorage.removeItem('pendingSharedBot');
      navigate(`/create-bot?sharedBot=${pendingBotId}`);
    }
  }, [currentUser, navigate, sharedBotId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!currentUser) {
      setError('You must be logged in to create a bot');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const botsRef = collection(db, 'bots');
      await addDoc(botsRef, {
        name,
        systemPrompt,
        userId: currentUser.uid,
        createdAt: new Date(),
      });

      navigate('/');
    } catch (err) {
      setError('Failed to create bot');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Bot</h2>
          
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
                className="input-field mt-1"
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
                className="input-field mt-1"
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
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Create Bot'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
