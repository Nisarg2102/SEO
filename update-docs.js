const fs = require('fs');

let securityAudit = fs.readFileSync('docs/SECURITY_AUDIT.md', 'utf8');
securityAudit = securityAudit.replace(
  /## 2. SSRF \(Server-Side Request Forgery\)\n- \*\*Status\*\*: PASSED WITH WARNINGS\n- \*\*Findings\*\*:[\s\S]*?## 3. Rate Limiting/m,
  `## 2. SSRF (Server-Side Request Forgery)
- **Status**: PASSED
- **Findings**:
  - A robust centralized SSRF protection utility (\`@ai-marketing/shared\` \`safeFetch\`) is used across the application (Crawler, Trends, Content Analysis).
  - Explicitly blocks IPv4/IPv6 loopbacks (127.0.0.1, ::1), private IP ranges (10.x, 172.16.x, 192.168.x), and cloud metadata endpoints (169.254.169.254).
  - DNS resolution is performed natively to guard against DNS rebinding.
  - Intercepts all HTTP redirects and independently re-validates the target destination before fetching.

## 3. Rate Limiting`
);
fs.writeFileSync('docs/SECURITY_AUDIT.md', securityAudit);

let prodChecklist = fs.readFileSync('docs/PRODUCTION_CHECKLIST.md', 'utf8');
prodChecklist = prodChecklist.replace(
  /\*\*Final Assessment\*\*: PRODUCTION READY WITH WARNINGS/,
  '**Final Assessment**: PRODUCTION READY'
);
fs.writeFileSync('docs/PRODUCTION_CHECKLIST.md', prodChecklist);
