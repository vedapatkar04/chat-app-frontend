
import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatPage from './pages/ChatPage';
import Settings from './pages/Settings';
import { getAuth } from './services/api';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'chat' | 'settings'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const { authToken } = getAuth();
    if (authToken) {
      setIsAuthenticated(true);
      setCurrentPage('chat');
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('chat');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  if (currentPage === 'register') {
    return <Register onNavigate={() => setCurrentPage('login')} />;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} onNavigateRegister={() => setCurrentPage('register')} />;
  }

  if (currentPage === 'settings') {
    return (
      <Settings 
        onBack={() => setCurrentPage('chat')} 
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <ChatPage 
      onOpenSettings={() => setCurrentPage('settings')} 
      onLogout={handleLogout}
    />
  );
};

export default App;
