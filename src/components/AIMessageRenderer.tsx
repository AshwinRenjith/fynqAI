
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AIMessageRendererProps {
  content: string;
  isLatest?: boolean;
  onComplete?: () => void;
}

const AIMessageRenderer: React.FC<AIMessageRendererProps> = ({ 
  content, 
  isLatest = false, 
  onComplete 
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isLatest && content) {
      setIsTyping(true);
      setDisplayedContent('');
      
      let index = 0;
      const typewriterSpeed = 30; // milliseconds per character
      
      const timer = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
          onComplete?.();
        }
      }, typewriterSpeed);

      return () => clearInterval(timer);
    } else {
      // For older messages, show immediately
      setDisplayedContent(content);
      setIsTyping(false);
    }
  }, [content, isLatest, onComplete]);

  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom heading styles
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-800 mb-3 mt-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-800 mb-2 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-700 mb-2 mt-3 first:mt-0">
              {children}
            </h3>
          ),
          // Custom paragraph styling
          p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-3 last:mb-0">
              {children}
            </p>
          ),
          // Custom strong/bold styling
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-800">
              {children}
            </strong>
          ),
          // Custom emphasis/italic styling
          em: ({ children }) => (
            <em className="italic text-gray-700">
              {children}
            </em>
          ),
          // Custom list styling
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-gray-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 leading-relaxed">
              {children}
            </li>
          ),
          // Custom code styling
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code className="bg-gray-100 text-purple-600 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto mb-3">
                <code className="text-sm font-mono text-gray-800">
                  {children}
                </code>
              </pre>
            );
          },
          // Custom blockquote styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-300 pl-4 py-2 bg-purple-50 mb-3 italic text-gray-700">
              {children}
            </blockquote>
          ),
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      
      {/* Typing indicator */}
      {isTyping && (
        <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1" />
      )}
    </div>
  );
};

export default AIMessageRenderer;
