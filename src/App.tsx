import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import ShareRedirect from './pages/ShareRedirect';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
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
