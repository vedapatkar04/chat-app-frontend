import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socket';
import { getAuth, clearAuth } from '../services/api';
import { ISocketResponse } from '../types';

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack, onLogout }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    socketService.connect();
    // No longer displaying email here based on request
  }, []);

  const handleUpdate = () => {
    socketService.emit<ISocketResponse<string>>('updateProfile', { name }, (res) => {
      // Logic depends on successful updateProfile acknowledgment
      if (res && res.success === 200) {
        onBack(); // Go back after successful update
      }
    });
  };

  const handleLogoutClick = () => {
    socketService.emit('logOut', {}, () => {
      clearAuth();
      socketService.disconnect();
      onLogout();
    });
  };

  const handleDeleteAccount = () => {
    socketService.emit('deleteProfile', {}, () => {
      clearAuth();
      socketService.disconnect();
      onLogout();
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="p-8 space-y-10">
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Update Profile</h3>
                </div>
                
                <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Display Name</label>
                    <div className="flex gap-3">
                      <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white shadow-inner transition-all"
                          placeholder="Your full name"
                      />
                      <button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-500 px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-sm">
                          Save
                      </button>
                    </div>
                </div>
            </div>

            <div className="pt-10 border-t border-slate-800 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-red-500/80">Account Management</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={handleLogoutClick} className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-4 rounded-xl font-bold transition-all border border-slate-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Log Out
                    </button>
                    <button onClick={handleDeleteAccount} className="flex items-center justify-center gap-3 bg-red-950/20 hover:bg-red-600 text-red-500 hover:text-white px-6 py-4 rounded-xl font-bold transition-all border border-red-900/30">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;