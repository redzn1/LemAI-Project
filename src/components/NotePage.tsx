import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  Cpu, 
  Mic, 
  FolderTree, 
  Calendar, 
  Edit3, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Layers, 
  Image as ImageIcon,
  Video as VideoIcon,
  Search,
  Code2,
  AlertCircle
} from 'lucide-react';
import { ScrollControls } from './ScrollControls';

interface NotePageProps {
  onBackToApp: () => void;
}

interface ChangelogItem {
  id: string;
  title: string;
  description: string;
  iconType: 'mic' | 'sparkles' | 'tree' | 'cpu' | 'check' | 'image' | 'video' | 'search' | 'code';
}

interface VersionChangelog {
  id: string;
  version: string;
  releaseBadge: string;
  date: string;
  isLatest?: boolean;
  items: ChangelogItem[];
}

interface GratitudeLetter {
  badge: string;
  title: string;
  paragraphs: string[];
  signatureName: string;
  signatureDept: string;
  verifiedBadge: string;
}

const DEFAULT_GRATITUDE: GratitudeLetter = {
  badge: 'Pesan Resmi Pengembang',
  title: 'Terima Kasih Telah Menggunakan & Mendukung LemAI',
  paragraphs: [
    'Halo semuanya, dari lubuk hati kami yang paling dalam, kami mengucapkan terima kasih yang sebesar-besarnya kepada seluruh pengguna, pengembang, peneliti, dan komunitas yang telah mempercayai platform LemAI sebagai asisten kecerdasan buatan, coding sandbox, dan rekan riset harian Anda.',
    'Platform ini dibangun dengan komitmen tinggi untuk menghadirkan pengalaman AI yang cepat, tanggap, aman, dan tanpa hambatan. Dari arsitektur perutean GET-first engine berkecepatan tinggi, sistem speech-to-text interaktif, integrasi folder-based coding environment, hingga kuota mingguan yang adil dan transparan—semua dirancang khusus untuk kenyamanan Anda.',
    'Kami akan terus berinovasi dan menyempurnakan setiap modul dalam ekosistem LemAI. Masukan dan saran Anda adalah bahan bakar utama evolusi platform ini.'
  ],
  signatureName: 'Limone Teams',
  signatureDept: 'Engineering, Design & AI Research Division',
  verifiedBadge: 'Verified by Limone Core',
};

const DEFAULT_CHANGELOGS: VersionChangelog[] = [
  {
    id: 'ver-2-5',
    version: 'v2.5.0',
    releaseBadge: 'Rilis Terbaru',
    date: 'Agustus 2026',
    isLatest: true,
    items: [
      {
        id: 'item-1',
        title: 'Sistem Module Resmi (Gemini-Style Architecture)',
        description: 'Integrasi modul sistem fleksibel langsung di chat: Buat Gambar, Buat Video, Canvas Sandbox, dan Rezearch Grounding.',
        iconType: 'sparkles',
      },
      {
        id: 'item-2',
        title: 'Voice-to-Text (Speech Recognition)',
        description: 'Tombol mikrofon terintegrasi di samping tombol kirim untuk merekam suara secara langsung menggunakan Web Speech API browser (ID/EN).',
        iconType: 'mic',
      },
      {
        id: 'item-3',
        title: 'Edit & Salin Pesan Otomatis',
        description: 'Dukungan salin pesan satu-klik dan fitur edit pesan terkirim yang langsung mengulang dan memperbarui respon jawaban AI secara otomatis.',
        iconType: 'sparkles',
      },
      {
        id: 'item-4',
        title: 'Coding IDE: File & Folder Tree Management',
        description: 'Kemudahan membuat folder, menambah file, mengganti nama (rename), dan menghapus file/folder dalam sandbox live preview.',
        iconType: 'tree',
      },
      {
        id: 'item-5',
        title: 'GET-First API Routing & 100% Resilient Engine',
        description: 'Seluruh model (Flash-Lite & 1.0 Flash) berjalan optimal via GET API Mayzaa routing dengan failover otomatis tanpa error 404.',
        iconType: 'cpu',
      },
    ],
  },
  {
    id: 'ver-2-4',
    version: 'v2.4.0',
    releaseBadge: 'Token & Multi-Session',
    date: 'Juli 2026',
    items: [
      {
        id: 'item-24-1',
        title: 'Pin & Rename Chat Sessions',
        description: 'Kemampuan menyematkan riwayat chat penting di bagian atas dan mengganti nama percakapan secara fleksibel.',
        iconType: 'check',
      },
      {
        id: 'item-24-2',
        title: '500K Weekly Token Quota Engine',
        description: 'Kuota token mingguan transparan dengan siklus reset 7 hari otomatis dan Admin Control Panel khusus pengembang.',
        iconType: 'check',
      },
      {
        id: 'item-24-3',
        title: 'Modern Loading Screen & Audio Sound FX',
        description: 'Layar loading modern dengan animasi logo Limone, particle aura, dan kontrol efek suara interaktif.',
        iconType: 'check',
      },
    ],
  },
  {
    id: 'ver-2-0',
    version: 'v2.0.0',
    releaseBadge: 'Major Architecture',
    date: 'Juni 2026',
    items: [
      {
        id: 'item-20-1',
        title: 'Live URL Scraping & Browsing',
        description: 'LemAI dapat membaca, mengekstrak, dan menganalisis konten tautan web publik secara langsung.',
        iconType: 'check',
      },
      {
        id: 'item-20-2',
        title: 'Module System Tray',
        description: 'Antarmuka cepat untuk Image Studio, Video Concepts, Deep Rezearch, dan Coding Canvas.',
        iconType: 'check',
      },
    ],
  },
];

