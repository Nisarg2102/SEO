const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
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
    let r = await request('/auth/register', 'POST', { email: 'demo2@example.com', password: 'password123', name: 'Demo2' });
    if (r.status === 201) addResult('Auth', 'Register', 'Submit', 'WORKING');
    else if (r.status === 400 && r.data.message.includes('exists')) addResult('Auth', 'Register', 'Submit', 'WORKING');
    else addResult('Auth', 'Register', 'Submit', 'BROKEN', r.data?.message || r.status);

    r = await request('/auth/login', 'POST', { email: 'demo2@example.com', password: 'password123' });
    if (r.status === 200 && cookie) addResult('Auth', 'Login', 'Submit', 'WORKING');
    else addResult('Auth', 'Login', 'Submit', 'BROKEN', 'Login failed');

    r = await request('/auth/me', 'GET');
    if (r.status === 200 && r.data.id) addResult('Auth', 'Session', 'Fetch /me', 'WORKING');
    else addResult('Auth', 'Session', 'Fetch /me', 'BROKEN', 'No session');

    // 2. WORKSPACE
    r = await request('/workspaces', 'POST', { name: 'Audit Workspace', type: 'GENERAL' });
    if (r.status === 201) {
      addResult('Workspace', 'Create', 'Submit', 'WORKING');
      workspaceId = r.data.id;
    } else {
      addResult('Workspace', 'Create', 'Submit', 'BROKEN', 'Workspace creation failed');
    }

    r = await request('/workspaces', 'GET');
    if (r.status === 200 && Array.isArray(r.data)) addResult('Workspace', 'List', 'Fetch', 'WORKING');
    else addResult('Workspace', 'List', 'Fetch', 'BROKEN');

    // 3. BRAND PROFILE
    r = await request(`/workspaces/${workspaceId}/brand-profile`, 'GET');
    if (r.status === 200) addResult('Workspace', 'Brand Profile', 'Fetch', 'WORKING');
    else addResult('Workspace', 'Brand Profile', 'Fetch', 'BROKEN');

    r = await request(`/workspaces/${workspaceId}/brand-profile`, 'POST', { tone: 'Professional', targetAudience: 'Everyone' });
    if (r.status === 201 || r.status === 200) addResult('Workspace', 'Brand Profile', 'Save', 'WORKING');
    else addResult('Workspace', 'Brand Profile', 'Save', 'BROKEN');

    // 4. RESEARCH
    r = await request(`/workspaces/${workspaceId}/research`, 'GET');
    if (r.status === 200) addResult('Research', 'List', 'Fetch', 'WORKING');
    else addResult('Research', 'List', 'Fetch', 'BROKEN');

    // 5. CONTENT
    r = await request(`/workspaces/${workspaceId}/content-packs`, 'GET');
    if (r.status === 200) addResult('Content', 'List', 'Fetch', 'WORKING');
    else addResult('Content', 'List', 'Fetch', 'BROKEN');

    r = await request(`/workspaces/${workspaceId}/content-packs`, 'POST', { topic: 'Testing', platform: 'LinkedIn' });
    // Wait, the real endpoint is /content-packs/generate!
    r = await request(`/workspaces/${workspaceId}/content-packs/generate`, 'POST', { topic: 'Testing', platform: 'LinkedIn', audience: 'Developers' });
    if (r.status === 201) addResult('Content', 'Generate', 'Submit', 'WORKING');
    else addResult('Content', 'Generate', 'Submit', 'BROKEN', r.data?.message);

    // 6. CALENDAR
    r = await request(`/workspaces/${workspaceId}/calendar`, 'GET');
    if (r.status === 200) addResult('Calendar', 'List', 'Fetch', 'WORKING');
    else addResult('Calendar', 'List', 'Fetch', 'BROKEN');

    // 7. ANALYTICS
    r = await request(`/workspaces/${workspaceId}/analytics`, 'GET');
    if (r.status === 200) addResult('Analytics', 'List', 'Fetch', 'WORKING');
    else addResult('Analytics', 'List', 'Fetch', 'BROKEN');

    // 8. SOCIAL
    r = await request(`/workspaces/${workspaceId}/social-accounts`, 'GET');
    if (r.status === 200) addResult('Social', 'List Accounts', 'Fetch', 'WORKING');
    else addResult('Social', 'List Accounts', 'Fetch', 'BROKEN');

  } catch (e) {
    console.error(e);
  }

  console.log(report.join('\n'));
}

run();
