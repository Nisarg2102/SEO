'use client';
import Link from 'next/link';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { AlertCircle, Check } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { workspacesApi } from '@/services/workspaces';
import type { BrandProfile, UpsertBrandProfilePayload, WorkspaceIntegrations } from '@/types/api';
import { ApiError } from '@/lib/apiClient';

export default function SettingsPage() {
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [, setProfile] = React.useState<BrandProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState('');

  // Brand profile form state
  const [businessName, setBusinessName] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [targetAudience, setTargetAudience] = React.useState('');
  const [brandVoice, setBrandVoice] = React.useState('');
  const [primaryKeywords, setPrimaryKeywords] = React.useState('');
  const [website, setWebsite] = React.useState('');

  // Workspace name state
  const [workspaceName, setWorkspaceName] = React.useState(activeWorkspace?.name ?? '');
  const [savingWs, setSavingWs] = React.useState(false);
  const [savedWs, setSavedWs] = React.useState(false);
  const [integrations, setIntegrations] = React.useState<WorkspaceIntegrations | null>(null);
  const [loadingIntegrations, setLoadingIntegrations] = React.useState(true);
  
  React.useEffect(() => {
    if (!activeWorkspace) return;
    setWorkspaceName(activeWorkspace.name);
    setLoadingProfile(true);
    setError('');
    workspacesApi.getIntegrations(activeWorkspace.id)
      .then(setIntegrations)
      .catch(console.error)
      .finally(() => setLoadingIntegrations(false));
    
    workspacesApi
      .getBrandProfile(activeWorkspace.id)
      .then((p) => {
        setProfile(p);
        setBusinessName(p.businessName ?? '');
        setIndustry(p.industry ?? '');
        setTargetAudience(p.targetAudience ?? '');
        setBrandVoice(p.brandVoice ?? '');
        setPrimaryKeywords(p.primaryKeywords ?? '');
        setWebsite(p.website ?? '');
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setProfile(null); // No profile yet — create on save
        } else {
          setError('Failed to load brand profile.');
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [activeWorkspace]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    setSaving(true);
    setSaved(false);
    setError('');
    const payload: UpsertBrandProfilePayload = {
      businessName,
      industry,
      targetAudience,
      brandVoice: brandVoice || undefined,
      primaryKeywords: primaryKeywords || undefined,
      website: website || undefined,
    };
    try {
      const updated = await workspacesApi.upsertBrandProfile(activeWorkspace.id, payload);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save brand profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

    async function handleSaveWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace || !workspaceName.trim()) return;
    setSavingWs(true);
    try {
      await workspacesApi.update(activeWorkspace.id, { name: workspaceName.trim() });
      await refreshWorkspaces();
      setSavedWs(true);
      setTimeout(() => setSavedWs(false), 2500);
    } catch {
      // non-blocking
    } finally {
      setSavingWs(false);
    }
  }

  if (!activeWorkspace) {
    return <p className="text-gray-500">Select a workspace to manage settings.</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage workspace preferences and brand profile.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Workspace Name */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Rename this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveWorkspace} className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Workspace Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" disabled={savingWs || !workspaceName.trim()} className={savedWs ? 'bg-green-600 hover:bg-green-700' : ''}>
              {savedWs ? <><Check className="mr-2 h-4 w-4" /> Saved</> : savingWs ? 'Saving...' : 'Save'}
            </Button>
          </form>
          {activeWorkspace.type === 'MEDICAL' && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mt-4">
              This workspace is configured as a Medical workspace. Content generation has additional compliance safeguards enabled.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Brand Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Profile</CardTitle>
          <CardDescription>
            Help the AI generate better, more relevant content by describing your brand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProfile ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-200 rounded" />)}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Voice</label>
                <input
                  type="text"
                  placeholder="e.g. Professional, friendly, educational"
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Keywords</label>
                  <input
                    type="text"
                    placeholder="e.g. managed IT, cybersecurity"
                    value={primaryKeywords}
                    onChange={(e) => setPrimaryKeywords(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={saving || !businessName.trim() || !industry.trim() || !targetAudience.trim()}
                className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {saved ? <><Check className="mr-2 h-4 w-4" /> Saved</> : saving ? 'Saving...' : 'Save Brand Profile'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connect external platforms. Integrations are configured via environment variables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingIntegrations ? (
            <p className="text-gray-500">Loading integrations...</p>
          ) : (
            <>
              {/* Google Search Console */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">Google Search Console</p>
                  <p className="text-sm text-gray-500">Import SEO performance data</p>
                  
                  <div className="mt-2 text-sm">
                    {!integrations?.gsc.serverConfigured ? (
                      <div className="text-amber-700">
                        <span className="font-medium">Status: Admin configuration required</span>
                        <p className="mt-1 text-xs">Google Search Console OAuth has not been configured by the application administrator.</p>
                      </div>
                    ) : integrations?.gsc.connected ? (
                      <div>
                        <span className="text-green-700 font-medium">Status: Connected</span>
                        {integrations.gsc.propertyUrl && (
                          <p className="text-xs text-gray-600 mt-1">Property: {integrations.gsc.propertyUrl}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-600 font-medium">Status: Not Connected</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!integrations?.gsc.serverConfigured ? (
                    <Button variant="outline" disabled>Requires Admin Setup</Button>
                  ) : integrations?.gsc.connected ? (
                    <Link href={`/workspaces/${activeWorkspace.id}/search-console`}>
                      <Button variant="outline">Manage Connection</Button>
                    </Link>
                  ) : (
                    <Link href={`/workspaces/${activeWorkspace.id}/search-console`}>
                      <Button variant="default">Connect GSC</Button>
                    </Link>
                  )}
                </div>
              </div>

              
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