const STORAGE_KEY = 'lemai_notes_changelog_v2';

export const NotePage: React.FC<NotePageProps> = ({ onBackToApp }) => {
  // State for editable notes and changelogs
  const [gratitude, setGratitude] = useState<GratitudeLetter>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_gratitude`);
      return saved ? JSON.parse(saved) : DEFAULT_GRATITUDE;
    } catch {
      return DEFAULT_GRATITUDE;
    }
  });

  const [changelogs, setChangelogs] = useState<VersionChangelog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_changelogs`);
      return saved ? JSON.parse(saved) : DEFAULT_CHANGELOGS;
    } catch {
      return DEFAULT_CHANGELOGS;
    }
  });

  // Admin / Developer Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Temporary edit buffer when in edit mode
  const [draftGratitude, setDraftGratitude] = useState<GratitudeLetter>(gratitude);
  const [draftChangelogs, setDraftChangelogs] = useState<VersionChangelog[]>(changelogs);

  const handleStartEdit = () => {
    // Unlock directly or verify passcode
    setDraftGratitude(gratitude);
    setDraftChangelogs(changelogs);
    setIsEditMode(true);
  };

  const handleSaveAll = () => {
    setGratitude(draftGratitude);
    setChangelogs(draftChangelogs);
    try {
      localStorage.setItem(`${STORAGE_KEY}_gratitude`, JSON.stringify(draftGratitude));
      localStorage.setItem(`${STORAGE_KEY}_changelogs`, JSON.stringify(draftChangelogs));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
    setIsEditMode(false);
    setSaveToast('Perubahan Notes & Changelog berhasil disimpan!');
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan semua Notes & Changelog ke versi default awal?')) {
      setGratitude(DEFAULT_GRATITUDE);
      setChangelogs(DEFAULT_CHANGELOGS);
      setDraftGratitude(DEFAULT_GRATITUDE);
      setDraftChangelogs(DEFAULT_CHANGELOGS);
      localStorage.removeItem(`${STORAGE_KEY}_gratitude`);
      localStorage.removeItem(`${STORAGE_KEY}_changelogs`);
      setIsEditMode(false);
      setSaveToast('Notes & Changelog telah dikembalikan ke default.');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Changelog Management Helpers
  const handleAddNewVersion = () => {
    const newVer: VersionChangelog = {
      id: `ver-${Date.now()}`,
      version: `v2.${draftChangelogs.length + 5}.0`,
      releaseBadge: 'Pembaruan Baru',
      date: 'Agustus 2026',
      items: [
        {
          id: `item-${Date.now()}-1`,
          title: 'Fitur Pembaruan Sistem',
          description: 'Deskripsi fitur baru yang dirilis oleh tim pengembang Limone.',
          iconType: 'sparkles',
        },
      ],
    };
    setDraftChangelogs([newVer, ...draftChangelogs]);
  };

  const handleDeleteVersion = (verId: string) => {
    if (confirm('Hapus rilis versi changelog ini?')) {
      setDraftChangelogs(draftChangelogs.filter((v) => v.id !== verId));
    }
  };

  const handleAddItemToVersion = (verId: string) => {
    const newItem: ChangelogItem = {
      id: `item-${Date.now()}`,
      title: 'Peningkatan Fitur Baru',
      description: 'Detail optimasi dan peningkatan fungsionalitas sistem.',
      iconType: 'check',
    };
    setDraftChangelogs(
      draftChangelogs.map((v) =>
        v.id === verId ? { ...v, items: [...v.items, newItem] } : v
      )
    );
  };

  const handleDeleteItem = (verId: string, itemId: string) => {
    setDraftChangelogs(
      draftChangelogs.map((v) =>
        v.id === verId
          ? { ...v, items: v.items.filter((item) => item.id !== itemId) }
          : v
      )
    );
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'mic':
        return <Mic className="w-3.5 h-3.5 text-red-400" />;
      case 'sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case 'tree':
        return <FolderTree className="w-3.5 h-3.5 text-blue-400" />;
      case 'cpu':
        return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
      case 'video':
        return <VideoIcon className="w-3.5 h-3.5 text-pink-400" />;
      case 'search':
        return <Search className="w-3.5 h-3.5 text-cyan-400" />;
      case 'code':
        return <Code2 className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

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

        <div className="flex items-center gap-3">
          {/* Admin / Developer Edit Button */}
          {!isEditMode ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-200 hover:text-white transition shadow-sm"
              title="Edit Notes & Changelog (Developer / Admin)"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Notes (Admin/Dev)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs font-mono hover:bg-neutral-200 transition shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          )}

          <ScrollControls variant="inline" />

          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/70 text-emerald-300 font-medium">
            Production v2.5 Stable
          </span>
        </div>
      </header>

      {/* Floating Scroll Up/Down Controls */}
      <ScrollControls variant="floating" />

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-2xl bg-neutral-900 border border-emerald-500/50 text-emerald-400 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Check className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Developer Edit Banner */}
      {isEditMode && (
        <div className="bg-amber-950/40 border-b border-amber-800/50 px-4 sm:px-8 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-amber-300">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Mode Developer / Admin Aktif: Anda dapat mengedit pesan resmi, menambah versi, dan mengubah changelog di bawah ini.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddNewVersion}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-white border border-amber-700 transition"
            >
              <Plus className="w-3 h-3" />
              <span>+ Tambah Versi Baru</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        
        {/* Letter of Gratitude from Limone Teams */}
        <section className="relative rounded-3xl bg-[#0f0f0f] border border-neutral-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300">
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              {isEditMode ? (
                <input
                  type="text"
                  value={draftGratitude.badge}
                  onChange={(e) => setDraftGratitude({ ...draftGratitude, badge: e.target.value })}
                  className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                />
              ) : (
                <span>{gratitude.badge}</span>
              )}
            </div>

            {isEditMode ? (
              <input
                type="text"
                value={draftGratitude.title}
                onChange={(e) => setDraftGratitude({ ...draftGratitude, title: e.target.value })}
                className="w-full bg-[#181818] border border-neutral-700 rounded-xl px-3 py-2 text-xl sm:text-2xl font-bold text-white focus:outline-none"
              />
            ) : (
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                {gratitude.title}
              </h1>
            )}

            <div className="prose prose-invert max-w-none text-neutral-300 text-sm sm:text-base leading-relaxed space-y-4 font-sans">
              {isEditMode ? (
                <div className="space-y-3">
                  {draftGratitude.paragraphs.map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                        <span>Paragraf {idx + 1}</span>
                        {draftGratitude.paragraphs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newP = draftGratitude.paragraphs.filter((_, i) => i !== idx);
                              setDraftGratitude({ ...draftGratitude, paragraphs: newP });
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            Hapus Paragraf
                          </button>
                        )}
                      </div>
                      <textarea
                        value={p}
                        onChange={(e) => {
                          const newP = [...draftGratitude.paragraphs];
                          newP[idx] = e.target.value;
                          setDraftGratitude({ ...draftGratitude, paragraphs: newP });
                        }}
                        rows={3}
                        className="w-full bg-[#181818] border border-neutral-700 rounded-xl p-3 text-sm text-neutral-200 focus:outline-none"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDraftGratitude({
                        ...draftGratitude,
                        paragraphs: [...draftGratitude.paragraphs, 'Tulis paragraf baru di sini...'],
                      });
                    }}
                    className="flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Paragraf</span>
                  </button>
                </div>
              ) : (
                gratitude.paragraphs.map((para, i) => <p key={i}>{para}</p>)
              )}
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-neutral-800/80 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs font-mono text-neutral-400">Salam hormat & dedikasi,</div>
                {isEditMode ? (
                  <div className="space-y-1 mt-1">
                    <input
                      type="text"
                      value={draftGratitude.signatureName}
                      onChange={(e) => setDraftGratitude({ ...draftGratitude, signatureName: e.target.value })}
                      className="bg-[#181818] border border-neutral-700 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={draftGratitude.signatureDept}
                      onChange={(e) => setDraftGratitude({ ...draftGratitude, signatureDept: e.target.value })}
                      className="w-full bg-[#181818] border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-300 focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-bold text-white tracking-wide mt-0.5">
                      {gratitude.signatureName}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400">
                      {gratitude.signatureDept}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{gratitude.verifiedBadge}</span>
              </div>
            </div>
          </div>
        </section>

        {/* System Changelog & Version History */}
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Changelog & Pembaruan Sistem
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-mono mt-1">
                Catatan rilis lengkap dan peningkatan fitur di seluruh ekosistem LemAI
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleAddNewVersion}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs font-mono hover:bg-neutral-200 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Versi Baru</span>
                </button>
              )}
              <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(isEditMode ? draftChangelogs : changelogs).map((ver) => {
              return (
                <div key={ver.id} className="rounded-2xl bg-[#111111] border border-neutral-800 p-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-neutral-800/80">
                    {isEditMode ? (
                      <div className="flex items-center gap-2 flex-wrap w-full">
                        <input
                          type="text"
                          value={ver.version}
                          onChange={(e) => {
                            setDraftChangelogs(
                              draftChangelogs.map((v) =>
                                v.id === ver.id ? { ...v, version: e.target.value } : v
                              )
                            );
                          }}
                          className="bg-[#181818] border border-neutral-700 rounded px-2 py-1 text-sm font-bold text-white font-mono"
                          placeholder="Version (v2.5.0)"
                        />
                        <input
                          type="text"
                          value={ver.releaseBadge}
                          onChange={(e) => {
                            setDraftChangelogs(
                              draftChangelogs.map((v) =>
                                v.id === ver.id ? { ...v, releaseBadge: e.target.value } : v
                              )
                            );
                          }}
                          className="bg-[#181818] border border-neutral-700 rounded px-2 py-1 text-xs text-emerald-300 font-mono"
                          placeholder="Badge (Rilis Terbaru)"
                        />
                        <input
                          type="text"
                          value={ver.date}
                          onChange={(e) => {
                            setDraftChangelogs(
                              draftChangelogs.map((v) =>
                                v.id === ver.id ? { ...v, date: e.target.value } : v
                              )
                            );
                          }}
                          className="bg-[#181818] border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-400 font-mono"
                          placeholder="Date (Agustus 2026)"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteVersion(ver.id)}
                          className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-300 p-1 rounded hover:bg-neutral-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Versi</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold text-white font-mono">{ver.version}</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold uppercase">
                            {ver.releaseBadge}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-neutral-400">{ver.date}</span>
                      </>
                    )}
                  </div>

                  {/* Items list */}
                  {isEditMode ? (
                    <div className="space-y-3">
                      {ver.items.map((item, itemIdx) => (
                        <div key={item.id} className="p-3 rounded-xl bg-[#161616] border border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                setDraftChangelogs(
                                  draftChangelogs.map((v) =>
                                    v.id === ver.id
                                      ? {
                                          ...v,
                                          items: v.items.map((it) =>
                                            it.id === item.id ? { ...it, title: e.target.value } : it
                                          ),
                                        }
                                      : v
                                  )
                                );
                              }}
                              className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1 text-xs font-semibold text-white focus:outline-none"
                              placeholder="Judul Fitur"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(ver.id, item.id)}
                              className="text-neutral-500 hover:text-red-400 p-1"
                              title="Hapus Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <textarea
                            value={item.description}
                            onChange={(e) => {
                              setDraftChangelogs(
                                draftChangelogs.map((v) =>
                                  v.id === ver.id
                                    ? {
                                        ...v,
                                        items: v.items.map((it) =>
                                          it.id === item.id ? { ...it, description: e.target.value } : it
                                        ),
                                      }
                                    : v
                                )
                              );
                            }}
                            rows={2}
                            className="w-full bg-[#1e1e1e] border border-neutral-700 rounded p-2 text-xs text-neutral-300 focus:outline-none"
                            placeholder="Deskripsi Fitur"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddItemToVersion(ver.id)}
                        className="flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Tambah Item Fitur</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {ver.items.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                          <div className="font-semibold text-white flex items-center gap-2">
                            {renderIcon(item.iconType)}
                            <span>{item.title}</span>
                          </div>
                          <p className="text-neutral-400 leading-relaxed font-sans">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
