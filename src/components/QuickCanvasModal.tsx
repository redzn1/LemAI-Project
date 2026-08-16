import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Send, 
  RotateCcw, 
  Eraser, 
  PenTool, 
  Palette, 
  Maximize2, 
  Layers, 
  Sparkles,
  Check
} from 'lucide-react';
import { soundEffects } from '../lib/notifications';

interface QuickCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (imageBase64: string, caption?: string) => void;
}

export const QuickCanvasModal: React.FC<QuickCanvasModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [caption, setCaption] = useState('');
  const [hasContent, setHasContent] = useState(false);

  const colors = [
    '#ffffff', // White
    '#f87171', // Red
    '#fbbf24', // Amber
    '#34d399', // Emerald
    '#60a5fa', // Blue
    '#a78bfa', // Purple
    '#f472b6', // Pink
  ];

  // Initialize canvas background
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasContent(false);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(initCanvas, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasContent(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = isEraser ? '#111111' : brushColor;
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.closePath();
    }
  };

  const handleClear = () => {
    soundEffects.playClickPop();
    initCanvas();
  };

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundEffects.playClickPop();

    const dataUrl = canvas.toDataURL('image/png');
    onInsertToChat(dataUrl, caption.trim() || 'Sketsa Gambar Visual Canvas');
    onClose();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundEffects.playClickPop();

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `lemai_sketch_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-3xl w-full bg-[#0c0c0c] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-['Plus_Jakarta_Sans',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#121212]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white">
              <PenTool className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                Quick Canvas Scratchpad
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                  Instant Draw
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">Buat sketsa diagram, alur, atau catatan visual dan lampirkan langsung ke chat</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-[#141414] border-b border-neutral-800 text-xs">
          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setBrushColor(c);
                  setIsEraser(false);
                }}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full transition-transform ${
                  !isEraser && brushColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'hover:scale-110 opacity-80'
                }`}
              />
            ))}
          </div>

          {/* Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEraser(false)}
              className={`p-1.5 rounded-lg transition ${
                !isEraser ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Kuas Gambar (Pen)"
            >
              <PenTool className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsEraser(true)}
              className={`p-1.5 rounded-lg transition ${
                isEraser ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Penghapus (Eraser)"
            >
              <Eraser className="w-4 h-4" />
            </button>

            {/* Brush Size */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 pl-2 border-l border-neutral-700">
              <span>Size:</span>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-16 h-1 accent-white"
              />
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition ml-2"
              title="Bersihkan Canvas"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-4 bg-[#0a0a0a] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-[360px] bg-[#111111] rounded-xl border border-neutral-800 cursor-crosshair shadow-inner touch-none"
          />
        </div>

        {/* Bottom Options & Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-[#121212] flex flex-col sm:flex-row items-center justify-between gap-3">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Tambahkan catatan keterangan untuk sketsa ini (opsional)..."
            className="w-full sm:w-80 px-3 py-1.5 bg-[#181818] border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!hasContent}
              className="px-3 py-1.5 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PNG</span>
            </button>

            <button
              type="button"
              onClick={handleInsert}
              disabled={!hasContent}
              className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 shadow-md active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Lampirkan ke Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
