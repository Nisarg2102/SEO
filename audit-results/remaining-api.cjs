const fs=require('fs');const {PrismaClient}=require('@prisma/client');const db=new PrismaClient({datasources:{db:{url:'postgresql://seo_audit@127.0.0.1:55432/seo_audit'}}});const f=require('./fixtures.json');const out=[];let cookie;const base='http://localhost:3001/api';const p='/workspaces/'+f.workspaceA;
async function req(name,path,method='GET',body,headers={}){const start=Date.now();try{const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Cookie:cookie||'',...headers},body:body===undefined?undefined:JSON.stringify(body),redirect:'manual',signal:AbortSignal.timeout(20000)});const raw=await res.text();let data;try{data=JSON.parse(raw)}catch{data=raw.slice(0,500)}const r={name,path,method,status:res.status,ms:Date.now()-start,data,headers:Object.fromEntries([...res.headers].filter(([k])=>!['set-cookie'].includes(k)))};out.push(r);if(res.headers.get('set-cookie'))cookie=res.headers.get('set-cookie').split(';')[0];console.log(name,res.status);return r;}catch(e){out.push({name,path,method,error:e.message,ms:Date.now()-start});return {data:{}}}finally{fs.writeFileSync('audit-results/remaining-api-results.json',JSON.stringify(out,null,2))}}
(async()=>{await req('login','/auth/login','POST',{email:f.email,password:f.password});
await req('health','/health');await req('AI health mock','/health/ai');await req('SEO health','/seo/health');
await req('CORS preflight',p,'OPTIONS',undefined,{Origin:'http://localhost:3000','Access-Control-Request-Method':'GET'});
await req('CORS foreign origin',p,'OPTIONS',undefined,{Origin:'https://foreign.example','Access-Control-Request-Method':'GET'});
await req('workspace stats with scheduled fixture',p+'/stats');
const item=await db.researchItem.findFirst({where:{workspaceId:f.workspaceA}});
if(item){await req('research detail',p+'/research/'+item.id);await req('research convert',p+'/research/'+item.id+'/convert','POST',{});}
const brief=await db.seoContentBrief.findFirst({where:{workspaceId:f.workspaceA}});const draft=await db.seoContentDraft.findFirst({where:{workspaceId:f.workspaceA}});
if(brief){await req('brief detail',p+'/seo/content-briefs/'+brief.id);await req('brief drafts',p+'/seo/content-briefs/'+brief.id+'/drafts');await req('generate draft mock AI',p+'/seo/content-briefs/'+brief.id+'/generate-draft','POST',{});}
if(draft){await req('draft detail',p+'/seo/content-drafts/'+draft.id);await req('draft update',p+'/seo/content-drafts/'+draft.id,'PATCH',{content:'API edited fixture'});await req('draft regenerate snippet',p+'/seo/content-drafts/'+draft.id+'/regenerate-section','POST',{sectionHeading:'Audit',instructions:'Simplify'});}
await req('create brief mock AI',p+'/seo/content-briefs','POST',{primaryKeyword:'audit'});
await req('generate report mock AI',p+'/reports/generate','POST',{});
await req('analytics insights mock AI',p+'/analytics/insights','POST',{});
await req('AI test','/ai/test','POST',{prompt:'Hello'});
await req('create technical audit no queue',p+'/seo/audits','POST',{url:'https://example.com',maxPages:1,maxDepth:0});
await req('research queue missing configuration',p+'/research/sync','POST',{});
await req('GSC queue missing configuration',p+'/gsc/sync','POST',{});
await req('SEO opportunity queue missing configuration',p+'/seo-opportunities/analyze','POST',{});
await req('Instagram disconnected sync',p+'/social/instagram/sync','POST',{});await req('Instagram empty analyze',p+'/social/instagram/analyze','POST',{});await req('Instagram disconnect',p+'/social/instagram/disconnect','POST',{});
const auto=await db.automation.findFirst({where:{workspaceId:f.workspaceA}});if(auto){await req('automation detail',p+'/automations/'+auto.id);await req('automation disable',p+'/automations/'+auto.id,'PATCH',{enabled:false});}
await req('SEO content SSRF rejection',p+'/seo/content/analyze','POST',{url:'http://127.0.0.1:55433',primaryKeyword:'audit'});
for(const suffix of ['', '/suggestions','/trends','/related','/compare']) await req('live keyword provider '+suffix,p+'/keyword-research'+suffix+(suffix==='/compare'?'?kw=seo&kw=marketing':'?q=seo'));
await req('legacy seo keywords','/seo/keywords?q=seo');await req('legacy competitors','/seo/competitors?domain=example.com');await req('legacy rank','/seo/rank','POST',{domain:'example.com',keywords:['seo']});await req('legacy audit SSRF','/seo/audit','POST',{url:'http://127.0.0.1:55433'});
await db.$disconnect();})().catch(async e=>{console.error(e);await db.$disconnect();process.exitCode=1});
