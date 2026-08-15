import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  User, 
  Sliders, 
  ShieldCheck, 
  Code, 
  Cpu, 
  Check, 
  LogOut,
  Camera,
  Upload,
  Trash2,
  Sparkles,
  Save,
  AtSign,
  Coins,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Shield
} from 'lucide-react';
import { UserProfile } from '../types';
import { LEMAI_MODELS } from '../api/api';
import { updateUserProfileData } from '../lib/firebase';
import { soundEffects } from '../lib/notifications';
import { 
  getUserTokenRecord, 
  formatTokenDisplay, 
  getTokenStatus, 
  regenerateUserAccessToken 
} from '../lib/tokenManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogout: () => void;
  defaultModelId: string;
  onSelectDefaultModel: (id: string) => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onShowLoadingScreen?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  defaultModelId,
  onSelectDefaultModel,
  onUpdateUser,
  onShowLoadingScreen,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'tokens' | 'models' | 'editor' | 'security'>('profile');
  const [autoPreview, setAutoPreview] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);

  // Profile Edit State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Token Tab State
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [userAccessToken, setUserAccessToken] = useState('');
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const userEmail = user?.email || 'guest@limone.my.id';
  const tokenRecord = getUserTokenRecord(userEmail, user?.username);
  const tokenStatus = getTokenStatus(userEmail);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username || '');
      setBio(user.bio || '');
      setPhotoURL(user.photoURL || '');
      setUserAccessToken(tokenRecord.accessToken || user.accessToken || 'lemai_user_token');
    }
  }, [user]);

  if (!isOpen) return null;

  const handleCopyToken = () => {
    soundEffects.playClickPop();
    navigator.clipboard.writeText(userAccessToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const handleRegenerateToken = () => {
    soundEffects.playClickPop();
    if (!confirm('Apakah Anda yakin ingin membuat ulang Access Token ini? Token lama tidak akan berfungsi lagi.')) {
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
        onUpdateUser({
          ...updated,
          accessToken: userAccessToken,
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save Profile Error:', err);
      setProfileError(err.message || 'Gagal menyimpan profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-2xl bg-[#0f0f0f] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white">LemAI Preferences & Profil</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-full sm:w-48 bg-[#0b0b0b] border-r border-neutral-800 p-2 sm:p-3 space-y-1 flex sm:flex-col overflow-x-auto sm:overflow-visible">
            {[
              { id: 'profile', name: 'Profil Akun', icon: User },
              { id: 'tokens', name: 'Tokens & Quota', icon: Coins },
              { id: 'models', name: 'AI Models', icon: Cpu },
              { id: 'editor', name: 'Code & Editor', icon: Code },
              { id: 'security', name: 'Security & Auth', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#0f0f0f] text-neutral-200">
            {/* TAB: PROFILE & AKUN */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Pengaturan Profil Pengguna</h3>
                  <p className="text-xs text-neutral-400">Kelola foto avatar, nama tampilan, dan bio pengembang Anda</p>
                </div>

                {profileError && (
                  <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl">
                    {profileError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Profil berhasil diperbarui dan diterapkan langsung!</span>
                  </div>
                )}

                {/* Profile Picture Upload Section */}
                <div className="p-4 bg-[#141414] border border-neutral-800 rounded-xl space-y-3">
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
                    Foto Profil (Avatar)
                  </label>
                  
                  <div className="flex items-center gap-4">
                    {/* Avatar Preview */}
                    <div className="relative w-16 h-16 rounded-2xl bg-neutral-800 border-2 border-neutral-700 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg group">
                      {photoURL ? (
                        <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-neutral-300">
                          {(displayName?.[0] || user?.username?.[0] || 'L').toUpperCase()}
                        </span>
                      )}

                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        title="Ubah Foto"
                      >
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-1.5 flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5 border border-neutral-700"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Gambar</span>
                        </button>
                        {photoURL && (
                          <button
                            type="button"
                            onClick={() => setPhotoURL('')}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition"
                            title="Hapus Foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500">Mendukung PNG, JPG, WebP. Maksimal 2MB.</p>
                    </div>
                  </div>
                </div>

                {/* Display Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-neutral-400">
                    Nama Tampilan (Display Name)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nama Lengkap atau Panggilan Anda"
                    className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition"
                  />
                </div>

                {/* Bio Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-neutral-400">
                    Bio / Status Singkat
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    placeholder="Tulis bio singkat profil Anda..."
                    className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition resize-none"
                  />
                </div>

                {/* Submit & Logout */}
                <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-semibold rounded-xl transition flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar / Sign Out</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: TOKENS & QUOTA */}
            {activeTab === 'tokens' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">LemAI Access Token & Kuota</h3>
                  <p className="text-xs text-neutral-400">Token akses otomatis untuk autentikasi sistem dan monitoring saldo AI</p>
                </div>

                {/* Access Token Card */}
                <div className="p-4 bg-[#141414] border border-neutral-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold uppercase text-neutral-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      LemAI Personal Access Token
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                      Auto-Generated
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-[#0c0c0c] border border-neutral-800 rounded-xl p-2 font-mono text-xs">
                    <div className="flex-1 px-2 py-1 text-emerald-400 truncate select-all">
                      {showAccessToken ? userAccessToken : '••••••••••••••••••••'}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                      title={showAccessToken ? 'Sembunyikan' : 'Tampilkan Token'}
                    >
                      {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyToken}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition flex items-center gap-1.5 text-xs font-semibold"
                    >
                      {tokenCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{tokenCopied ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                    <span>Format: <code className="text-neutral-300 bg-neutral-900 px-1 rounded">lemai_(10 angka dan huruf)</code></span>
                    <button
                      type="button"
                      onClick={handleRegenerateToken}
                      disabled={isRegeneratingToken}
                      className="text-neutral-400 hover:text-amber-300 transition flex items-center gap-1 font-mono"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRegeneratingToken ? 'animate-spin' : ''}`} />
                      <span>Generate Ulang Token</span>
                    </button>
                  </div>
                </div>

                {/* Quota Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-[#141414] border border-neutral-800 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                      <span>Saldo Token</span>
                      <Coins className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl font-bold text-white font-mono">
                      {formatTokenDisplay(tokenStatus.tokensRemaining)}
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Batas Mingguan: {formatTokenDisplay(tokenStatus.tokensLimit)}
                    </p>
                  </div>

                  <div className="p-4 bg-[#141414] border border-neutral-800 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                      <span>Reset Siklus</span>
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

                {/* Token Rules Info */}
                <div className="p-3.5 bg-[#121212] border border-neutral-800 rounded-xl space-y-1.5 text-xs text-neutral-400">
                  <div className="font-semibold text-neutral-300 flex items-center gap-1.5 font-mono">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Aturan Penggunaan Token LemAI
                  </div>
                  <ul className="space-y-1 text-[11px] text-neutral-400 list-disc list-inside">
                    <li>Kalkulasi penggunaan: 5 karakter = 2 token.</li>
                    <li>Akun Developer memiliki hak akses kuota Unlimited (∞).</li>
                    <li>Developer/Admin dapat menambahkan atau memotong token akun di Admin Control Panel.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB: MODELS */}
            {activeTab === 'models' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Active Model Architecture</h3>
                  <p className="text-xs text-neutral-400">Configure default intelligence engine for new chats and coding</p>
                </div>

                {profileError && (
                  <div className="p-3 bg-amber-950/40 border border-amber-800 text-amber-300 text-xs rounded-xl animate-in fade-in">
                    {profileError}
                  </div>
                )}

                <div className="space-y-2.5">
                  {Object.values(LEMAI_MODELS).map((m) => {
                    const isUnavailable = m.id === 'lemai-1.1-pro' || m.enabled === false || m.isAvailable === false;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isUnavailable) {
                            soundEffects.playClickPop();
                            setProfileError('Model Belum Tersedia!');
                            setTimeout(() => setProfileError(null), 2800);
                            return;
                          }
                          setProfileError(null);
                          onSelectDefaultModel(m.id);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition ${
                          defaultModelId === m.id
                            ? 'bg-neutral-800/90 border-neutral-600 text-white'
                            : isUnavailable
                            ? 'bg-[#141414]/70 border-neutral-800/80 text-neutral-500 opacity-75 hover:border-neutral-700'
                            : 'bg-[#141414] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white">{m.name}</span>
                            {isUnavailable && (
                              <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded font-mono">
                                Belum Tersedia
                              </span>
                            )}
                          </div>
                          {defaultModelId === m.id && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <p className="text-[11px] text-neutral-400">{m.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: EDITOR */}
            {activeTab === 'editor' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Code & Sandboxing Options</h3>
                  <p className="text-xs text-neutral-400">Customize code editor behaviors</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-[#141414] border border-neutral-800 rounded-xl cursor-pointer">
                    <span className="text-xs text-neutral-300">Live Web Preview for HTML/CSS/JS</span>
                    <input
                      type="checkbox"
                      checked={autoPreview}
                      onChange={(e) => setAutoPreview(e.target.checked)}
                      className="rounded accent-white"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-[#141414] border border-neutral-800 rounded-xl cursor-pointer">
                    <span className="text-xs text-neutral-300">Show line numbers in code blocks</span>
                    <input
                      type="checkbox"
                      checked={lineNumbers}
                      onChange={(e) => setLineNumbers(e.target.checked)}
                      className="rounded accent-white"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-4 text-xs leading-relaxed text-neutral-400">
                <h3 className="text-sm font-semibold text-white">Security & Sandboxing</h3>
                <p>
                  LemAI executes web programming code inside fully sandboxed `iframe` environments. Generated code does not have access to Firebase authentication tokens, cookies, parent DOM elements, or AI provider credentials.
                </p>
                <div className="p-3 bg-[#121212] border border-neutral-800 rounded-xl font-mono text-[11px] text-neutral-300 space-y-1">
                  <div>• Server-side API Proxy: Active (Limone Teams)</div>
                  <div>• LemAI 1.0 Flash Endpoint: api.mayzaa.my.id</div>
                  <div>• Client API Key Isolation: Strict</div>
                  <div>• Sandbox Restrictions: `allow-scripts allow-forms`</div>
                </div>

                {onShowLoadingScreen && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onShowLoadingScreen();
                      }}
                      className="px-4 py-2 bg-[#181818] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-medium transition flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Replay LemAI Modern Loading Screen</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
