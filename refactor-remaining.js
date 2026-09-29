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

// 9. search-console/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/search-console/page.tsx', [
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/gsc/status\`, {
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
      });
      if (res.ok) setStatus(await res.json());`,
    `const data = await apiClient.get(\`workspaces/\${params.workspaceId}/gsc/status\`);
      setStatus(data);`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/gsc/auth-url\`, {
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }`,
    `const { url } = await apiClient.get(\`workspaces/\${params.workspaceId}/gsc/auth-url\`);
      window.location.href = url;`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/gsc/properties\`, {
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
      });
      if (res.ok) setProperties(await res.json());`,
    `const data = await apiClient.get(\`workspaces/\${params.workspaceId}/gsc/properties\`);
      setProperties(data);`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/gsc/connect-property\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        },
        body: JSON.stringify({ propertyUrl })
      });
      if (res.ok) fetchStatus();`,
    `await apiClient.post(\`workspaces/\${params.workspaceId}/gsc/connect-property\`, { propertyUrl });
      fetchStatus();`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/gsc/sync\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
      });
      if (res.ok) {
        const data = await res.json();
        alert(\`Successfully synced \${data.count} metrics!\`);
        fetchStatus();
      } else {
        alert('Failed to sync. Token may have expired or rate limits reached.');
      }`,
    `const data = await apiClient.post(\`workspaces/\${params.workspaceId}/gsc/sync\`);
      alert(\`Successfully synced \${data.count} metrics!\`);
      fetchStatus();`
  ]
]);

// 10. content/new/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/content/new/page.tsx', [
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}\`, {
          headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
        });
        if (res.ok) {
          const ws = await res.json();
          setWorkspaceType(ws.type || 'GENERAL');
        }`,
    `const ws = await apiClient.get(\`workspaces/\${params.workspaceId}\`);
        setWorkspaceType(ws.type || 'GENERAL');`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/content-packs/generate\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(\`/workspaces/\${params.workspaceId}/content/\${data.id}\`);
      } else {
        alert('Failed to generate content pack');
        setLoading(false);
      }`,
    `const data = await apiClient.post(\`workspaces/\${params.workspaceId}/content-packs/generate\`, formData);
      router.push(\`/workspaces/\${params.workspaceId}/content/\${data.id}\`);`
  ]
]);

// 11. content/[id]/page.tsx
replaceFile('apps/web/src/app/workspaces/[workspaceId]/content/[id]/page.tsx', [
  [
    `fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}\`, {
            headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
          })`,
    `apiClient.get(\`workspaces/\${params.workspaceId}\`, { rawResponse: true })`
  ],
  [
    `fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/content-packs/\${params.id}\`, {
            headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
          })`,
    `apiClient.get(\`workspaces/\${params.workspaceId}/content-packs/\${params.id}\`, { rawResponse: true })`
  ],
  [
    `if (wsRes.ok) {
          const ws = await wsRes.json();
          setWorkspaceType(ws.type || 'GENERAL');
        }`,
    `if (wsRes) {
          setWorkspaceType((wsRes as any).type || 'GENERAL');
        }`
  ],
  [
    `if (packRes.ok) {
          setPack(await packRes.json());
        } else {
          setError('Failed to load content pack');
        }`,
    `if (packRes) {
          setPack(packRes as any);
        }`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/content-packs/\${params.id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setPack({ ...pack, ...updates } as ContentPack);
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to update content pack');
      }`,
    `await apiClient.put(\`workspaces/\${params.workspaceId}/content-packs/\${params.id}\`, updates);
      setPack({ ...pack, ...updates } as ContentPack);`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/content-packs/\${params.id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        setPack({ ...pack, status } as ContentPack);
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Status transition failed');
      }`,
    `await apiClient.put(\`workspaces/\${params.workspaceId}/content-packs/\${params.id}\`, { status });
      setPack({ ...pack, status } as ContentPack);`
  ],
  [
    `const res = await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/content-packs/generate\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
        },
        body: JSON.stringify({ 
          topic: pack.topic, 
          audience: pack.audience, 
          platform: pack.platform,
          objective: pack.objective,
          intent: pack.intent
        })
      });
      if (res.ok) {
        const newPack = await res.json();
        // Since it's a re-generation, maybe we just update our local state with the new content
        // Or we redirect to the new ID. Let's assume we update our local state for simplicity in this MVP
        await fetch(\`http://localhost:3001/workspaces/\${params.workspaceId}/content-packs/\${params.id}\`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`
          },
          body: JSON.stringify({
            hook: newPack.hook,
            caption: newPack.caption,
            hashtags: newPack.hashtags,
            primaryKeyword: newPack.primaryKeyword,
            complianceNotes: newPack.complianceNotes
          })
        });
        window.location.reload();
      } else {
        alert('Failed to regenerate');
      }`,
    `const newPack = await apiClient.post(\`workspaces/\${params.workspaceId}/content-packs/generate\`, { 
          topic: pack.topic, 
          audience: pack.audience, 
          platform: pack.platform,
          objective: pack.objective,
          intent: pack.intent
        });
        await apiClient.put(\`workspaces/\${params.workspaceId}/content-packs/\${params.id}\`, {
            hook: newPack.hook,
            caption: newPack.caption,
            hashtags: newPack.hashtags,
            primaryKeyword: newPack.primaryKeyword,
            complianceNotes: newPack.complianceNotes
        });
        window.location.reload();`
  ]
]);
