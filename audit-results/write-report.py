from pathlib import Path
import json,re,hashlib
root=Path('/Users/mac/Desktop/SEO'); out=root/'audit-results'
def load(n):return json.loads((out/n).read_text())
routes=load('routes.json'); api=load('api-results.json')+load('remaining-api-results.json')+[r for r in load('boundary-results.json') if r.get('path')]
browser=load('browser-results.json')
# Preserve an explicit route-by-route record without implying that rejected requests test business logic.
lines=['# API coverage — 9 October 2026','','All paths have `/api` prefix. “Access” exercises authentication/membership rejection; it does not certify the business operation. Observed HTTP 500s often share the duplicated NestJS exception-class cause. Provider success is distinguished from fixture/mock success in the main report.','','| Method | Route | HTTP observations | Authenticated/public operation exercised |','|---|---|---|---|']
for r in routes:
    pattern=re.escape(r['path']);pattern=re.sub(r':[A-Za-z]+','[^/]+',pattern).replace(r'\*','.*');pattern=re.compile('^'+pattern+'$')
    matches=[x for x in api if x.get('method')==r['method'] and pattern.match(x['path'].split('?')[0])]
    observations=', '.join(str(x) for x in sorted(set(str(x.get('status','ERROR')) for x in matches))) or 'Not exercised'
    business=[x for x in matches if not re.match(r'^(unauth|nonmember)',x.get('name',''))]
    lines.append(f"| {r['method']} | `{r['path']}` | {observations} | {'; '.join(x.get('name',x.get('test','callback')) for x in business) or 'Access rejection only; valid business path not verified'} |")
(out/'API_COVERAGE.md').write_text('\n'.join(lines)+'\n')
lines=['# Frontend coverage — 9 October 2026','','Workspace routes were inspected in Chrome at 1440×1000 and 390×844. Public registration was additionally checked at 768px. This is a page/layout and selected-action audit, not exhaustive interaction-state or cross-browser certification.','','| Workspace route | Desktop observation | Mobile observation |','|---|---|---|']
paths=sorted(set(x['path'] for x in browser if x.get('test')=='page'))
for p in paths:
    cols=[]
    for width in [1440,390]:
        r=next((x for x in browser if x.get('path')==p and x.get('viewport',{}).get('width')==width),{})
        notes=[]
        if r.get('error'):notes.append('Navigation interrupted; settings successfully rechecked later')
        elif r.get('errors'):notes.append('Runtime crash: destroy is not a function')
        else:notes.append('Rendered')
        if r.get('failed'):notes.append(f"{len(r['failed'])} failed requests (includes React development duplicates)")
        if r.get('overflow'):notes.append('Content extends beyond viewport')
        if r.get('unlabelledInputs'):notes.append(f"{r['unlabelledInputs']} inputs without associated accessible labels")
        if width==390:notes.append('No visible main navigation')
        cols.append('; '.join(notes))
    short=re.sub(r'^/workspaces/[^/]+','/workspaces/:workspaceId',p)
    short=re.sub(r'/content/[0-9a-f-]{36}$','/content/:id',short)
    lines.append(f"| `{short}` | {cols[0]} | {cols[1]} |")
lines+=['','Public routes `/`, `/login`, `/register`, and `/workspaces` were also loaded. Registration and login succeeded. The anonymous homepage lands on an empty workspace screen; new workspace creation opens no UI.','', 'Screenshots: [directory](/Users/mac/Desktop/SEO/audit-results/screenshots). See `browser-followup-results.json` for action results.']
(out/'FRONTEND_COVERAGE.md').write_text('\n'.join(lines)+'\n')
docs=sorted([*root.glob('*.md'),*root.glob('docs/*.md'),*root.glob('apps/*/README.md')])
lines=['# Documentation inventory','','Existing project documents reviewed against current implementation. Historical PASS/production-ready statements are not accepted as current evidence.','','| Document | SHA-256 |','|---|---|']
for p in docs:lines.append(f'| [{p.relative_to(root)}]({p}) | `{hashlib.sha256(p.read_bytes()).hexdigest()[:16]}` |')
(out/'DOCUMENT_INVENTORY.md').write_text('\n'.join(lines)+'\n')
print('documents',len(docs),'routes',len(routes),'HTTP probes',len(api),'workspace page scenarios',len([x for x in browser if x.get('test')=='page']))
