const fs = require('fs');

let igCode = fs.readFileSync('apps/api/src/instagram/instagram.service.ts', 'utf8');

igCode = igCode.replace(
  /getAuthUrl\(workspaceId: string\): string \{\s*const appId = process.env.META_APP_ID;\s*const redirectUri = process.env.META_CALLBACK_URL;\s*if \(!appId \|\| !redirectUri\) throw new Error\('Meta API not configured'\);\s*const state = workspaceId;\s*const scopes = \['instagram_basic', 'instagram_manage_insights', 'pages_show_list', 'pages_read_engagement'\].join\(','\);\s*return `https:\/\/www.facebook.com\/v19.0\/dialog\/oauth\?client_id=\$\{appId\}\&display=page\&extras=\{"setup":\{"channel":"IG_API_ONBOARDING"\}\}\&redirect_uri=\$\{encodeURIComponent\(redirectUri \|\| ''\)\}\&response_type=code\&scope=\$\{encodeURIComponent\(scopes\)\}\&state=\$\{state\}`;/,
  `getAuthUrl(workspaceId: string): string {
    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_CALLBACK_URL;
    const configId = process.env.META_LOGIN_CONFIG_ID;
    
    if (!appId || !redirectUri || !configId) {
      throw new Error('Meta API or Login Config ID not configured');
    }

    const state = workspaceId;
    
    // Facebook Login for Business requires config_id instead of scope
    return \`https://www.facebook.com/v19.0/dialog/oauth?client_id=\${appId}&display=page&extras={"setup":{"channel":"IG_API_ONBOARDING"}}&redirect_uri=\${encodeURIComponent(redirectUri)}&response_type=code&config_id=\${configId}&state=\${state}\`;`
);
fs.writeFileSync('apps/api/src/instagram/instagram.service.ts', igCode);

let wsCode = fs.readFileSync('apps/api/src/workspaces/workspaces.service.ts', 'utf8');
wsCode = wsCode.replace(
  /serverConfigured: !!process\.env\.META_APP_ID && !!process\.env\.META_APP_SECRET,/,
  'serverConfigured: !!process.env.META_APP_ID && !!process.env.META_APP_SECRET && !!process.env.META_LOGIN_CONFIG_ID,'
);
fs.writeFileSync('apps/api/src/workspaces/workspaces.service.ts', wsCode);

let envCode = fs.readFileSync('.env.example', 'utf8');
envCode = envCode.replace(/META_CALLBACK_URL=.*\n/, "META_CALLBACK_URL=\nMETA_LOGIN_CONFIG_ID=\n");
fs.writeFileSync('.env.example', envCode);

