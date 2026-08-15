import React, { useState, useEffect, useRef } from 'react';
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
  Crown,
  Copy,
  Key,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { 
  adminAddTokenByToken, 
  adminReduceTokenByToken, 
  adminSetTokenByToken, 
  adminRemoveTokenByToken, 
  adminSetAdminRoleByToken, 
  adminRemoveAdminRoleByToken,
  adminSetDevRoleByToken,
  adminRemoveDevRoleByToken,
  getAllRegisteredUsers,
  formatTokenDisplay,
  findUserByTokenOrEmail,
  UserTokenRecord,
  DEVELOPER_EMAIL
} from '../lib/tokenManager';
import { soundEffects } from '../lib/notifications';
import { ScrollControls } from './ScrollControls';

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
  const modalBodyRef = useRef<HTMLDivElement>(null);
  
  // Target Access Token states
  const [targetToken, setTargetToken] = useState('');
  const [tokenAmount, setTokenAmount] = useState<number>(50000);
  const [actionType, setActionType] = useState<'add' | 'reduce' | 'set' | 'remove'>('add');

  // Role Form Token state
  const [roleTargetToken, setRoleTargetToken] = useState('');

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [usersList, setUsersList] = useState<UserTokenRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Load all registered users
  const refreshUsers = () => {
    const list = getAllRegisteredUsers();
    setUsersList(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshUsers();
      setStatusMessage(null);
      if (!isDeveloper && activeTab === 'roles') {
        setActiveTab('tokens');
      }
    }
  }, [isOpen, isDeveloper]);

  if (!isOpen) return null;

  const handleCopyToken = (tok: string) => {
    soundEffects.playClickPop();
    navigator.clipboard.writeText(tok);
    setCopiedToken(tok);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleTokenAction = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClickPop();
    setStatusMessage(null);

    if (!targetToken.trim()) {
      setStatusMessage({ type: 'error', text: 'Token Akses target (lemai_...) atau email wajib diisi.' });
      return;
    }

    let result;
    const cleanTarget = targetToken.trim();

    if (actionType === 'add') {
      result = adminAddTokenByToken(cleanTarget, tokenAmount, callerRole);
    } else if (actionType === 'reduce') {
      result = adminReduceTokenByToken(cleanTarget, tokenAmount, callerRole);
    } else if (actionType === 'set') {
      result = adminSetTokenByToken(cleanTarget, tokenAmount, callerRole);
    } else if (actionType === 'remove') {
      result = adminRemoveTokenByToken(cleanTarget, callerRole);
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

  const handleRoleAction = (type: 'set-dev' | 'remove-dev' | 'set-admin' | 'remove-admin') => {
    soundEffects.playClickPop();
    setStatusMessage(null);

    if (!isDeveloper) {
      setStatusMessage({
        type: 'error',
        text: 'Akses Ditolak: Hanya akun Developer yang berhak mengakses dan mengubah Role Permission.',
      });
      return;
    }

    if (!roleTargetToken.trim()) {
      setStatusMessage({ type: 'error', text: 'Token Akses user target (lemai_...) wajib diisi.' });
      return;
    }

    const cleanTarget = roleTargetToken.trim();
    let result;

    if (type === 'set-dev') {
      result = adminSetDevRoleByToken(cleanTarget, callerRole);
    } else if (type === 'remove-dev') {
      result = adminRemoveDevRoleByToken(cleanTarget, callerRole);
    } else if (type === 'set-admin') {
      result = adminSetAdminRoleByToken(cleanTarget, callerRole);
    } else if (type === 'remove-admin') {
      result = adminRemoveAdminRoleByToken(cleanTarget, callerRole);
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
    return (
      u.accessToken.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.includes(q)
    );
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
                <h2 className="text-lg font-bold text-white tracking-tight">LemAI Token & Role Management</h2>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                  isDeveloper 
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/80' 
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                }`}>
                  {isDeveloper ? 'ROOT DEVELOPER' : 'SYSTEM ADMIN'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Otorisasi peran dan kuota berbasis Access Token (lemai_XXXXXXXXXX)
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
        <div className="px-6 border-b border-neutral-800 flex items-center justify-between bg-[#0e0e0e]">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClickPop();
                setActiveTab('tokens');
              }}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'tokens'
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Token Operations</span>
            </button>

            {/* Role Permissions: ONLY visible for Developer */}
            {isDeveloper && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClickPop();
                  setActiveTab('roles');
                }}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'roles'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-neutral-400 hover:text-amber-300'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Role Permissions (Dev Only)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundEffects.playClickPop();
                setActiveTab('users');
                refreshUsers();
              }}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Tokens Directory ({usersList.length})</span>
            </button>
          </div>

          {/* Quick Scroll Up/Down Controls for Modal */}
          <ScrollControls containerRef={modalBodyRef} variant="inline" label />
        </div>

        {/* Content Body */}
        <div ref={modalBodyRef} className="flex-1 overflow-y-auto p-6 space-y-6 relative scroll-smooth">
          
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

          {/* TAB 1: TOKEN OPERATIONS */}
          {activeTab === 'tokens' && (
            <div className="space-y-5">
              {/* Token Selector Grid */}
              <div className="p-4 rounded-2xl bg-[#121212] border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-semibold uppercase text-neutral-200">
                      Daftar Token Pengguna Terdaftar ({usersList.length})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Klik token untuk memilih
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                  {usersList.map((u) => {
                    const isSelected = targetToken.toLowerCase() === u.accessToken.toLowerCase() || targetToken.toLowerCase() === u.email.toLowerCase();
                    return (
                      <div
                        key={u.email}
                        onClick={() => {
                          soundEffects.playClickPop();
                          setTargetToken(u.accessToken);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-neutral-800/90 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/50'
                            : 'bg-[#161616] border-neutral-800/80 hover:border-neutral-700 hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400 truncate">
                            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{u.accessToken}</span>
                          </div>
                          <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                            u.role === 'developer' ? 'bg-amber-950/60 text-amber-300 border-amber-800' :
                            u.role === 'admin' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' :
                            'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}>
                            {u.role}
                          </span>
                        </div>

                        <div className="text-[11px] text-neutral-300 font-medium truncate mb-1">
                          📧 {u.email} <span className="text-neutral-500">({u.provider || 'email'})</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-neutral-800/60">
                          <span>Saldo: <strong className="text-white">{formatTokenDisplay(u.tokensRemaining)}</strong></span>
                          {isSelected && (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Terpilih
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Action */}
              <div className="p-4 rounded-2xl bg-[#121212] border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                  <span className="text-xs font-mono font-semibold uppercase text-neutral-400">
                    Aksi Kuota Token Berdasarkan Access Token
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    Formula: 5 karakter = 2 token
                  </span>
                </div>

                <form onSubmit={handleTokenAction} className="space-y-4">
                  {/* Target Token Input */}
                  <div>
                    <label className="block text-xs text-neutral-400 font-mono mb-1.5">
                      Target Access Token (lemai_XXXXXXXXXX) atau Email
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        value={targetToken}
                        onChange={(e) => setTargetToken(e.target.value)}
                        placeholder="Masukkan Access Token (lemai_...) atau email target..."
                        className="w-full bg-[#161616] border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 font-mono"
                      />
                    </div>
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

                  {/* Amount Input */}
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

          {/* TAB 2: ROLE PERMISSIONS BY TOKEN (Developer Only) */}
          {activeTab === 'roles' && isDeveloper && (
            <div className="space-y-5">
              {/* Developer Privilege Banner */}
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block mb-0.5 text-amber-300">Otoritas Developer Mutlak</span>
                  <span className="text-amber-200/90 leading-relaxed font-mono">
                    Hanya akun dengan peran Developer yang dapat menambah atau mencabut role <strong>Developer</strong> dan <strong>Admin</strong>. Setiap Developer baru otomatis mendapatkan Token Unlimited (∞) & akses privat ke seluruh sistem.
                  </span>
                </div>
              </div>

              {/* Quick Select Token for Role */}
              <div className="p-4 rounded-2xl bg-[#121212] border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
                  <span className="text-xs font-mono font-semibold uppercase text-neutral-300">
                    Pilih Access Token untuk Mengubah Role
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {usersList.length} Akun Terdaftar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {usersList.map((u) => (
                    <div
                      key={u.email}
                      onClick={() => {
                        soundEffects.playClickPop();
                        setRoleTargetToken(u.accessToken);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between font-mono ${
                        roleTargetToken === u.accessToken
                          ? 'bg-neutral-800 border-amber-500/80 text-white shadow-md'
                          : 'bg-[#151515] border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold text-amber-400 truncate">{u.accessToken}</div>
                        <div className="text-[10px] text-neutral-500 truncate">{u.email}</div>
                      </div>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        u.role === 'developer' ? 'text-amber-400 bg-amber-950/60 border border-amber-800' :
                        u.role === 'admin' ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800' :
                        'text-neutral-500 bg-neutral-900 border border-neutral-800'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Action Card */}
              <div className="p-5 rounded-2xl bg-[#121212] border border-neutral-800 space-y-5">
                <div className="border-b border-neutral-800/80 pb-3">
                  <span className="text-xs font-mono font-semibold uppercase text-neutral-400">
                    Otorisasi Hak Akses Berbasis Access Token
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 font-mono mb-1.5">
                    Target Access Token (contoh: lemai_abc123xyz9) atau Email
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={roleTargetToken}
                      onChange={(e) => setRoleTargetToken(e.target.value)}
                      placeholder="Masukkan Access Token (lemai_...) target..."
                      className="w-full bg-[#161616] border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 font-mono"
                    />
                  </div>
                </div>

                {/* 1. DEVELOPER ROLE ACTIONS (Add Dev & Remove Dev) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-400">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Developer Permissions (Unlimited Token & Root Privilege)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleRoleAction('set-dev')}
                      className="py-3 px-4 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/80 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md active:scale-95"
                    >
                      <UserPlus className="w-4 h-4 text-amber-400" />
                      <span>Add Dev (Token)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleAction('remove-dev')}
                      className="py-3 px-4 rounded-xl bg-orange-950/50 hover:bg-orange-900/70 border border-orange-800/80 text-orange-300 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md active:scale-95"
                    >
                      <UserMinus className="w-4 h-4 text-orange-400" />
                      <span>Remove Dev (Token)</span>
                    </button>
                  </div>
                </div>

                {/* 2. ADMIN ROLE ACTIONS (Add Admin & Remove Admin) */}
                <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Permissions (Token Operations & Management)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleRoleAction('set-admin')}
                      className="py-3 px-4 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md active:scale-95"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Add Admin (Token)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleAction('remove-admin')}
                      className="py-3 px-4 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-800/80 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md active:scale-95"
                    >
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span>Remove Admin (Token)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USER & TOKEN DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari token lemai_..., email, username, role..."
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
                      <th className="p-3">Access Token (LemAI)</th>
                      <th className="p-3">User & Provider</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Sisa Token</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-neutral-500 font-mono">
                          Belum ada user yang terdaftar atau sesuai pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((userRecord) => (
                        <tr key={userRecord.email} className="hover:bg-neutral-900/60 transition">
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                              <span>{userRecord.accessToken}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyToken(userRecord.accessToken)}
                                className="p-1 hover:text-white text-neutral-500 rounded"
                                title="Salin Token"
                              >
                                {copiedToken === userRecord.accessToken ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-white truncate max-w-[160px]">
                              {userRecord.email}
                            </div>
                            <span className="text-[10px] text-neutral-500 font-sans">
                              @{userRecord.username} • {userRecord.provider || 'email'}
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
                                setTargetToken(userRecord.accessToken);
                                setActiveTab('tokens');
                                soundEffects.playClickPop();
                              }}
                              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] transition border border-neutral-700"
                            >
                              Pilih Token
                            </button>
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
      </div>
    </div>
  );
};
