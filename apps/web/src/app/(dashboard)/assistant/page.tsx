'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, User, Send, Sparkles, AlertCircle } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { agentApi } from '@/services/agent';
import type { ChatMessage } from '@/types/api';
import { ApiError } from '@/lib/apiClient';
import { EmptyState } from '@/components/ui/empty-state';

const SUGGESTIONS = [
  'Give me 5 content ideas',
  'Find SEO opportunities',
  'Turn my top research into a LinkedIn post',
  'Plan next week&apos;s content',
  'Analyze my recent content performance',
];

export default function AssistantPage() {
  const { activeWorkspace } = useWorkspace();
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        activeWorkspace
          ? `Hi there! I&apos;m your AI Marketing Assistant for ${activeWorkspace.name}. I can help you find SEO opportunities, generate content ideas, or analyze your recent performance. What would you like to do today?`
          : "Hi there! Select a workspace to get started.",
    },
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || !activeWorkspace || loading) return;
    setError('');
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const res = await agentApi.chat(activeWorkspace.id, text.trim(), messages);
      setMessages([...history, { role: 'assistant', content: res.response }]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Session expired. Please sign in again.');
      } else if (err instanceof ApiError) {
        setError(err.message || 'The assistant encountered an error. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  if (!activeWorkspace) {
    return (
      <EmptyState
        icon={Bot}
        title="No workspace selected"
        description="Select a workspace to start chatting with your AI assistant."
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">AI Assistant</h1>
          <p className="text-gray-500">Your dedicated marketing and SEO co-pilot for {activeWorkspace.name}.</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden border-gray-200">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                    msg.role === 'assistant'
                      ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-blue-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100">
                  <span className="flex gap-1 items-center">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion.replace(/&apos;/g, "'"))}
                  disabled={loading}
                  className="shrink-0 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium rounded-full transition-colors border border-blue-200 disabled:opacity-50"
                >
                  {suggestion.replace(/&apos;/g, "'")}
                </button>
              ))}
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask your AI assistant..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="w-full h-12 pl-4 pr-14 rounded-full border border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm disabled:opacity-50"
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="absolute right-2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="hidden lg:flex flex-col w-80 shrink-0 gap-4 overflow-y-auto">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-blue-600" /> Current Context
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Workspace</span>
                  <p className="font-medium">{activeWorkspace.name}</p>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Type</span>
                  <p className="font-medium capitalize">{activeWorkspace.type.toLowerCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
