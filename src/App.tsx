import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateBot from './pages/CreateBot';
import ChatInterface from './pages/ChatInterface';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="h-screen flex flex-col">
          <Routes>
            <Route path="/login" element={
              <div className="flex min-h-screen items-center justify-center">
                <Login />
              </div>
            } />
            <Route path="/signup" element={
              <div className="flex min-h-screen items-center justify-center">
                <Signup />
              </div>
            } />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <div className="flex flex-col h-screen">
                    <Navigation />
                    <main className="flex-1 overflow-hidden bg-gray-100">
                      <div className="container mx-auto max-w-7xl h-full">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/create-bot" element={<CreateBot />} />
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
    </Router>
  );
}

export default App;
