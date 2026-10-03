const fs = require('fs');

const BASE_URL = 'https://social-seo12.vercel.app/api';
let cookie = '';
let workspaceId = '';

const report = [];

function addResult(page, feature, action, result, rootCause = '', fix = '') {
  report.push(`| ${page} | ${feature} | ${action} | ... | ... | ... | ... | ${result} |`);
}

async function request(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (cookie) headers['Cookie'] = cookie;
  
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const text = await res.text();
  
  if (res.headers.get('set-cookie')) {
    cookie = res.headers.get('set-cookie').split(';')[0];
  }
  
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

async function run() {
  try {
    // 1. AUTHENTICATION
    let r = await request('/auth/register', 'POST', { email: 'prod-demo@example.com', password: 'password123', name: 'Demo2' });
    console.log('Register:', r.status);
    if (r.status === 201 || (r.status === 400 && r.data.message.includes('exists'))) addResult('Auth', 'Register', 'Submit', 'WORKING');
    else addResult('Auth', 'Register', 'Submit', 'BROKEN', r.data?.message || r.status);

    r = await request('/auth/login', 'POST', { email: 'prod-demo@example.com', password: 'password123' });
    console.log('Login:', r.status);
    if (r.status === 201 || r.status === 200) addResult('Auth', 'Login', 'Submit', 'WORKING');
    else addResult('Auth', 'Login', 'Submit', 'BROKEN', 'Login failed');

    r = await request('/auth/me', 'GET');
    console.log('/me:', r.status);
    if (r.status === 200 && r.data.id) addResult('Auth', 'Session', 'Fetch /me', 'WORKING');
    else addResult('Auth', 'Session', 'Fetch /me', 'BROKEN', 'No session');

    // 2. WORKSPACE
    r = await request('/workspaces', 'POST', { name: 'Audit Workspace Prod', type: 'GENERAL' });
    console.log('Workspace Create:', r.status);
    if (r.status === 201) {
      addResult('Workspace', 'Create', 'Submit', 'WORKING');
      workspaceId = r.data.id;
    } else {
      addResult('Workspace', 'Create', 'Submit', 'BROKEN', 'Workspace creation failed');
    }

    if (workspaceId) {
        // 3. BRAND PROFILE
        r = await request(`/workspaces/${workspaceId}/brand-profile`, 'GET');
        console.log('Brand profile GET:', r.status);
        if (r.status === 200) addResult('Workspace', 'Brand Profile', 'Fetch', 'WORKING');
        else addResult('Workspace', 'Brand Profile', 'Fetch', 'BROKEN');

        r = await request(`/workspaces/${workspaceId}/brand-profile`, 'POST', { tone: 'Professional', targetAudience: 'Everyone' });
        console.log('Brand profile POST:', r.status);
        if (r.status === 201 || r.status === 200) addResult('Workspace', 'Brand Profile', 'Save', 'WORKING');
        else addResult('Workspace', 'Brand Profile', 'Save', 'BROKEN');

        // 5. CONTENT
        r = await request(`/workspaces/${workspaceId}/content-packs`, 'GET');
        console.log('Content List:', r.status);
        if (r.status === 200) addResult('Content', 'List', 'Fetch', 'WORKING');
        else addResult('Content', 'List', 'Fetch', 'BROKEN');

        r = await request(`/workspaces/${workspaceId}/content-packs/generate`, 'POST', { topic: 'Testing', platform: 'LinkedIn', audience: 'Developers' });
        console.log('Content Generate:', r.status);
        if (r.status === 201) addResult('Content', 'Generate', 'Submit', 'WORKING');
        else addResult('Content', 'Generate', 'Submit', 'BROKEN', r.data?.message);
    }
  } catch (e) {
    console.error(e);
  }

  console.log('---- REPORT ----');
  console.log(report.join('\n'));
}

run();
