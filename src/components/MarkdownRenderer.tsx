import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  onCodeAction?: (action: 'explain' | 'fix' | 'improve', code: string, language: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCodeAction,
}) => {
  return (
    <div className="prose prose-invert max-w-none text-neutral-200 text-[15px] leading-relaxed space-y-4 font-normal">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
    </div>
  );
};
