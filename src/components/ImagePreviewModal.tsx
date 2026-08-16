import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ExternalLink,
  Sparkles,
  FileImage
} from 'lucide-react';
import { soundEffects } from '../lib/notifications';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  altText?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Image Preview',
  altText = 'Previewed Image',
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = async () => {
    soundEffects.playClickPop();
    try {
      if (imageUrl.startsWith('data:image/')) {
        // Base64 direct download
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `lemai_image_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Fetch blob and download
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `lemai_image_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Failed to download image:', err);
      // Fallback direct link
      window.open(imageUrl, '_blank');
    }
  };

  const handleCopyLink = async () => {
    soundEffects.playClickPop();
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full max-h-[92vh] bg-[#0c0c0c] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-['Plus_Jakarta_Sans',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#121212]/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white">
              <FileImage className="w-4 h-4 text-pink-400" />
            </div>
            <div className="truncate">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">{title}</h3>
              <p className="text-[11px] text-neutral-400 font-mono">LemAI Visual Viewer & Instant Downloader</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition disabled:opacity-40"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 text-[11px] font-mono text-neutral-300 hover:text-white"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition disabled:opacity-40"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800 rounded-xl transition flex items-center gap-1.5 text-xs font-mono"
              title="Salin Data/URL Gambar"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden md:inline">{copied ? 'Tersalin' : 'Salin'}</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95"
              title="Unduh Gambar PNG"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PNG</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition ml-1"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Container with native smooth scroll */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-[#070707] relative min-h-[300px]">
          <img
            src={imageUrl}
            alt={altText}
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
            className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-2xl border border-neutral-800 select-none cursor-zoom-in"
            onClick={zoomLevel === 1 ? handleZoomIn : handleResetZoom}
          />
        </div>

        {/* Bottom Bar Info */}
        <div className="px-5 py-2.5 border-t border-neutral-800 bg-[#121212] flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400"></span>
            <span>Gambar siap diunduh dan digunakan</span>
          </div>
          <span className="text-neutral-500">Klik gambar untuk memperbesar / memperkecil</span>
        </div>
      </div>
    </div>
  );
};
