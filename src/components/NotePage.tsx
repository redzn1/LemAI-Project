import React from 'react';
import { 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  Terminal, 
  Cpu, 
  Mic, 
  FolderTree, 
  Layers, 
  Coins, 
  Globe, 
  CheckCircle2,
  Calendar,
  ExternalLink,
  Code2
} from 'lucide-react';

interface NotePageProps {
  onBackToApp: () => void;
}

export const NotePage: React.FC<NotePageProps> = ({ onBackToApp }) => {
  return (
    <div className="min-h-screen bg-[#070707] text-neutral-200 selection:bg-neutral-800 font-sans overflow-y-auto">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#0c0c0c]/80 backdrop-blur-xl border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Workspace</span>
          </button>

          <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 flex items-center justify-center">
              <img src="/logo.svg" alt="LemAI" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight">LemAI System Notes</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/70 text-emerald-300 font-medium">
            Production v2.5 Stable
          </span>
        </div>
      </header>

      {/* Hero Header */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        
        {/* Letter of Gratitude from Limone Teams */}
        <section className="relative rounded-3xl bg-[#0f0f0f] border border-neutral-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300">
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <span>Pesan Resmi Pengembang</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Terima Kasih Telah Menggunakan & Mendukung LemAI
            </h1>

            <div className="prose prose-invert max-w-none text-neutral-300 text-sm sm:text-base leading-relaxed space-y-4 font-sans">
              <p>
                Halo semuanya, dari lubuk hati kami yang paling dalam, kami mengucapkan <strong>terima kasih yang sebesar-besarnya</strong> kepada seluruh pengguna, pengembang, peneliti, dan komunitas yang telah mempercayai platform <strong>LemAI</strong> sebagai asisten kecerdasan buatan, coding sandbox, dan rekan riset harian Anda.
              </p>
              <p>
                Platform ini dibangun dengan komitmen tinggi untuk menghadirkan pengalaman AI yang cepat, tanggap, aman, dan tanpa hambatan. Dari arsitektur perutean <em>GET-first engine</em> berkecepatan tinggi, sistem speech-to-text interaktif, integrasi folder-based coding environment, hingga kuota mingguan yang adil dan transparan—semua dirancang khusus untuk kenyamanan Anda.
              </p>
              <p>
                Kami akan terus berinovasi dan menyempurnakan setiap modul dalam ekosistem LemAI. Masukan dan saran Anda adalah bahan bakar utama evolusi platform ini.
              </p>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-neutral-800/80 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs font-mono text-neutral-400">Salam hormat & dedikasi,</div>
                <div className="text-lg font-bold text-white tracking-wide mt-0.5">
                  Limone Teams
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  Engineering, Design & AI Research Division
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified by Limone Core</span>
              </div>
            </div>
          </div>
        </section>

        {/* System Changelog & Version History */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Changelog & Pembaruan Sistem
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-mono mt-1">
                Catatan rilis lengkap dan peningkatan fitur di seluruh ekosistem LemAI
              </p>
            </div>
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Version 2.5 (Current Release) */}
            <div className="rounded-2xl bg-[#111111] border border-neutral-800 p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-neutral-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-white font-mono">v2.5.0</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold uppercase">
                    Rilis Terbaru
                  </span>
                </div>
                <span className="text-xs font-mono text-neutral-400">Agustus 2026</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-red-400" />
                    <span>Voice-to-Text (Speech Recognition)</span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed font-sans">
                    Tombol mikrofon terintegrasi di samping tombol kirim untuk merekam suara secara langsung menggunakan Web Speech API browser (ID/EN) dan memasukkannya ke kolom prompt.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit & Salin Pesan Otomatis</span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed font-sans">
                    Dukungan salin pesan satu-klik dan fitur edit pesan terkirim yang langsung mengulang dan memperbarui respon jawaban AI secara otomatis.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <FolderTree className="w-3.5 h-3.5 text-blue-400" />
                    <span>Coding IDE: File & Folder Tree</span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed font-sans">
                    Kemudahan membuat folder, menambah file, mengganti nama (rename), dan menghapus file/folder dalam sandbox live preview.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    <span>GET-First API Routing & Pro Pipeline</span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed font-sans">
                    Seluruh model (Flash-Lite & 1.0 Flash) berjalan optimal via GET API Mayzaa routing, dengan fallback terisolasi untuk Pro model via POST SDK.
                  </p>
                </div>
              </div>
            </div>

            {/* Version 2.4 */}
            <div className="rounded-2xl bg-[#111111] border border-neutral-800 p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-neutral-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-white font-mono">v2.4.0</span>
                  <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-mono">
                    Token & Multi-Session
                  </span>
                </div>
                <span className="text-xs font-mono text-neutral-400">Juli 2026</span>
              </div>

              <ul className="space-y-2 text-xs text-neutral-300 font-sans">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Pin & Rename Chat Sessions:</strong> Kemampuan menyematkan riwayat chat penting di bagian atas dan mengganti nama percakapan secara fleksibel.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>500K Weekly Token Quota Engine:</strong> Kuota token mingguan transparan dengan siklus reset 7 hari otomatis dan Admin Control Panel khusus pengembang.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Modern Loading Screen:</strong> Layar loading modern dengan animasi logo Limone, particle aura, dan trigger replay di pengaturan.</span>
                </li>
              </ul>
            </div>

            {/* Version 2.0 */}
            <div className="rounded-2xl bg-[#111111] border border-neutral-800 p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-neutral-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-white font-mono">v2.0.0</span>
                  <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-mono">
                    Major Architecture
                  </span>
                </div>
                <span className="text-xs font-mono text-neutral-400">Juni 2026</span>
              </div>

              <ul className="space-y-2 text-xs text-neutral-300 font-sans">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Live URL Scraping & Browsing:</strong> LemAI dapat membaca, mengekstrak, dan menganalisis konten tautan web publik secara langsung.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Module System Tray:</strong> Antarmuka cepat untuk Image Studio, Video Concepts, Deep Rezearch, dan Coding Canvas.</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* Footer info */}
        <footer className="text-center pt-8 border-t border-neutral-800 text-xs font-mono text-neutral-500 space-y-2">
          <p>© {new Date().getFullYear()} LemAI by Limone Teams. All rights reserved.</p>
          <p className="text-[11px] text-neutral-600">Built with precision, Black Intelligence, and scalable sandboxed architectures.</p>
        </footer>

      </main>
    </div>
  );
};
