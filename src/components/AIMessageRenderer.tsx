import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AIMessageRendererProps {
  content: string;
  isLatest?: boolean;
  onComplete?: () => void;
}

const AIMessageRenderer: React.FC<AIMessageRendererProps> = ({ content }) => {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(true);
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`prose prose-sm max-w-none transition-opacity duration-500 ease-in font-sans leading-relaxed tracking-wide text-gray-800 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ wordSpacing: '0.15em', letterSpacing: '0.04em' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false }]]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-800 mb-4 mt-6 first:mt-0 leading-snug tracking-wide">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-5 first:mt-0 leading-snug tracking-wide">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4 first:mt-0 leading-snug tracking-wide">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-800 leading-loose tracking-wide mb-5 last:mb-0" style={{ wordSpacing: '0.18em', letterSpacing: '0.045em' }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 mb-5 text-gray-800 leading-loose tracking-wide">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 mb-5 text-gray-800 leading-loose tracking-wide">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-800 leading-loose tracking-wide" style={{ wordSpacing: '0.18em', letterSpacing: '0.045em' }}>{children}</li>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border border-gray-300 bg-white text-base text-left leading-loose tracking-wide" style={{ wordSpacing: '0.15em', letterSpacing: '0.04em' }}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b">{children}</tr>,
          th: ({ children }) => (
            <th className="border border-gray-300 px-5 py-3 bg-gray-100 font-semibold text-gray-800 leading-loose tracking-wide">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-5 py-3 text-gray-800 leading-loose tracking-wide">
              {children}
            </td>
          ),
          code: ({ children, inline, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-gray-100 text-purple-600 px-2 py-1 rounded text-base font-mono tracking-wider" style={{ wordSpacing: '0.12em', letterSpacing: '0.06em' }}>
                  {children}
                </code>
              );
            }
            // For block code, render <pre><code>...</code></pre> at the top level
            return (
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-5 overflow-x-auto mb-5">
                <code className="text-base font-mono text-gray-800 leading-loose tracking-wider" style={{ wordSpacing: '0.12em', letterSpacing: '0.06em' }}>
                  {children}
                </code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-300 pl-5 py-3 bg-purple-50 mb-5 italic text-gray-700 leading-loose tracking-wide">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-gray-800 tracking-wider" style={{ letterSpacing: '0.06em' }}>{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AIMessageRenderer;
