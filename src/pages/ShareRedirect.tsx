import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ShareRedirect() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (botId) {
      if (currentUser) {
        // If user is logged in, redirect to create bot page with shared bot ID
        navigate(`/create-bot?sharedBot=${botId}`);
      } else {
        // If user is not logged in, store the bot ID and redirect to login
        sessionStorage.setItem('pendingSharedBot', botId);
        navigate('/login');
      }
    } else {
      // If no bot ID, redirect to home
      navigate('/');
    }
  }, [botId, currentUser, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
