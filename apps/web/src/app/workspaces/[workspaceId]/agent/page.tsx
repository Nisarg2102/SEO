/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState, useRef } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface Message {
  id: string;
  role: string;
  content: string;
  toolCalls?: any;
}

export default function AgentChat({ params }: { params: { workspaceId: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const fetchHistory = async (id: string) => {
    try {
      const res = await apiClient.get(`workspaces/${params.workspaceId}/agent/conversations/${id}`);
      setMessages((res as any).messages);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (override?: string) => {
    const text = override || input;
    if (!text.trim()) return;

    const newMsg: Message = { id: Date.now().toString(), role: 'USER', content: text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post(`workspaces/${params.workspaceId}/agent/chat`, {
        message: text,
        conversationId: convId || undefined
      });
      if ((res as any).conversationId && !convId) {
        setConvId((res as any).conversationId);
      }
      
      // Fetch latest history to sync tools and responses properly
      if ((res as any).conversationId) {
        await fetchHistory((res as any).conversationId);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: 'error', role: 'ASSISTANT', content: 'Sorry, I encountered an error.' }]);
    }
    setLoading(false);
  };

  const prompts = [
    "Give me a performance summary",
    "Which pages need attention?",
    "Find SEO opportunities",
    "What should I fix first?",
    "Give me content ideas"
  ];

  return (
    <div className="flex flex-col h-[80vh] border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <div className="bg-indigo-600 text-white p-4">
        <h2 className="font-bold text-lg">AI Marketing Assistant</h2>
        <p className="text-sm text-indigo-100">Ask questions about your performance, opportunities, or technical SEO.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-500 mt-10">
            <p className="mb-4">No conversation history. Start by asking a question.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {prompts.map(p => (
                <button key={p} onClick={() => sendMessage(p)} className="bg-white border border-gray-200 text-sm px-3 py-2 rounded shadow-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={m.id || i} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg p-4 ${m.role === 'USER' ? 'bg-indigo-600 text-white' : m.role === 'TOOL' ? 'bg-gray-200 text-xs font-mono text-gray-700' : 'bg-white border border-gray-200 shadow-sm text-gray-800'}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              
              {m.role === 'ASSISTANT' && m.toolCalls?.sources && m.toolCalls.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Sources:</p>
                  <ul className="text-xs text-gray-500 list-disc pl-4 mt-1">
                    {m.toolCalls.sources.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
              )}
              
              {m.role === 'ASSISTANT' && m.toolCalls?.suggestedActions && m.toolCalls.suggestedActions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Suggested Actions:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {m.toolCalls.suggestedActions.map((s: string, idx: number) => (
                      <button key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded hover:bg-indigo-100 transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 text-gray-500 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
