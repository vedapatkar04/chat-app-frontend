
import React, { useState } from 'react';
import { api, setAuth } from '../services/api';

interface LoginProps {
  onLoginSuccess: () => void;
  onNavigateRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The backend destructures userName, email, and password, 
    // but primarily uses email for the database lookup.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }
    
    const res = await api.post('/user/login', { email, password });
    const { userId, authToken, email: userEmail } = res.data.responseMsg;
    setAuth(userId, authToken, userEmail);
    onLoginSuccess();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Please enter your details to sign in.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 tracking-wide">Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all placeholder:text-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 tracking-wide">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all placeholder:text-slate-600"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-slate-400 text-sm">
            New to the platform?{' '}
            <button 
              onClick={onNavigateRegister} 
              className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
