import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
export function snapshot(repo=root){
 const files=[];
 function walk(dir){if(!fs.existsSync(path.join(repo,dir)))return;for(const entry of fs.readdirSync(path.join(repo,dir),{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.isDirectory())walk(file);else if(entry.isFile())files.push(file);}}
 walk('src');walk('public');
 for(const file of ['package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','docs/feature-ledger.json'])if(fs.existsSync(path.join(repo,file)))files.push(file);
 const entries=files.sort().map(file=>({file,sha256:digest(fs.readFileSync(path.join(repo,file)))}));
 const head=execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const branch=execFileSync('git',['-C',repo,'branch','--show-current'],{encoding:'utf8'}).trim();
 return {head,branch,digest:digest(JSON.stringify(entries)),files:entries};
}
export function nextId(records,prefix,width=5){
 const nums=records.filter(x=>x.id.startsWith(prefix+'-')).map(x=>Number(x.id.slice(prefix.length+1)));
 if(nums.some(n=>!Number.isSafeInteger(n)))throw Error('Malformed ID');
 return prefix+'-'+String(Math.max(0,...nums)+1).padStart(width,'0');
}
export function validateRegistry(r,previous){
 const errors=[];const insist=(ok,msg)=>{if(!ok)errors.push(msg);};
 const collections=['modules','submodules','pages','areas','elements','actions','features'];
 const sets={};
 for(const key of collections){insist(Array.isArray(r[key]),'Missing '+key);if(!Array.isArray(r[key]))continue;sets[key]=new Set(r[key].map(x=>x.id));insist(sets[key].size===r[key].length,'Duplicate ID in '+key);}
 if(errors.length)return errors;
 const all=collections.flatMap(k=>r[k].map(x=>x.id));insist(new Set(all).size===all.length,'ID collision across object types');
 if(r.issuedElementIds){insist(new Set(r.issuedElementIds).size===r.issuedElementIds.length,'Duplicate ID in issuance history');for(const id of r.issuedElementIds)insist(sets.elements.has(id),'Issued identity disappeared '+id);for(const e of r.elements)insist(r.issuedElementIds.includes(e.id),'Element missing issuance history '+e.id);}
 for(const e of r.elements){
  insist(/^FACT-(CTL|ELM)-\d{5,}$/.test(e.id),'Invalid element ID '+e.id);
  insist(/[\u3400-\u9fff]/.test(e.label)&&/\/[^\n]*[A-Za-z]/.test(e.label),'Missing bilingual name '+e.id);
  insist(sets.pages.has(e.pageId)&&sets.areas.has(e.areaId),'Broken page/area '+e.id);
  insist(r.areas.find(a=>a.id===e.areaId)?.pageId===e.pageId,'Area ownership '+e.id);
  insist(!e.actionId||sets.actions.has(e.actionId),'Unknown action '+e.id);
  insist(!e.featureId||sets.features.has(e.featureId),'Unknown feature '+e.id);
  insist(['现行','停用','已合并'].includes(e.status),'Missing lifecycle '+e.id);
  insist(['SIGNED_OUT','OUTSIDE_WORKSPACE','INSIDE_WORKSPACE','SHARED'].includes(e.contextCode),'Unknown context '+e.id);
  if(e.status==='停用')insist(Boolean(e.retirementReason),'Missing retirement reason '+e.id);
 }
 const relations=new Set();
 for(const rel of r.relations){const key=[rel.controlId,rel.event,rel.actionId,rel.mode].join('|');insist(!relations.has(key),'Duplicate relation '+key);relations.add(key);insist(sets.elements.has(rel.controlId)&&sets.actions.has(rel.actionId),'Dangling relation '+key);}
 for(const p of r.pages)insist(!p.parentId||sets.pages.has(p.parentId),'Unknown parent '+p.id);
 if(previous){for(const key of collections)for(const x of previous[key]||[])insist(sets[key].has(x.id),'Old identity removed '+x.id);for(const e of previous.elements||[]){const n=r.elements.find(x=>x.id===e.id);if(n&&n.label!==e.label)insist(Boolean(n.previousRegisteredName||n.identityHistory),'Rename without history '+e.id);}}
 if(r.bilingualPolicy){
  for(const key of collections)for(const x of r[key]){
   insist(Array.isArray(x.sourceNames),'Missing source-name inventory '+x.id);
   for(const n of x.sourceNames||[])insist(Boolean(n.key&&n.source&&n.text)&&/[\u3400-\u9fff]/.test(n.text)&&/\/[^\n]*[A-Za-z]/.test(n.text),'Incomplete bilingual original '+x.id);
  }
 }
 if(previous?.bilingualPolicy){
  insist(Boolean(r.bilingualPolicy),'Bilingual policy removed');
  for(const key of collections)for(const old of previous[key]||[]){
   const now=r[key].find(x=>x.id===old.id);if(!now)continue;
   for(const n of [...(old.sourceNames||[]),...(old.sourceNameHistory||[])])insist([...(now.sourceNames||[]),...(now.sourceNameHistory||[])].some(x=>x.key===n.key&&x.text===n.text&&x.source===n.source),'Bilingual original lost '+old.id+' '+n.key);
   for(const n of old.nameHistory||[])insist((now.nameHistory||[]).some(x=>x.name===n.name),'Name history lost '+old.id);
   const before=old.label??old.name,after=now.label??now.name;
   if(before!==after)insist((now.nameHistory||[]).some(x=>x.name===before),'Previous name lost '+old.id);
  }
 }
 return errors;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [cmd='check',...args]=process.argv.slice(2);
 if(cmd==='snapshot'){console.log(JSON.stringify(snapshot(),null,2));}
 else if(cmd==='check'){
  const file=args.find((x,i)=>!x.startsWith('--')&&args[i-1]!=='--previous')||path.join(root,'docs/ui-elements.json');
  const r=JSON.parse(fs.readFileSync(file,'utf8'));const prevFlag=args.indexOf('--previous');const previous=prevFlag>=0?JSON.parse(fs.readFileSync(args[prevFlag+1],'utf8')):null;
  const errors=validateRegistry(r,previous);
  if(args.includes('--source')){const current=snapshot();if(r.baseline?.sourceSnapshot?.digest!==current.digest)errors.push('Prototype changed: reconcile elements and refresh sourceSnapshot after semantic review');}
  if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(JSON.stringify({result:'PASS',elements:r.elements.length,active:r.elements.filter(e=>e.status==='现行').length,unique:true}));
 }else throw Error('Use check [registry.json] [--previous file] [--source] or snapshot');
}
