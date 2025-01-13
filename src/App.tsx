import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateBot from './pages/CreateBot';
import EditBot from './pages/EditBot';
import ChatInterface from './pages/ChatInterface';
import TestChatInterface from './pages/TestChatInterface';
import ShareRedirect from './pages/ShareRedirect';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <nav className="bg-white dark:bg-gray-800 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center">
                      <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
                        BitBots
                      </Link>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                      <Link
                        to="/dashboard"
                        className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/create-bot"
                        className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                      >
                        Create Bot
                      </Link>
                      <Link
                        to="/test-chat"
                        className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                      >
                        Test Chat
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </nav>
            <Routes>
              <Route path="/login" element={
                <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
                  <Login />
                </div>
              } />
              <Route path="/signup" element={
                <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
                  <Signup />
                </div>
              } />
              <Route path="/share/:botId" element={<ShareRedirect />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <div className="flex flex-col h-screen">
                      <Navigation />
                      <main className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <div className="container mx-auto max-w-7xl h-full">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/create-bot" element={<CreateBot />} />
                            <Route path="/edit-bot/:botId" element={<EditBot />} />
                            <Route path="/chat/:botId" element={<ChatInterface />} />
                            <Route path="/test-chat" element={<TestChatInterface />} />
                          </Routes>
                        </div>
                      </main>
                    </div>
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
