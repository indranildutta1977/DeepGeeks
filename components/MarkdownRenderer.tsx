import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-sm sm:prose-base max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" />
          ),
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            return isInline ? (
              <code className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <div className="relative group my-4">
                <div className="absolute -top-3 left-2 text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-t select-none">
                  {match ? match[1] : 'code'}
                </div>
                <code className="block bg-gray-950 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-gray-800" {...props}>
                  {children}
                </code>
              </div>
            );
          },
          ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-100" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-100" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-100" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-400" {...props} />,
          table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-700 border border-gray-700" {...props} /></div>,
          th: ({node, ...props}) => <th className="px-3 py-2 bg-gray-800 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" {...props} />,
          td: ({node, ...props}) => <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300 border-t border-gray-700" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;