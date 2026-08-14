import React, { useState } from 'react';
import { 
  registerWithUsername, 
  loginWithUsername, 
  signInWithGoogle, 
  normalizeUsername, 
  validateUsername 
} from '../lib/firebase';
import { UserProfile } from '../types';
import { 
  Shield, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  User, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Zap, 
  Layers, 
  Check, 
  Fingerprint
} from 'lucide-react';
import { soundEffects } from '../lib/notifications';

interface AuthScreenProps {
  onSuccess: (user: UserProfile) => void;
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onContinueAsGuest }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Registration & Login Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanUsername = normalizeUsername(username);
  const systemEmailPreview = cleanUsername ? `${cleanUsername}@limone.my.id` : 'username@limone.my.id';

  const handleGoogleSignIn = async () => {
    soundEffects.playClickPop();
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onSuccess(user);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setError(err.message || 'Google sign-in gagal. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClickPop();
    setError(null);

    const userValidation = validateUsername(username);
    if (!userValidation.isValid) {
      setError(userValidation.error || 'Username tidak valid.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Silakan masukkan Nama lengkap/tampilan Anda.');
        return;
      }

      if (!password) {
        setError('Silakan masukkan Password.');
        return;
      }

      if (password.length < 6) {
        setError('Password minimal harus 6 karakter.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Password dan Konfirmasi Password tidak sama.');
        return;
      }

      setLoading(true);
      try {
        const user = await registerWithUsername(cleanUsername, password, name.trim());
        onSuccess(user);
      } catch (err: any) {
        console.error('Registration Error:', err);
        let msg = err.message || 'Pendaftaran akun gagal.';
        if (err.code === 'auth/email-already-in-use') {
          msg = `Username "${cleanUsername}" (@limone.my.id) sudah terdaftar. Silakan login atau pilih username lain.`;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // Login Mode
      if (!password) {
        setError('Silakan masukkan Password.');
        return;
      }

      setLoading(true);
      try {
        const user = await loginWithUsername(cleanUsername, password);
        onSuccess(user);
      } catch (err: any) {
        console.error('Login Error:', err);
        let msg = err.message || 'Login gagal.';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Username (@limone.my.id) atau Password salah.';
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-neutral-200 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-between relative overflow-x-hidden selection:bg-neutral-800 selection:text-white">
      {/* Background Ambient Monochrome Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-neutral-800/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-neutral-700/10 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-3.5 sm:py-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#111111] border border-neutral-800 p-1.5 flex items-center justify-center shadow-lg shadow-black/60">
            <img src="/logo.svg" alt="LemAI Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-white tracking-tight">LemAI</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                1.0 Flash
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono hidden sm:block">
              Limone Teams • Black Intelligence OS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Limone Server: Online</span>
          </div>

          {onContinueAsGuest && (
            <button
              onClick={() => {
                soundEffects.playClickPop();
                onContinueAsGuest();
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition duration-150 active:scale-95"
            >
              Mode Tamu
            </button>
          )}
        </div>
      </header>

      {/* DYNAMIC VIEWPORT CONTAINER */}
      {/* On Desktop (lg+): Centered, max-width 6xl container with side-by-side showcase & form */}
      {/* On Mobile (<lg): Full-height, full-width mobile layout with natural touch padding */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
        <div className="w-full max-w-md lg:max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          
          {/* ================= DESKTOP SHOWCASE (Visible on lg+) ================= */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-300 w-fit shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
              <span>Black Intelligence Workspace</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                Kecerdasan AI Modern untuk Developer & Kreator.
              </h1>
              <p className="text-sm xl:text-base text-neutral-400 leading-relaxed font-normal">
                Satu platform terpadu dengan model <strong>LemAI 1.0 Flash</strong> berkecepatan tinggi buatan <strong>Limone Teams</strong>, live code execution sandbox, dan akun aman bersandi domain <span className="font-mono text-neutral-200">@limone.my.id</span>.
              </p>
            </div>

            {/* Interactive Terminal Feature Box */}
            <div className="rounded-2xl bg-[#0d0d0d] border border-neutral-800/90 p-4 shadow-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] text-neutral-400 ml-1">lemai-core.ts</span>
                </div>
                <span className="text-[10px] text-neutral-500">Limone Teams Engine</span>
              </div>

              <div className="space-y-1 text-neutral-300">
                <div className="text-neutral-500">// Initialize LemAI 1.0 Flash runtime</div>
                <div><span className="text-purple-400">const</span> client = <span className="text-blue-400">new</span> LemAIClient({'{'}</div>
                <div className="pl-4">endpoint: <span className="text-emerald-400">"api.mayzaa.my.id"</span>,</div>
                <div className="pl-4">creator: <span className="text-emerald-400">"Limone Teams"</span>,</div>
                <div className="pl-4">domain: <span className="text-emerald-400">"@limone.my.id"</span>,</div>
                <div className="pl-4">streaming: <span className="text-amber-400">true</span></div>
                <div>{'}'});</div>
              </div>

              <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> Ready for deployment
                </span>
                <span>Latency: ~16ms</span>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 flex flex-col gap-1">
                <Zap className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white">Super Cepat</span>
                <span className="text-[10px] text-neutral-400">LemAI 1.0 Flash</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 flex flex-col gap-1">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white">Akun Aman</span>
                <span className="text-[10px] text-neutral-400">Domain Limone</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 flex flex-col gap-1">
                <Layers className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white">Multi Sandbox</span>
                <span className="text-[10px] text-neutral-400">Live Preview</span>
              </div>
            </div>
          </div>

          {/* ================= AUTHENTICATION FORM (Mobile Full-Height/Full-Width + Desktop Centered Card) ================= */}
          <div className="w-full lg:col-span-6 flex justify-center">
            <div className="w-full bg-[#0e0e0e] border border-neutral-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl relative backdrop-blur-xl transition-all">
              
              {/* Mobile-only Branding Header */}
              <div className="lg:hidden text-center mb-5 sm:mb-6">
                <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#141414] border border-neutral-800 shadow-inner mb-2.5">
                  <img src="/logo.svg" alt="LemAI" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">LemAI Workspace</h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">Limone Teams • Black Intelligence</p>
              </div>

              {/* Segmented Mode Switcher */}
              <div className="p-1 rounded-xl bg-[#141414] border border-neutral-800/90 flex items-center mb-5 sm:mb-6">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClickPop();
                    setMode('login');
                    setError(null);
                  }}
                  className={`flex-1 py-2.5 sm:py-2 rounded-lg text-xs font-semibold font-mono transition-all duration-200 ${
                    mode === 'login'
                      ? 'bg-white text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Masuk (Login)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClickPop();
                    setMode('register');
                    setError(null);
                  }}
                  className={`flex-1 py-2.5 sm:py-2 rounded-lg text-xs font-semibold font-mono transition-all duration-200 ${
                    mode === 'register'
                      ? 'bg-white text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Daftar (Sign Up)
                </button>
              </div>

              {/* Error Message Box */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/30 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Google SSO Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 font-medium text-xs sm:text-sm transition-all duration-200 shadow-sm hover:border-neutral-700 disabled:opacity-50 group active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z" />
                </svg>
                <span>Lanjut dengan Akun Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-4 sm:my-5 flex items-center justify-center">
                <div className="border-t border-neutral-800 w-full" />
                <span className="bg-[#0e0e0e] px-2.5 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  atau Akun Limone
                </span>
                <div className="border-t border-neutral-800 w-full" />
              </div>

              {/* Form Body */}
              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                {mode === 'register' ? (
                  <>
                    {/* 1. Username Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider font-mono">
                          Username
                        </label>
                        <span className="text-[10px] text-neutral-500 font-mono">auto @limone.my.id</span>
                      </div>
                      <div className="relative flex rounded-xl bg-[#141414] border border-neutral-800 focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                        <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-neutral-500">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="misal: alex_dev"
                          required
                          autoCapitalize="none"
                          autoCorrect="off"
                          className="flex-1 bg-transparent py-3 sm:py-2.5 text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none font-mono min-w-0"
                        />
                        <div className="px-2.5 sm:px-3 bg-neutral-900 border-l border-neutral-800 flex items-center text-[11px] sm:text-xs text-neutral-400 font-mono select-none">
                          @limone.my.id
                        </div>
                      </div>
                      {cleanUsername && (
                        <div className="mt-1 text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-neutral-500" />
                          <span>Akun login Anda: <strong className="text-neutral-200">{systemEmailPreview}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* 2. Full Name Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1 font-mono">
                        Name (Nama Lengkap / Tampilan)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                          <Fingerprint className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="misal: Alex Rivera"
                          required
                          className="w-full bg-[#141414] border border-neutral-800 rounded-xl pl-10 pr-4 py-3 sm:py-2.5 text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* 3. Password Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1 font-mono">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          required
                          className="w-full bg-[#141414] border border-neutral-800 rounded-xl pl-10 pr-10 py-3 sm:py-2.5 text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 4. Confirm Password Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1 font-mono">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi password"
                          required
                          className="w-full bg-[#141414] border border-neutral-800 rounded-xl pl-10 pr-10 py-3 sm:py-2.5 text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Login Username */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider font-mono">
                          Username
                        </label>
                        <span className="text-[10px] text-neutral-500 font-mono">@limone.my.id</span>
                      </div>
                      <div className="relative flex rounded-xl bg-[#141414] border border-neutral-800 focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                        <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-neutral-500">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="username Anda"
                          required
                          autoCapitalize="none"
                          autoCorrect="off"
                          className="flex-1 bg-transparent py-3 sm:py-2.5 text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none font-mono min-w-0"
                        />
                        <div className="px-2.5 sm:px-3 bg-neutral-900 border-l border-neutral-800 flex items-center text-[11px] sm:text-xs text-neutral-400 font-mono select-none">
                          @limone.my.id
                        </div>
                      </div>
                    </div>

                    {/* Login Password */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1 font-mono">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          className="w-full bg-[#141414] border border-neutral-800 rounded-xl pl-10 pr-10 py-3 sm:py-2.5 text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 sm:py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="animate-pulse">Menghubungkan ke LemAI...</span>
                  ) : mode === 'register' ? (
                    <>
                      <span>Buat Akun @limone.my.id</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Quick Toggle */}
              <div className="mt-5 text-center text-xs text-neutral-400">
                {mode === 'login' ? (
                  <p>
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClickPop();
                        setMode('register');
                        setError(null);
                      }}
                      className="text-white font-semibold underline underline-offset-4 hover:text-neutral-300 transition-colors"
                    >
                      Daftar Baru
                    </button>
                  </p>
                ) : (
                  <p>
                    Sudah memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClickPop();
                        setMode('login');
                        setError(null);
                      }}
                      className="text-white font-semibold underline underline-offset-4 hover:text-neutral-300 transition-colors"
                    >
                      Masuk sekarang
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Copyright */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 text-center text-[11px] text-neutral-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-neutral-900/60 flex-shrink-0">
        <span>© 2026 Limone Teams • LemAI Operating System</span>
        <div className="flex items-center gap-4 text-neutral-400">
          <span>Multi-Platform Desktop & Mobile Ready</span>
          <span>•</span>
          <span>Security Sandbox v2.4</span>
        </div>
      </footer>
    </div>
  );
};

