const fs = require('fs');

function replaceFile(file, replacements) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  let original = code;
  
  if (!code.includes('localhost:3001')) return;

  const parts = file.split('/');
  const srcIndex = parts.indexOf('src');
  const relDepth = parts.length - srcIndex - 2;
  const importPath = (relDepth > 0 ? '../'.repeat(relDepth) : './') + 'lib/apiClient';
  
  if (!code.includes('import { apiClient }')) {
    const lines = code.split('\n');
    let insertIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) insertIdx = i + 1;
    }
    lines.splice(insertIdx, 0, `import { apiClient } from '${importPath}';`);
    code = lines.join('\n');
  }

  for (const [from, to] of replacements) {
    code = code.split(from).join(to);
  }

  if (code !== original) {
    fs.writeFileSync(file, code);
    console.log('Updated:', file);
  }
}

// 1. workspace/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/page.tsx', [
  [
    `fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/stats\`, {
      headers: {
        'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
      }
    })
      .then(res => res.json())`,
    `apiClient.get(\`workspaces/\${params.workspaceId}/stats\`)`
  ]
]);

// 2. content/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/content/page.tsx', [
  [
    `fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/content-packs\`, {
      headers: {
        'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
      }
    })
      .then(res => res.json())`,
    `apiClient.get(\`workspaces/\${params.workspaceId}/content-packs\`)`
  ]
]);

// 3. reports/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/reports/page.tsx', [
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/reports\`, {
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
      });
      if (res.ok) {
        setReports(await res.json());
      }`,
    `const data = await apiClient.get(\`workspaces/\${params.workspaceId}/reports\`);
      setReports(data);`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/reports/generate\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
      });
      if (res.ok) {
        fetchReports();
      } else {
        alert('Failed to generate report');
      }`,
    `await apiClient.post(\`workspaces/\${params.workspaceId}/reports/generate\`);
      fetchReports();`
  ]
]);

// 4. seo/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/seo/page.tsx', [
  [
    `fetch('http://localhost:3001/seo/health')
      .then(res => res.json())`,
    `apiClient.get('seo/health')`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/seo/keywords?q=\${encodeURIComponent(keywordQuery)}\`, {
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
      });
      if (res.ok) {
        setKeywords(await res.json());
      }`,
    `const data = await apiClient.get(\`seo/keywords?q=\${encodeURIComponent(keywordQuery)}\`);
      setKeywords(data);`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/seo/audit\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        },
        body: JSON.stringify({ url: auditUrl })
      });
      if (res.ok) {
        setAudit(await res.json());
      } else {
        alert('Failed to run audit');
      }`,
    `const data = await apiClient.post(\`seo/audit\`, { url: auditUrl });
      setAudit(data);`
  ]
]);

// 5. analytics/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/analytics/page.tsx', [
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/analytics\`, {
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
      });
      if (res.ok) {
        setData(await res.json());
      }`,
    `const data = await apiClient.get(\`workspaces/\${params.workspaceId}/analytics\`);
      setData(data);`
  ]
]);

// 6. sources/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/sources/page.tsx', [
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/sources\`, {
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
      });
      if (res.ok) {
        setSources(await res.json());
      }`,
    `const data = await apiClient.get(\`workspaces/\${params.workspaceId}/sources\`);
      setSources(data);`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/sources\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        },
        body: JSON.stringify({ url: newUrl, sourceType: newType })
      });
      if (res.ok) {
        setNewUrl('');
        fetchSources();
      } else {
        alert('Failed to add source');
      }`,
    `await apiClient.post(\`workspaces/\${params.workspaceId}/sources\`, { url: newUrl, sourceType: newType });
      setNewUrl('');
      fetchSources();`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/sources/\${source.id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        },
        body: JSON.stringify({ active: !source.active })
      });
      if (res.ok) fetchSources();`,
    `await apiClient.put(\`workspaces/\${params.workspaceId}/sources/\${source.id}\`, { active: !source.active });
      fetchSources();`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/sources/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        }
      });
      if (res.ok) fetchSources();`,
    `await apiClient.delete(\`workspaces/\${params.workspaceId}/sources/\${id}\`);
      fetchSources();`
  ]
]);

// 7. agent/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/agent/page.tsx', [
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/agent/chat\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        },
        body: JSON.stringify({ message: input, history: currentHistory })
      });

      if (!res.ok) throw new Error('Agent failed');
      const result = await res.json();
      setHistory(prev => [...prev, result]);`,
    `const result = await apiClient.post(\`workspaces/\${params.workspaceId}/agent/chat\`, { message: input, history: currentHistory });
      setHistory(prev => [...prev, result]);`
  ]
]);

// 8. seo-opportunities/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/seo-opportunities/page.tsx', [
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/seo-opportunities\`, {
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
      });
      if (res.ok) {
        setOpportunities(await res.json());
      }`,
    `const data = await apiClient.get(\`workspaces/\${params.workspaceId}/seo-opportunities\`);
      setOpportunities(data);`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/seo-opportunities/analyze\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        }
      });
      if (res.ok) {
        const result = await res.json();
        alert(\`Analysis complete! Found \${result.created} new opportunities.\`);
        fetchOpportunities();
      } else {
        alert('Failed to analyze');
      }`,
    `const result = await apiClient.post(\`workspaces/\${params.workspaceId}/seo-opportunities/analyze\`);
      alert(\`Analysis complete! Found \${result.created} new opportunities.\`);
      fetchOpportunities();`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/seo-opportunities/\${id}/convert\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        }
      });
      if (res.ok) {
        alert('Converted to Content Idea!');
        fetchOpportunities();
      } else {
        alert('Failed to convert');
      }`,
    `await apiClient.post(\`workspaces/\${params.workspaceId}/seo-opportunities/\${id}/convert\`);
      alert('Converted to Content Idea!');
      fetchOpportunities();`
  ]
]);
