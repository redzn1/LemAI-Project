import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  User, 
  Coins, 
  Cpu, 
  Sparkles, 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Copy, 
  Check, 
  LogOut, 
  Camera, 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Sliders, 
  MessageSquare, 
  Code, 
  BrainCircuit, 
  Layers, 
  Volume2, 
  VolumeX, 
  Info,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { UserProfile, LemAIModel } from '../types';
import { LEMAI_MODELS } from '../api/api';
import { soundEffects } from '../lib/notifications';
import { 
  getTokenStatus, 
  formatTokenDisplay, 
  getUserTokenRecord, 
  regenerateUserAccessToken,
  updateUserProfileData,
  getModuleModelSettings,
  saveModuleModelSettings,
  ModuleModelSettings
} from '../lib/tokenManager';

interface SettingsPageProps {
  user: UserProfile | null;
  onLogout: () => void;
  defaultModelId: string;
  onSelectDefaultModel: (modelId: string) => void;
  onUpdateUser?: (updated: UserProfile) => void;
  onBackToApp: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onLogout,
  defaultModelId,
  onSelectDefaultModel,
  onUpdateUser,
  onBackToApp,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'tokens' | 'models' | 'preferences'>('profile');
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [userAccessToken, setUserAccessToken] = useState('');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Module Routing Settings
  const [moduleSettings, setModuleSettings] = useState<ModuleModelSettings>({
    chatModel: 'lemai-1.0-flash',
    codingModel: 'lemai-1.0-flash',
    reasoningModel: 'gemini-2.5-pro',
    visionModel: 'lemai-1.0-flash',
    imageModel: 'imagen-3.0-generate-002',
    videoModel: 'veo-2.0-generate-001',
  });
  const [savingModuleSettings, setSavingModuleSettings] = useState(false);
  const [moduleSaveSuccess, setModuleSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userEmail = user?.email || 'guest@lemai.internal';
  const tokenStatus = getTokenStatus(userEmail);

  useEffect(() => {
    if (user) {
      const tokenRecord = getUserTokenRecord(user.email || '');
      setDisplayName(user.displayName || user.username || '');
      setBio(user.bio || '');
      setPhotoURL(user.photoURL || '');
      setUserAccessToken(tokenRecord.accessToken || user.accessToken || 'lemai_user_token');
    }
  }, [user]);

  useEffect(() => {
    getModuleModelSettings().then((res) => {
      setModuleSettings(res);
    });
  }, []);

  const handleUpdateModuleModel = (moduleKey: keyof ModuleModelSettings, modelVal: string) => {
    const updated = {
      ...moduleSettings,
      [moduleKey]: modelVal,
    };
    setModuleSettings(updated);
  };

  const handleSaveModuleSettings = async () => {
    soundEffects.playClickPop();
    setSavingModuleSettings(true);
    setModuleSaveSuccess(false);
    try {
      await saveModuleModelSettings(moduleSettings);
      setModuleSaveSuccess(true);
      setTimeout(() => setModuleSaveSuccess(false), 2500);
    } finally {
      setSavingModuleSettings(false);
    }
  };

  const handleCopyToken = () => {
    soundEffects.playClickPop();
    navigator.clipboard.writeText(userAccessToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const handleRegenerateToken = () => {
    soundEffects.playClickPop();
    if (!confirm('Buat ulang Access Token ini? Token lama tidak akan berfungsi lagi.')) {
      return;
    }
    setIsRegeneratingToken(true);
    try {
      const newToken = regenerateUserAccessToken(userEmail);
      setUserAccessToken(newToken);
      if (user && onUpdateUser) {
        onUpdateUser({
          ...user,
          accessToken: newToken,
        });
      }
    } finally {
      setTimeout(() => setIsRegeneratingToken(false), 400);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('File harus berupa gambar (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Ukuran gambar maksimal 2MB.');
      return;
    }

    setProfileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoURL(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setSaveSuccess(false);

    try {
      const updated = await updateUserProfileData({
        displayName: displayName.trim() || user?.username || 'Developer',
        bio: bio.trim(),
        photoURL: photoURL || undefined,
        username: user?.username,
      });

      if (onUpdateUser) {
        onUpdateUser(updated);
      }

      setSaveSuccess(true);
      soundEffects.playClickPop();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setProfileError(err.message || 'Gagal menyimpan profil');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#080808] text-[#eaeaea] overflow-y-auto flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overscroll-y-contain">
      {/* Top Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-neutral-800/90 bg-[#0c0c0c]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToApp}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Chat</span>
          </button>

          <div className="h-4 w-px bg-neutral-800"></div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white">
              <Settings className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Pengaturan Sistem
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                  /settings
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
            {userEmail}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40 rounded-xl transition text-xs font-semibold flex items-center gap-1.5"
            title="Keluar / Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-white text-black shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil Akun</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === 'tokens'
                ? 'bg-white text-black shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Token & Kuota</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === 'models'
                ? 'bg-white text-black shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Arsitektur Model & Modul</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === 'preferences'
                ? 'bg-white text-black shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Preferensi & Suara</span>
          </button>
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl animate-in fade-in duration-200">
            {profileError && (
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-xl">
                {profileError}
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profil akun berhasil diperbarui!</span>
              </div>
            )}

            {/* Avatar & Photo Upload */}
            <div className="flex items-center gap-4 p-4 bg-[#111111] border border-neutral-800 rounded-2xl">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center text-xl font-bold text-white shadow-md">
                  {photoURL ? (
                    <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                  title="Ganti Foto"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1">
                <h3 className="text-xs font-semibold text-white mb-1">Foto Profil Akun</h3>
                <p className="text-[11px] text-neutral-400 mb-2">Mendukung format PNG, JPG, WebP (Maks. 2MB)</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs text-white font-medium transition"
                  >
                    Unggah Gambar
                  </button>
                  {photoURL && (
                    <button
                      type="button"
                      onClick={() => setPhotoURL('')}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-red-400 rounded-xl text-xs transition"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Nama Tampilan (Display Name)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Masukkan nama lengkap / alias"
                  className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Bio / Deskripsi Singkat
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan peran, status, atau keahlian Anda..."
                  className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Alamat Email Akun
                </label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full bg-[#101010] border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-neutral-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Menyimpan...' : 'Simpan Profil Akun'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: TOKENS & QUOTA */}
        {activeTab === 'tokens' && (
          <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
            {/* Personal Access Token Card */}
            <div className="p-5 bg-[#111111] border border-neutral-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase text-neutral-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  LemAI Personal Access Token
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                  Active Token
                </span>
              </div>

              <div className="flex items-center gap-2 bg-[#0c0c0c] border border-neutral-800 rounded-xl p-2 font-mono text-xs">
                <div className="flex-1 px-2 py-1 text-emerald-400 truncate select-all">
                  {showAccessToken ? userAccessToken : '••••••••••••••••••••••••••••'}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAccessToken(!showAccessToken)}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                >
                  {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition flex items-center gap-1.5 text-xs font-semibold"
                >
                  {tokenCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{tokenCopied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                <span>Format: <code className="text-neutral-300 bg-neutral-900 px-1 rounded">lemai_(10 angka/huruf)</code></span>
                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  disabled={isRegeneratingToken}
                  className="text-neutral-400 hover:text-amber-300 transition flex items-center gap-1 font-mono text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingToken ? 'animate-spin' : ''}`} />
                  <span>Generate Ulang</span>
                </button>
              </div>
            </div>

            {/* Quota Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#111111] border border-neutral-800 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span>Saldo Token Anda</span>
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">
                  {formatTokenDisplay(tokenStatus.tokensRemaining)}
                </div>
                <p className="text-[11px] text-neutral-500 font-mono">
                  Role: <strong className="text-neutral-300 uppercase">{tokenStatus.role}</strong> (Batas: {formatTokenDisplay(tokenStatus.tokensLimit)})
                </p>
              </div>

              <div className="p-4 bg-[#111111] border border-neutral-800 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span>Reset Siklus Token</span>
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-sm font-bold text-emerald-300 font-mono">
                  {tokenStatus.daysUntilReset} Hari Lagi
                </div>
                <p className="text-[11px] text-neutral-500 font-mono">
                  Reset otomatis: {tokenStatus.nextResetDate}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MODELS & ROUTING */}
        {activeTab === 'models' && (
          <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
            {/* Global Default Model Selection */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
                Model AI Default
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(LEMAI_MODELS).map((m) => {
                  const isSelected = defaultModelId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => onSelectDefaultModel(m.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-neutral-800/90 border-white text-white shadow-lg'
                          : 'bg-[#111111] border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-white">{m.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2">{m.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module Specific Routing */}
            <div className="p-5 bg-[#111111] border border-neutral-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Module-Specific Routing Matrix
                  </h4>
                </div>
                {moduleSaveSuccess && (
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Tersimpan!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Chat Module */}
                <div className="p-3 bg-[#161616] border border-neutral-800 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5 font-bold">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    Chat Workspace Engine
                  </label>
                  <select
                    value={moduleSettings.chatModel}
                    onChange={(e) => handleUpdateModuleModel('chatModel', e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  >
                    <option value="lemai-1.0-flash">LemAI 1.0 Flash (Default)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  </select>
                </div>

                {/* Coding Module */}
                <div className="p-3 bg-[#161616] border border-neutral-800 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5 font-bold">
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    Coding IDE Engine
                  </label>
                  <select
                    value={moduleSettings.codingModel}
                    onChange={(e) => handleUpdateModuleModel('codingModel', e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  >
                    <option value="lemai-1.0-flash">LemAI 1.0 Flash</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  </select>
                </div>

                {/* Reasoning Module */}
                <div className="p-3 bg-[#161616] border border-neutral-800 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5 font-bold">
                    <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                    Deep Research Engine
                  </label>
                  <select
                    value={moduleSettings.reasoningModel}
                    onChange={(e) => handleUpdateModuleModel('reasoningModel', e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  >
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Thinking)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="lemai-1.0-flash">LemAI 1.0 Flash</option>
                  </select>
                </div>

                {/* Vision Module */}
                <div className="p-3 bg-[#161616] border border-neutral-800 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5 font-bold">
                    <Layers className="w-3.5 h-3.5 text-pink-400" />
                    Vision Multimodal Engine
                  </label>
                  <select
                    value={moduleSettings.visionModel}
                    onChange={(e) => handleUpdateModuleModel('visionModel', e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  >
                    <option value="lemai-1.0-flash">LemAI 1.0 Flash</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveModuleSettings}
                  disabled={savingModuleSettings}
                  className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingModuleSettings ? 'Menyimpan...' : 'Simpan Konfigurasi Routing'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 max-w-2xl animate-in fade-in duration-200">
            <div className="p-4 bg-[#111111] border border-neutral-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neutral-800 text-amber-400">
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Efek Suara Sistem (Audio Feedback)</h3>
                  <p className="text-[11px] text-neutral-400">Suara klik pop tactile saat mengirim dan bernavigasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClickPop();
                  setSoundEnabled(!soundEnabled);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  soundEnabled ? 'bg-white' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${
                    soundEnabled ? 'translate-x-6 bg-black' : 'translate-x-0 bg-neutral-400'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
