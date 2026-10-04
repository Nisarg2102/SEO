const fs = require('fs');
const path = 'apps/web/src/app/workspaces/[workspaceId]/calendar/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('interface SocialPost')) {
  // Update interface and state
  content = content.replace(
    'interface ContentPack {',
    `interface SocialPost {
  id: string;
  topic?: string;
  platform: string;
  status: string;
  scheduledAt?: string;
  isSocialPost?: boolean;
}

interface ContentPack {`
  );

  content = content.replace(
    'const [packs, setPacks] = useState<ContentPack[]>([]);',
    `const [packs, setPacks] = useState<(ContentPack | SocialPost)[]>([]);`
  );

  content = content.replace(
    'const data = await apiClient.get<ContentPack[]>(`workspaces/${params.workspaceId}/content-packs`);',
    `const packData = await apiClient.get<ContentPack[]>(` + '`workspaces/${params.workspaceId}/content-packs`' + `);
      let socialData: SocialPost[] = [];
      try {
        const posts = await apiClient.get<any[]>(` + '`workspaces/${params.workspaceId}/social/posts`' + `);
        socialData = posts.map(p => ({
          id: p.id,
          topic: p.content?.text?.substring(0, 30) + '...',
          platform: p.platform,
          status: p.status,
          scheduledAt: p.scheduledAt,
          isSocialPost: true
        }));
      } catch (e) { console.error('Failed to fetch social posts', e); }
      
      const combined = [...packData, ...socialData].sort((a, b) => {
        if (!a.scheduledAt) return 1;
        if (!b.scheduledAt) return -1;
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      });
      `
  );
  
  content = content.replace(
    'setPacks(data);',
    'setPacks(combined);'
  );

  content = content.replace(
    'await apiClient.put(`workspaces/${params.workspaceId}/content-packs/${id}`, updates);',
    `if ((updates as any).isSocialPost) {
        // Social posts are updated via different endpoints, read-only here for now or redirect
        alert('Social Posts must be updated from the Social Studio.');
      } else {
        await apiClient.put(\`workspaces/\${params.workspaceId}/content-packs/\${id}\`, updates);
      }`
  );
  
  content = content.replace(
    'onChange={e => updatePack(pack.id, { status: e.target.value })}',
    'onChange={e => updatePack(pack.id, { status: e.target.value, isSocialPost: (pack as any).isSocialPost })}'
  );
  
  content = content.replace(
    'onChange={e => updatePack(pack.id, { scheduledAt: new Date(e.target.value).toISOString() })}',
    'onChange={e => updatePack(pack.id, { scheduledAt: new Date(e.target.value).toISOString(), isSocialPost: (pack as any).isSocialPost })}'
  );
  
  content = content.replace(
    '<Link href={`/workspaces/${params.workspaceId}/content/${pack.id}`}',
    '<Link href={(pack as any).isSocialPost ? `/workspaces/${params.workspaceId}/social-studio` : `/workspaces/${params.workspaceId}/content/${pack.id}`}'
  );

  fs.writeFileSync(path, content);
  console.log('Calendar updated');
}
