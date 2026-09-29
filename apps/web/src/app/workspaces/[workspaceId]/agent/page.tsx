'use client';
import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../../../lib/apiClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export default function AgentPage({ params }: { params: { workspaceId: string } }) {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await apiClient.post(`workspaces/${params.workspaceId}/agent/chat`, {
        message: userMsg.content,
        history: messages
      });
      setMessages(prev => [...prev, data as { role: string; content: string }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h1 className="text-xl font-bold text-gray-900">AI Marketing Agent</h1>
        <p className="text-sm text-gray-500">
          Ask me about your SEO opportunities, content performance, or have me draft next week&apos;s content.
        </p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-gray-400 my-10">
            <p>Example prompts:</p>
            <div className="mt-4 space-y-2">
              <button onClick={() => setInput('What should we post next week?')} className="block w-full text-sm p-2 hover:bg-gray-100 rounded text-gray-600">&quot;What should we post next week?&quot;</button>
              <button onClick={() => setInput('Give me 5 content ideas based on our SEO opportunities.')} className="block w-full text-sm p-2 hover:bg-gray-100 rounded text-gray-600">&quot;Give me 5 content ideas based on our SEO opportunities.&quot;</button>
              <button onClick={() => setInput('Create a LinkedIn post about our best opportunity.')} className="block w-full text-sm p-2 hover:bg-gray-100 rounded text-gray-600">&quot;Create a LinkedIn post about our best opportunity.&quot;</button>
              <button onClick={() => setInput('Why did our recent posts perform differently?')} className="block w-full text-sm p-2 hover:bg-gray-100 rounded text-gray-600">&quot;Why did our recent posts perform differently?&quot;</button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-lg rounded-bl-none text-gray-500 italic">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask your marketing agent..."
            className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
