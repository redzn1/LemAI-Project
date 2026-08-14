import React, { useState } from 'react';
import { 
  Video as VideoIcon, 
  Sparkles, 
  Play, 
  Film, 
  Clock, 
  Loader2,
  Sliders,
  Ratio
} from 'lucide-react';
import { generateVideo } from '../api/api';
import { GeneratedVideo } from '../types';

export const VideoGenWorkspace: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([
    {
      id: 'vid-demo-1',
      prompt: 'Cinematic slow drone flyover of an obsidian geometric monolith in dark fog, dramatic soft rim lighting',
      status: 'completed',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      aspectRatio: '16:9',
      createdAt: Date.now() - 3600000,
    },
  ]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    const newVid: GeneratedVideo = {
      id: `vid-${Date.now()}`,
      prompt,
      status: 'generating',
      progress: 10,
      aspectRatio,
      createdAt: Date.now(),
    };
    setVideos(prev => [newVid, ...prev]);

    try {
      await generateVideo({ prompt, aspectRatio, resolution });

      // Simulated completion progression
      setTimeout(() => {
        setVideos(prev => prev.map(v => v.id === newVid.id ? {
          ...v,
          status: 'completed',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        } : v));
      }, 6000);
    } catch (err) {
      console.error('Video error:', err);
      setVideos(prev => prev.map(v => v.id === newVid.id ? { ...v, status: 'failed' } : v));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#080808] text-neutral-200 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <div className="h-14 border-b border-neutral-800 bg-[#0c0c0c] px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <VideoIcon className="w-5 h-5 text-white" />
          <span className="font-bold text-sm text-white tracking-tight">Studio Video Generation</span>
          <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-mono text-neutral-400">
            Veo AI Engine
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-8">
        {/* Form */}
        <form onSubmit={handleGenerate} className="p-6 bg-[#0f0f0f] border border-neutral-800 rounded-2xl shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-neutral-400 mb-2">
              Cinematic Motion Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe motion & lighting: 'Camera sweeps across minimalist dark marble hall with pulsing geometric light reflections'..."
              className="w-full bg-[#141414] border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-mono">Aspect:</span>
                <div className="flex bg-neutral-900 p-0.5 rounded-xl border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono ${aspectRatio === '16:9' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'}`}
                  >
                    16:9 Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono ${aspectRatio === '9:16' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'}`}
                  >
                    9:16 Portrait
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-mono">Quality:</span>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="bg-[#141414] border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="1080p">1080p HD</option>
                  <option value="720p">720p Fast</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              <span>Render Video</span>
            </button>
          </div>
        </form>

        {/* Video List */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-4">
            Render Queue ({videos.length})
          </h3>

          <div className="space-y-4">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="p-4 bg-[#111111] border border-neutral-800 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-start"
              >
                <div className="w-full md:w-72 aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 relative border border-neutral-800">
                  {vid.status === 'completed' && vid.url ? (
                    <video src={vid.url} controls className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-neutral-400" />
                      <span className="text-xs text-neutral-400 font-mono">Synthesizing frames...</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {vid.aspectRatio}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      {new Date(vid.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-200 font-medium">{vid.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
