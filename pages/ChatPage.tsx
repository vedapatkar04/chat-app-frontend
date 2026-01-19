import React, { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socket';
import { EChatType, IDashboardItem, IMessage, ISocketResponse, IUser } from '../types';
import { getAuth } from '../services/api';

interface ChatPageProps {
  onOpenSettings: () => void;
  onLogout: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ onOpenSettings, onLogout }) => {
  const [dashboard, setDashboard] = useState<IDashboardItem[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<IDashboardItem | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  
  // Modal states
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Group creation state
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const fetchDashboard = useCallback((callback?: (items: IDashboardItem[]) => void) => {
    socketService.emit<ISocketResponse<IDashboardItem[]>>('dashBoard', {}, (res) => {
      const items = res.response || [];
      setDashboard(items);
      if (callback) callback(items);
    });
  }, []);

  const fetchUsers = useCallback(() => {
    socketService.emit<ISocketResponse<IUser[]>>('userList', {}, (res) => {
      setUsers(res.response || []);
    });
  }, []);

  const fetchMessages = useCallback((chat: IDashboardItem) => {
    // Backend: group = 1, personal = 2
    const payload = chat.type === EChatType.group 
      ? { channelId: chat.channelId, type: 1 }
      : { userId: chat.userId, type: 2 };
    
    socketService.emit<ISocketResponse<IMessage[]>>('chat', payload, (res) => {
      if (res && res.response) {
        setMessages(res.response || []);
      } else {
        setMessages([]);
      }
    });
  }, []);

  useEffect(() => {
    socketService.connect();
    fetchDashboard();
    fetchUsers();

    socketService.on('newMessage', (msg: IMessage) => {
      // Real-time update
      setMessages((prev) => [...prev, msg]);
      fetchDashboard();
    });

    socketService.on('groupCreated', () => {
      fetchDashboard();
    });

    return () => {
      socketService.disconnect();
    };
  }, [fetchDashboard, fetchUsers]);

  const handleSelectChat = (chat: IDashboardItem) => {
    setSelectedChat(chat);
    fetchMessages(chat);
    // Requirement: Typing bar must be devoid of any message when changing chat
    setMessageInput('');
    setShowPersonalModal(false);
    setShowGroupModal(false);
  };

  const handleStartPersonalChat = (user: IUser) => {
    const existing = dashboard.find(d => d.type === EChatType.personal && d.userId === user._id);
    
    if (existing) {
      handleSelectChat(existing);
    } else {
      // Create virtual chat item to allow sending the first message
      const virtualChat: IDashboardItem = {
        chatId: `temp-${user._id}`,
        type: EChatType.personal,
        name: user.name || user.userName,
        userId: user._id
      };
      handleSelectChat(virtualChat);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !messageInput.trim()) return;

    const { userId: myId } = getAuth();
    if (!myId) return;

    // Requirement: Call "message" emit in personal chat just like group chat
    // Based on backend rootSocket.ts logic
    const payload = {
      userId: selectedChat.type === EChatType.personal ? (selectedChat.userId || '') : myId,
      type: selectedChat.type, // 1 for Group, 2 for Personal
      channelId: selectedChat.channelId,
      message: messageInput
    };

//     const payload = {
//   userId: myId, // ✅ ALWAYS sender ID
//   type: selectedChat.type, // 1 = group, 2 = personal
//   channelId: selectedChat.type === EChatType.group ? selectedChat.channelId : undefined,
//   receiverId: selectedChat.type === EChatType.personal ? selectedChat.userId : undefined,
//   message: messageInput
// };


    socketService.emit<ISocketResponse<IMessage>>('message', payload, (res) => {
      // Trust backend response completely
      if (res && res.response) {
        setMessages((prev) => [...prev, res.response]);
      }
      
      // Clear input bar
      setMessageInput('');
      
      // Refresh dashboard to swap temp ID for real ID if necessary
      fetchDashboard((items) => {
        if (selectedChat.chatId.startsWith('temp-')) {
          const realChat = items.find(d => d.type === EChatType.personal && d.userId === selectedChat.userId);
          if (realChat) setSelectedChat(realChat);
        }
      });
    });
  };

  const handleCreateGroup = () => {
    if (!newGroupName || selectedParticipants.length === 0) return;

    const participants = selectedParticipants.map(id => {
      const u = users.find(user => user._id === id);
      return { userId: id, userName: u?.userName || '' };
    });

    socketService.emit<ISocketResponse<any>>('createGroup', {
      channelName: newGroupName,
      participants
    }, (res) => {
      setNewGroupName('');
      setSelectedParticipants([]);
      setShowGroupModal(false);
      
      // Refresh and redirect to new group
      fetchDashboard((items) => {
        const newGroup = items.find(d => d.type === EChatType.group && d.channelId === res.response?._id);
        if (newGroup) handleSelectChat(newGroup);
      });
    });
  };

  const personalChats = dashboard.filter(c => c.type === EChatType.personal);
  const groupChats = dashboard.filter(c => c.type === EChatType.group);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/50 backdrop-blur-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
          <h2 className="text-xl font-black tracking-tighter">DARKCHAT</h2>
          <button onClick={onOpenSettings} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="py-6 px-4">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Direct Messages</h3>
              <button 
                onClick={() => { setShowPersonalModal(true); setShowGroupModal(false); fetchUsers(); }} 
                className="w-6 h-6 flex items-center justify-center bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </div>
            <div className="space-y-1">
              {personalChats.map(chat => (
                <button
                  key={chat.chatId}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full flex items-center p-3 rounded-xl transition-all ${selectedChat?.chatId === chat.chatId ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm mr-3 uppercase">
                    {chat.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm truncate">{chat.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="py-4 px-4">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Groups</h3>
              <button 
                onClick={() => { setShowGroupModal(true); setShowPersonalModal(false); fetchUsers(); }} 
                className="w-6 h-6 flex items-center justify-center bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </div>
            <div className="space-y-1">
              {groupChats.map(chat => (
                <button
                  key={chat.chatId}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full flex items-center p-3 rounded-xl transition-all ${selectedChat?.chatId === chat.chatId ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm mr-3">
                    #
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm truncate">{chat.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-red-600 text-white transition-all font-bold text-xs uppercase tracking-widest">
                Logout
            </button>
        </div>
      </div>

      {/* Main Window */}
      <div className="flex-1 flex flex-col relative bg-slate-950">
        
        {/* Modals */}
        {showPersonalModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-tight">Direct Connection</h3>
                <button onClick={() => setShowPersonalModal(false)} className="text-slate-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
                {users.map(u => {
                  const { userId: myId } = getAuth();
                  if (u._id === myId) return null;
                  return (
                    <button key={u._id} onClick={() => handleStartPersonalChat(u)} className="w-full flex items-center p-4 hover:bg-slate-800 rounded-2xl transition-all text-left group">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold mr-4 border border-slate-700 group-hover:border-blue-500 transition-colors uppercase">{u.userName.charAt(0)}</div>
                      <div>
                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{u.userName}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showGroupModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-tight text-emerald-500">New Group</h3>
                <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-8 space-y-6">
                <input placeholder="Group Name" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white font-bold" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-800/30 rounded-xl p-3 border border-slate-800 custom-scrollbar">
                  {users.map(u => (
                    <label key={u._id} className="flex items-center gap-4 p-3 hover:bg-slate-700/50 rounded-xl cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-emerald-600" checked={selectedParticipants.includes(u._id)} onChange={(e) => {
                        if (e.target.checked) setSelectedParticipants([...selectedParticipants, u._id]);
                        else setSelectedParticipants(selectedParticipants.filter(id => id !== u._id));
                      }} />
                      <span className="text-sm font-bold text-slate-300">{u.userName}</span>
                    </label>
                  ))}
                </div>
                <button onClick={handleCreateGroup} disabled={!newGroupName || selectedParticipants.length === 0} className="w-full bg-emerald-600 py-4 rounded-xl font-black text-white hover:bg-emerald-500 disabled:opacity-50 transition-all active:scale-95">START ENCRYPTED GROUP</button>
              </div>
            </div>
          </div>
        )}

        {selectedChat ? (
          <>
            <div className="h-24 border-b border-slate-800 flex items-center px-10 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-lg shadow-inner uppercase">
                  {selectedChat.type === EChatType.group ? '#' : selectedChat.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{selectedChat.name}</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                    {selectedChat.type === EChatType.group ? 'Secure Channel' : 'Active Connection'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 uppercase tracking-[0.2em] text-[10px] font-black opacity-40">
                  Ready for secure data stream
                </div>
              )}
              {messages.map((msg, i) => {
                const { userId: myId } = getAuth();
                const isMine = msg.senderName === 'You' || (users.find(u => u.userName === msg.senderName)?._id === myId);
                
                return (
                  <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className="max-w-[75%] group">
                      {!isMine && <div className="text-[9px] font-black text-slate-600 mb-2 ml-1 uppercase tracking-widest">{msg.senderName}</div>}
                      <div className={`rounded-3xl px-6 py-4 shadow-2xl transition-all ${isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 border border-slate-700/50 rounded-tl-none hover:bg-slate-700'}`}>
                        <p className="leading-relaxed font-medium text-[15px]">{msg.message}</p>
                        <div className={`text-[8px] mt-2 font-black uppercase tracking-tighter text-right ${isMine ? 'text-blue-200/50' : 'text-slate-500'}`}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-8 bg-slate-900/40 backdrop-blur-md border-t border-slate-800">
              <form onSubmit={handleSendMessage} className="flex gap-5 max-w-5xl mx-auto">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Secure message to ${selectedChat.name}...`}
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl px-7 py-5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-medium shadow-inner transition-all placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="bg-blue-600 hover:bg-blue-500 px-8 rounded-2xl transition-all shadow-xl shadow-blue-600/30 active:scale-90 disabled:opacity-50"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-800 p-10 text-center uppercase tracking-[0.4em] font-black text-[10px] opacity-40">
            Select a terminal to begin
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;