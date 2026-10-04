const fs = require('fs');
const path = 'apps/api/src/social-studio/social-studio.service.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('const brandProfile = await this.prisma.brandProfile.findFirst')) {
  content = content.replace(
    'const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });',
    `const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    const brandProfile = await this.prisma.brandProfile.findFirst({ where: { workspaceId } });`
  );
  
  content = content.replace(
    'const safety = this.getSafetyInstructions((workspace as any).industry || (workspace as any).type);',
    `const safety = this.getSafetyInstructions(brandProfile?.industry || (workspace as any).type);
    
    let brandContext = '';
    if (brandProfile) {
      brandContext = \`
BRAND VOICE CONTEXT:
Business Name: \${brandProfile.businessName}
Description: \${brandProfile.description}
Services: \${brandProfile.services || 'N/A'}
Brand Tone: \${brandProfile.tone}
Language: \${brandProfile.language}
\`;
    }`
  );
  
  content = content.replace(
    '${safety}',
    '${brandContext}\n${safety}'
  );
  
  fs.writeFileSync(path, content);
  console.log('Updated service to include BrandProfile');
}
