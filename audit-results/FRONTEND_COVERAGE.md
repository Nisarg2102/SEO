# Frontend coverage — 9 October 2026

Workspace routes were inspected in Chrome at 1440×1000 and 390×844. Public registration was additionally checked at 768px. This is a page/layout and selected-action audit, not exhaustive interaction-state or cross-browser certification.

| Workspace route | Desktop observation | Mobile observation |
|---|---|---|
| `/workspaces/:workspaceId` | Rendered | Rendered; No visible main navigation |
| `/workspaces/:workspaceId/agent` | Runtime crash: destroy is not a function | Runtime crash: destroy is not a function; No visible main navigation |
| `/workspaces/:workspaceId/analytics` | Rendered; 1 inputs without associated accessible labels | Rendered; 1 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/automations` | Rendered | Rendered; No visible main navigation |
| `/workspaces/:workspaceId/brand-profile` | Rendered; 9 inputs without associated accessible labels | Rendered; 9 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/calendar` | Rendered; 2 inputs without associated accessible labels | Rendered; Content extends beyond viewport; 2 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/content` | Rendered | Rendered; No visible main navigation |
| `/workspaces/:workspaceId/content/:id` | Rendered; 8 inputs without associated accessible labels | Rendered; 8 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/content/new` | Rendered; 3 inputs without associated accessible labels | Rendered; 3 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/keyword-research` | Rendered; 2 inputs without associated accessible labels | Rendered; 2 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/reports` | Rendered | Rendered; No visible main navigation |
| `/workspaces/:workspaceId/research` | Rendered; 5 inputs without associated accessible labels | Rendered; 5 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/search-console` | Rendered | Rendered; No visible main navigation |
| `/workspaces/:workspaceId/seo` | Rendered; 2 inputs without associated accessible labels | Rendered; 2 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/seo-audit` | Rendered; 3 inputs without associated accessible labels | Rendered; 3 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/seo-content` | Rendered; 2 failed requests (includes React development duplicates); 4 inputs without associated accessible labels | Rendered; 2 failed requests (includes React development duplicates); 4 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/seo-links` | Rendered; 12 failed requests (includes React development duplicates) | Rendered; 12 failed requests (includes React development duplicates); No visible main navigation |
| `/workspaces/:workspaceId/seo-opportunities` | Rendered; 2 inputs without associated accessible labels | Rendered; 2 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/seo-studio` | Rendered; 2 failed requests (includes React development duplicates); 1 inputs without associated accessible labels | Rendered; 2 failed requests (includes React development duplicates); 1 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/settings` | Navigation interrupted; settings successfully rechecked later | Rendered; 2 inputs without associated accessible labels; No visible main navigation |
| `/workspaces/:workspaceId/social` | Rendered | Rendered; No visible main navigation |
| `/workspaces/:workspaceId/sources` | Rendered | Rendered; No visible main navigation |

Public routes `/`, `/login`, `/register`, and `/workspaces` were also loaded. Registration and login succeeded. The anonymous homepage lands on an empty workspace screen; new workspace creation opens no UI.

Screenshots: [directory](/Users/mac/Desktop/SEO/audit-results/screenshots). See `browser-followup-results.json` for action results.
