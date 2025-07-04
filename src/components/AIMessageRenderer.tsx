
import React, { useState, useEffect, useRef } from 'react';
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
  const indexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Track page visibility to pause/resume animation
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (isLatest && content) {
      setIsTyping(true);
      setDisplayedContent(''); // Start with empty to prevent spoiler
      indexRef.current = 0;
      
      const typewriterSpeed = 15; // Increased speed (reduced from 30ms to 15ms)
      
      const typeNextCharacter = () => {
        if (indexRef.current < content.length) {
          // Only continue if page is visible
          if (isVisibleRef.current) {
            setDisplayedContent(content.slice(0, indexRef.current + 1));
            indexRef.current++;
          }
          
          timerRef.current = setTimeout(typeNextCharacter, typewriterSpeed);
        } else {
          setIsTyping(false);
          onComplete?.();
        }
      };

      timerRef.current = setTimeout(typeNextCharacter, typewriterSpeed);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
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
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-800">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">
              {children}
            </em>
          ),
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
          // Custom code styling - Fixed TypeScript error by using any type for props
          code: ({ children, ...props }: any) => {
            const { inline } = props;
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
