/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { apiClient } from '../../../../lib/apiClient';

import { useState, useEffect } from 'react';


interface SummaryData {
  available: boolean;
  auditId?: string;
  internalLinks?: number;
  externalLinks?: number;
  brokenInternal?: number;
}

interface LinkData {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText?: string;
  isNofollow?: boolean;
  isSponsored?: boolean;
  isUgc?: boolean;
}

interface OrphanData {
  id: string;
  url: string;
}

interface BacklinkData {
  available: boolean;
  source: string;
  message: string;
  data: any[];
}


export default function SeoLinksPage({ params }: { params: { workspaceId: string } }) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [internal, setInternal] = useState<LinkData[]>([]);
  const [external, setExternal] = useState<LinkData[]>([]);
  const [orphans, setOrphans] = useState<OrphanData[]>([]);
  const [broken, setBroken] = useState<LinkData[]>([]);
  const [backlinks, setBacklinks] = useState<BacklinkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sum, int, ext, orp, brk, bkl] = await Promise.all([
          apiClient.request(`/workspaces/\${params.workspaceId}/seo/links/summary`),
          apiClient.request(`/workspaces/\${params.workspaceId}/seo/links/internal`),
          apiClient.request(`/workspaces/\${params.workspaceId}/seo/links/external`),
          apiClient.request(`/workspaces/\${params.workspaceId}/seo/links/orphans`),
          apiClient.request(`/workspaces/\${params.workspaceId}/seo/links/broken`),
          apiClient.request(`/workspaces/\${params.workspaceId}/seo/backlinks`),
        ]);
        setSummary(sum as SummaryData);
        setInternal(int as LinkData[]);
        setExternal(ext as LinkData[]);
        setOrphans(orp as OrphanData[]);
        setBroken(brk as LinkData[]);
        setBacklinks(bkl as BacklinkData);
      } catch (e: unknown) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.workspaceId]);

  if (loading) return <div className="p-8">Loading Link Intelligence...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Link Intelligence</h1>
        <p className="text-gray-600">
          Analyze internal linking structure and outbound links discovered from your most recent Technical SEO Audit.
        </p>
        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm border border-yellow-200">
          <strong>Limitation:</strong> Complete backlink discovery (sites linking TO you) is not available with the free architecture. 
          Google Search Console and our crawler can only discover links originating from your own pages or data provided via API.
        </div>
      </header>

      {summary && !summary.available ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No audit data found. Please run a Technical SEO Audit first to generate link data.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-white shadow-sm border border-gray-200 rounded-md text-center">
              <div className="text-2xl font-bold text-indigo-600">{summary?.internalLinks || 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Internal Links</div>
            </div>
            <div className="p-4 bg-white shadow-sm border border-gray-200 rounded-md text-center">
              <div className="text-2xl font-bold text-indigo-600">{summary?.externalLinks || 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Outbound External</div>
            </div>
            <div className="p-4 bg-red-50 shadow-sm border border-red-100 rounded-md text-center">
              <div className="text-2xl font-bold text-red-600">{summary?.brokenInternal || 0}</div>
              <div className="text-xs text-red-700 uppercase tracking-wide mt-1">Broken Pages</div>
            </div>
            <div className="p-4 bg-orange-50 shadow-sm border border-orange-100 rounded-md text-center">
              <div className="text-2xl font-bold text-orange-600">{orphans.length}</div>
              <div className="text-xs text-orange-700 uppercase tracking-wide mt-1">Potential Orphans</div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Internal Links</h2>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-2 font-medium text-gray-600 border-b">Source URL</th>
                      <th className="p-2 font-medium text-gray-600 border-b">Target URL</th>
                      <th className="p-2 font-medium text-gray-600 border-b">Anchor</th>
                      <th className="p-2 font-medium text-gray-600 border-b">Attributes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internal.map((link) => (
                      <tr key={link.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-2 truncate max-w-[200px]" title={link.sourceUrl}>{new URL(link.sourceUrl).pathname}</td>
                        <td className="p-2 truncate max-w-[200px]" title={link.targetUrl}>{new URL(link.targetUrl).pathname}</td>
                        <td className="p-2 text-gray-700">{link.anchorText || '-'}</td>
                        <td className="p-2 text-xs">
                          {link.isNofollow && <span className="bg-gray-200 px-1 rounded mr-1">nofollow</span>}
                          {!link.isNofollow && '-'}
                        </td>
                      </tr>
                    ))}
                    {internal.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No internal links found</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Outbound External Links</h2>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-2 font-medium text-gray-600 border-b">Source URL</th>
                      <th className="p-2 font-medium text-gray-600 border-b">Target Domain</th>
                      <th className="p-2 font-medium text-gray-600 border-b">Anchor</th>
                      <th className="p-2 font-medium text-gray-600 border-b">Attributes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {external.map((link) => {
                      let hostname = link.targetUrl;
                      try { hostname = new URL(link.targetUrl).hostname; } catch {}
                      return (
                        <tr key={link.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="p-2 truncate max-w-[200px]" title={link.sourceUrl}>{new URL(link.sourceUrl).pathname}</td>
                          <td className="p-2 truncate max-w-[200px]" title={link.targetUrl}>{hostname}</td>
                          <td className="p-2 text-gray-700">{link.anchorText || '-'}</td>
                          <td className="p-2 text-xs">
                            {link.isNofollow && <span className="bg-gray-200 px-1 rounded mr-1">nofollow</span>}
                            {link.isSponsored && <span className="bg-blue-100 text-blue-800 px-1 rounded mr-1">sponsored</span>}
                            {link.isUgc && <span className="bg-purple-100 text-purple-800 px-1 rounded mr-1">ugc</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {external.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No external links found</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Potential Orphan Pages</h2>
              <p className="text-sm text-gray-600 mb-4">These pages were crawled but no internal inbound links were found pointing to them.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 font-medium text-gray-600 border-b">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orphans.map((page) => (
                      <tr key={page.id} className="border-b last:border-0">
                        <td className="p-2 text-indigo-600"><a href={page.url} target="_blank" rel="noreferrer">{page.url}</a></td>
                      </tr>
                    ))}
                    {orphans.length === 0 && <tr><td className="p-4 text-center text-gray-500">No orphan pages detected</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
            
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Backlinks (External Inbound)</h2>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-gray-700 text-sm">
                <p className="font-medium mb-1">Source: {backlinks?.source || 'Free Architecture'}</p>
                <p>{backlinks?.message}</p>
                {backlinks?.data && backlinks.data.length > 0 && (
                  <div className="mt-4 text-gray-500 italic">Data visualization not yet implemented for GSC backlinks.</div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
