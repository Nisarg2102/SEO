'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowLeft, Check, AlertCircle, RefreshCw, Save } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { contentApi } from '@/services/content';
import type { ContentPack } from '@/types/api';
import { ApiError } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

const PLATFORMS = ['LinkedIn', 'Twitter/X', 'Instagram', 'Facebook', 'Blog Post', 'Google Business'];

const AUDIENCES = [
  'IT Decision Makers & CIOs',
  'Small Business Owners',
  'General Professionals',
  'Existing Clients',
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function CreateContentPage() {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();

  const [step, setStep] = React.useState<Step>(1);
  const [topic, setTopic] = React.useState('');
  const [platform, setPlatform] = React.useState('');
  const [audience, setAudience] = React.useState('');

  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState('');
  const [result, setResult] = React.useState<ContentPack | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function handleGenerate() {
    if (!activeWorkspace || !topic.trim() || !platform || !audience) return;
    setGenerating(true);
    setGenError('');
    try {
      const pack = await contentApi.generate(activeWorkspace.id, {
        topic: topic.trim(),
        platform,
        audience,
      });
      setResult(pack);
      setStep(5);
    } catch (err) {
      if (err instanceof ApiError) {
        setGenError(err.message || 'Generation failed. Please try again.');
      } else {
        setGenError('Something went wrong. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!result || !activeWorkspace) return;
    setSaving(true);
    try {
      await contentApi.update(activeWorkspace.id, result.id, { status: 'draft' });
      setSaved(true);
      setTimeout(() => router.push('/content'), 1200);
    } catch {
      // non-blocking
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    setResult(null);
    setStep(4);
    await handleGenerate();
  }

  const steps = [
    { num: 1 as Step, label: 'Topic' },
    { num: 2 as Step, label: 'Platform' },
    { num: 3 as Step, label: 'Audience' },
    { num: 4 as Step, label: 'Generate' },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in-50 duration-500">
      <div className="flex items-center space-x-4">
        <Link href="/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create AI Content</h1>
          <p className="text-gray-500">Generate optimized marketing content in seconds.</p>
        </div>
      </div>

      {step !== 5 && (
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10" />
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center bg-gray-50 px-2">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center border-2 font-bold ${
                  step > s.num
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : step === s.num
                    ? 'bg-white border-blue-600 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {step > s.num ? <Check className="h-5 w-5" /> : s.num}
              </div>
              <span className={`text-xs mt-2 font-medium ${step >= s.num ? 'text-gray-900' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">What do you want to post about?</h2>
                <p className="text-sm text-gray-500">Describe your topic, paste a URL, or add key points.</p>
              </div>
              <textarea
                className="w-full h-36 rounded-md border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. 5 reasons why small businesses need managed IT services to prevent cyber attacks..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!topic.trim()}>
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Choose platform</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors text-sm font-medium ${
                      platform === p
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} disabled={!platform}>Next Step</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Target Audience</h2>
              <div className="grid grid-cols-1 gap-4">
                {AUDIENCES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    className={`border rounded-lg p-4 cursor-pointer text-left transition-colors text-sm font-medium ${
                      audience === a
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => setStep(4)} disabled={!audience}>Next Step</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Ready to Generate</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex gap-2"><span className="text-gray-500 w-20">Topic:</span><span className="font-medium">{topic}</span></div>
                <div className="flex gap-2"><span className="text-gray-500 w-20">Platform:</span><Badge variant="blue">{platform}</Badge></div>
                <div className="flex gap-2"><span className="text-gray-500 w-20">Audience:</span><span className="font-medium">{audience}</span></div>
              </div>
              {genError && (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">{genError}</p>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  onClick={handleGenerate}
                  disabled={generating || !activeWorkspace}
                >
                  {generating ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate Content</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && result && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Generated Content</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={generating}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={saving || saved}
                    className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {result.hook && (
                  <ContentField label="Hook" value={result.hook} />
                )}
                {result.caption && (
                  <ContentField label="Caption" value={result.caption} />
                )}
                {result.script && (
                  <ContentField label="Script" value={result.script} />
                )}
                {result.visualDirection && (
                  <ContentField label="Visual Direction" value={result.visualDirection} />
                )}
                {result.cta && (
                  <ContentField label="Call to Action" value={result.cta} />
                )}
                {result.hashtags && (
                  <ContentField label="Hashtags" value={result.hashtags} />
                )}
                {result.seoTitle && (
                  <ContentField label="SEO Title" value={result.seoTitle} />
                )}
                {result.metaDescription && (
                  <ContentField label="Meta Description" value={result.metaDescription} />
                )}
                {result.primaryKeyword && (
                  <ContentField label="Primary Keyword" value={result.primaryKeyword} />
                )}
                {result.complianceNotes && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">
                      Compliance Notes
                    </p>
                    <p className="text-sm text-amber-800">{result.complianceNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ContentField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{value}</p>
      </div>
    </div>
  );
}
