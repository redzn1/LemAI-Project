import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserCheck, 
  UserX, 
  Coins, 
  Plus, 
  Minus, 
  RotateCcw, 
  Check, 
  X, 
  AlertCircle, 
  Search, 
  Sliders, 
  Users, 
  Sparkles,
  Lock,
  ArrowRight,
  RefreshCw,
  Zap,
  Crown
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { 
  adminAddToken, 
  adminReduceToken, 
  adminSetToken, 
  adminRemoveToken, 
  adminSetAdminRole, 
  adminRemoveAdminRole, 
  getAllRegisteredUsers,
  formatTokenDisplay,
  UserTokenRecord,
  DEVELOPER_EMAIL
} from '../lib/tokenManager';
import { soundEffects } from '../lib/notifications';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onRefreshUser?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRefreshUser,
}) => {
  const callerRole: UserRole = currentUser?.role || 'user';
  const isDeveloper = callerRole === 'developer';

  const [activeTab, setActiveTab] = useState<'tokens' | 'roles' | 'users'>('tokens');
  
  // Form states
  const [targetEmail, setTargetEmail] = useState('');
  const [tokenAmount, setTokenAmount] = useState<number>(50000);
  const [actionType, setActionType] = useState<'add' | 'reduce' | 'set' | 'remove'>('add');

  // Role Form state
  const [roleTargetEmail, setRoleTargetEmail] = useState('');

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [usersList, setUsersList] = useState<UserTokenRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load all registered users
  const refreshUsers = () => {
    const list = getAllRegisteredUsers();
    setUsersList(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshUsers();
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTokenAction = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClickPop();
    setStatusMessage(null);

    if (!targetEmail.trim()) {
      setStatusMessage({ type: 'error', text: 'Email atau username user target wajib diisi.' });
      return;
    }

    let result;
    const cleanEmail = targetEmail.trim();

    if (actionType === 'add') {
      result = adminAddToken(cleanEmail, tokenAmount, callerRole);
    } else if (actionType === 'reduce') {
      result = adminReduceToken(cleanEmail, tokenAmount, callerRole);
    } else if (actionType === 'set') {
      result = adminSetToken(cleanEmail, tokenAmount, callerRole);
    } else if (actionType === 'remove') {
      result = adminRemoveToken(cleanEmail, callerRole);
    }

    if (result) {
      setStatusMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
      refreshUsers();
      if (onRefreshUser) onRefreshUser();
    }
  };

  const handleRoleAction = (type: 'set-admin' | 'remove-admin') => {
    soundEffects.playClickPop();
    setStatusMessage(null);

    if (!isDeveloper) {
      setStatusMessage({
        type: 'error',
        text: 'Akses Ditolak: Hanya akun Developer (developer@limone.my.id) yang dapat mengubah role Admin.',
      });
      return;
    }

    if (!roleTargetEmail.trim()) {
      setStatusMessage({ type: 'error', text: 'Email user target wajib diisi.' });
      return;
    }

    const cleanEmail = roleTargetEmail.trim();
    let result;

    if (type === 'set-admin') {
      result = adminSetAdminRole(cleanEmail, callerRole);
    } else {
      result = adminRemoveAdminRole(cleanEmail, callerRole);
    }

    if (result) {
      setStatusMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
      refreshUsers();
      if (onRefreshUser) onRefreshUser();
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.role.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
      <div 
        className="w-full max-w-3xl max-h-[90vh] bg-[#0c0c0c] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800/80 bg-[#111111] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shadow-inner">
              {isDeveloper ? <Crown className="w-5 h-5 text-amber-400" /> : <Shield className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">LemAI Admin Control Panel</h2>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                  isDeveloper 
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/80' 
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                }`}>
                  {isDeveloper ? 'ROOT DEVELOPER' : 'SYSTEM ADMIN'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Kelola kuota token mingguan, hak akses Admin, dan audit user terdaftar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-neutral-800 flex items-center gap-2 bg-[#0e0e0e]">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClickPop();
              setActiveTab('tokens');
            }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'tokens'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Token Management</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClickPop();
              setActiveTab('roles');
            }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Role Permissions</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClickPop();
              setActiveTab('users');
              refreshUsers();
            }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({usersList.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 font-mono animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-300'
                : 'bg-red-950/40 border border-red-800/80 text-red-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: TOKEN MANAGEMENT */}
          {activeTab === 'tokens' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#121212] border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                  <span className="text-xs font-mono font-semibold uppercase text-neutral-400">
                    Aksi Token Akun User
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    Kalkulasi: 5 karakter per 2 token
                  </span>
                </div>

                <form onSubmit={handleTokenAction} className="space-y-4">
                  {/* Target Email Input */}
                  <div>
                    <label className="block text-xs text-neutral-400 font-mono mb-1.5">
                      Email Akun Target (contoh: user@limone.my.id)
                    </label>
                    <input
                      type="text"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="Masukkan email user atau username..."
                      className="w-full bg-[#161616] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 font-mono"
                    />
                  </div>

                  {/* Action Selector */}
                  <div>
                    <label className="block text-xs text-neutral-400 font-mono mb-1.5">
                      Tipe Aksi Token
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClickPop();
                          setActionType('add');
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          actionType === 'add'
                            ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Token</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClickPop();
                          setActionType('reduce');
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          actionType === 'reduce'
                            ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                        <span>Reduce Token</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClickPop();
                          setActionType('set');
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          actionType === 'set'
                            ? 'bg-blue-950/60 border-blue-700 text-blue-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Set Token</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClickPop();
                          setActionType('remove');
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          actionType === 'remove'
                            ? 'bg-red-950/60 border-red-700 text-red-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Remove/Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Amount Input (hidden for remove action) */}
                  {actionType !== 'remove' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-neutral-400 font-mono">
                          Jumlah Token
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[10000, 50000, 100000, 500000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setTokenAmount(amt)}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition"
                            >
                              +{amt / 1000}K
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#161616] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 font-mono"
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    <span>Eksekusi Operasi Token</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: ROLE PERMISSIONS (Set Admin & Remove Admin) */}
          {activeTab === 'roles' && (
            <div className="space-y-5">
              {!isDeveloper && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-3">
                  <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block mb-0.5">Hak Istimewa Developer Utama</span>
                    <span>
                      Hanya akun Developer (<strong>{DEVELOPER_EMAIL}</strong>) yang berhak untuk menetapkan atau mencabut status Admin pengguna lain.
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-[#121212] border border-neutral-800 space-y-4">
                <div className="border-b border-neutral-800/80 pb-3">
                  <span className="text-xs font-mono font-semibold uppercase text-neutral-400">
                    Otorisasi Hak Akses Admin
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 font-mono mb-1.5">
                    Email Akun Target (contoh: user@limone.my.id)
                  </label>
                  <input
                    type="text"
                    value={roleTargetEmail}
                    onChange={(e) => setRoleTargetEmail(e.target.value)}
                    placeholder="Masukkan email user yang ingin diatur role-nya..."
                    className="w-full bg-[#161616] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={!isDeveloper}
                    onClick={() => handleRoleAction('set-admin')}
                    className="py-3 px-4 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Set Admin</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isDeveloper}
                    onClick={() => handleRoleAction('remove-admin')}
                    className="py-3 px-4 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/80 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Remove Admin</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari email, username, atau role..."
                    className="w-full bg-[#141414] border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={refreshUsers}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
                  title="Muat ulang daftar"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Users Table */}
              <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-[#111111]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#161616] border-b border-neutral-800 text-neutral-400">
                    <tr>
                      <th className="p-3">User & Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Sisa Token</th>
                      <th className="p-3 text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-neutral-500 font-mono">
                          Belum ada user yang terdaftar atau sesuai pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((userRecord) => (
                        <tr key={userRecord.email} className="hover:bg-neutral-900/60 transition">
                          <td className="p-3">
                            <div className="font-semibold text-white truncate max-w-[180px]">
                              {userRecord.email}
                            </div>
                            <span className="text-[10px] text-neutral-500 font-sans">
                              @{userRecord.username}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                              userRecord.role === 'developer'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                                : userRecord.role === 'admin'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                            }`}>
                              {userRecord.role}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-white">
                            {formatTokenDisplay(userRecord.tokensRemaining)}
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetEmail(userRecord.email);
                                setActionType('add');
                                setActiveTab('tokens');
                              }}
                              className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition"
                              title="Tambah token"
                            >
                              + Token
                            </button>
                            {isDeveloper && userRecord.role !== 'developer' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRoleTargetEmail(userRecord.email);
                                  setActiveTab('roles');
                                }}
                                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition"
                                title="Kelola Admin"
                              >
                                Role
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800/80 bg-[#111111] flex items-center justify-between text-xs font-mono text-neutral-500">
          <span>LemAI Black Intelligence OS • Role Security Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
