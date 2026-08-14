import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Ratio, 
  Layers, 
  Loader2,
  Maximize2
} from 'lucide-react';
import { generateImage } from '../api/api';
import { GeneratedImage } from '../types';

export const ImageGenWorkspace: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');
  const [style, setStyle] = useState('Photorealistic Dark Minimalist');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([
    {
      id: 'img-demo-1',
      prompt: 'Minimalist monochrome cybernetic processor with high contrast lighting, macro lens',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      aspectRatio: '1:1',
      createdAt: Date.now() - 3600000,
      model: 'LemAI Flash Image',
    },
    {
      id: 'img-demo-2',
      prompt: 'Futuristic geometric architecture in dark matte black obsidian glass',
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      aspectRatio: '16:9',
      createdAt: Date.now() - 7200000,
      model: 'LemAI Flash Image',
    },
  ]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const fullPrompt = `${prompt}, style: ${style}, high resolution, monochrome dark aesthetic`;
      const res = await generateImage({
        prompt: fullPrompt,
        aspectRatio,
      });

      const newImg: GeneratedImage = {
        id: `img-${Date.now()}`,
        prompt,
        url: res.url,
        aspectRatio,
        createdAt: Date.now(),
        model: 'LemAI Flash Image',
      };

      setImages(prev => [newImg, ...prev]);
    } catch (err: any) {
      console.error('Image Gen error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-full flex flex-col bg-[#080808] text-neutral-200 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="h-14 border-b border-neutral-800 bg-[#0c0c0c] px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <ImageIcon className="w-5 h-5 text-white" />
          <span className="font-bold text-sm text-white tracking-tight">Studio Image Generation</span>
          <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-mono text-neutral-400">
            Black Intelligence Visuals
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-8">
        {/* Generation Form */}
        <form onSubmit={handleGenerate} className="p-6 bg-[#0f0f0f] border border-neutral-800 rounded-2xl shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-neutral-400 mb-2">
              Visual Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe image in vivid detail: 'Monochrome quantum sphere floating over dark architectural pool, ray tracing, studio lighting'..."
              className="w-full bg-[#141414] border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutral-800/80">
            {/* Aspect Ratio */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-mono">Aspect Ratio:</span>
              <div className="flex bg-neutral-900 p-0.5 rounded-xl border border-neutral-800">
                {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                      aspectRatio === ratio
                        ? 'bg-neutral-800 text-white font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Preset */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-mono">Style:</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="bg-[#141414] border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option>Photorealistic Dark Minimalist</option>
                <option>Futuristic Cyberpunk Monochrome</option>
                <option>Abstract Geometric 3D</option>
                <option>Technical Schematic Blueprint</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate Art</span>
            </button>
          </div>
        </form>

        {/* Gallery */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-4">
            Recent Creations ({images.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-2xl overflow-hidden bg-[#111111] border border-neutral-800 shadow-xl transition hover:border-neutral-700"
              >
                <div className="relative aspect-square overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-xs text-white line-clamp-2 mb-3">{img.prompt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-400 bg-black/60 px-2 py-0.5 rounded">
                        {img.aspectRatio}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadImage(img.url, `lemai-${img.id}`)}
                        className="p-2 rounded-lg bg-white text-black hover:bg-neutral-200 transition"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-[#0d0d0d] text-[11px] font-mono text-neutral-400 truncate">
                  {img.prompt}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
