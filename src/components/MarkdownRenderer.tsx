import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Eye, Maximize2 } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { ImagePreviewModal } from './ImagePreviewModal';

interface MarkdownRendererProps {
  content: string;
  onCodeAction?: (action: 'explain' | 'fix' | 'improve', code: string, language: string) => void;
  onPreviewImage?: (url: string, alt?: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCodeAction,
  onPreviewImage,
}) => {
  const [modalImage, setModalImage] = useState<{ url: string; alt?: string } | null>(null);

  const handleImageClick = (src: string, alt?: string) => {
    if (onPreviewImage) {
      onPreviewImage(src, alt);
    } else {
      setModalImage({ url: src, alt });
    }
  };

  return (
    <div className="prose prose-invert max-w-none text-neutral-200 text-[15px] leading-relaxed space-y-4 font-normal">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Images with interactive preview and instant download
          img({ src, alt }) {
            if (!src) return null;
            return (
              <div className="my-4 not-prose inline-block max-w-full">
                <div 
                  className="group relative rounded-2xl overflow-hidden border border-neutral-800 bg-[#121212] transition-all hover:border-neutral-700 shadow-xl inline-block"
                >
                  <img
                    src={src}
                    alt={alt || 'LemAI Image'}
                    className="max-h-[420px] max-w-full object-contain rounded-2xl select-none cursor-pointer"
                    onClick={() => handleImageClick(src, alt)}
                    loading="lazy"
                  />
                  
                  {/* Hover Overlay Toolbar */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={() => handleImageClick(src, alt)}
                      className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg active:scale-95"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Preview & Download</span>
                    </button>
                  </div>
                </div>
                {alt && <p className="text-[11px] font-mono text-neutral-400 mt-1.5 pl-1">{alt}</p>}
              </div>
            );
          },

          // Code block vs inline code
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            const isInline = !match && !codeString.includes('\n');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded bg-neutral-800/90 text-neutral-100 font-mono text-[0.88em] border border-neutral-700/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                code={codeString}
                language={language || 'text'}
                onAction={onCodeAction}
              />
            );
          },

          // Paragraphs
          p({ children }) {
            return <p className="mb-3.5 leading-relaxed text-neutral-200">{children}</p>;
          },

          // Headings
          h1({ children }) {
            return (
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-6 mb-3 tracking-tight border-b border-neutral-800 pb-2">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-semibold text-white mt-5 mb-2.5 tracking-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base sm:text-lg font-medium text-neutral-100 mt-4 mb-2">
                {children}
              </h3>
            );
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1.5 my-3 text-neutral-300 pl-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1.5 my-3 text-neutral-300 pl-2">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Blockquote
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-neutral-600 pl-4 py-1 my-3 text-neutral-400 italic bg-neutral-900/40 rounded-r">
                {children}
              </blockquote>
            );
          },

          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-neutral-800">
                <table className="w-full text-left text-sm border-collapse">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-neutral-900/80 text-neutral-200 border-b border-neutral-800">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-2.5 font-semibold">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2 border-b border-neutral-900 text-neutral-300">{children}</td>;
          },

          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-100 underline decoration-neutral-500 hover:decoration-white font-medium transition-colors"
              >
                {children}
              </a>
            );
          },

          // Horizontal rule
          hr() {
            return <hr className="border-neutral-800 my-6" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {modalImage && (
        <ImagePreviewModal
          isOpen={true}
          onClose={() => setModalImage(null)}
          imageUrl={modalImage.url}
          altText={modalImage.alt}
          title={modalImage.alt || 'Gambar Pratinjau'}
        />
      )}
    </div>
  );
};
