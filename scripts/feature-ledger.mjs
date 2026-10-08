import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataPath='docs/feature-ledger.json', mdPath='docs/FEATURE_LEDGER.md', stampPath='docs/feature-ledger-baseline.json';
const command=process.argv[2]??'check';
const option=(key)=>{const i=process.argv.indexOf(key);return i<0?undefined:process.argv[i+1];};
const sourceRef=option('--ref')??(process.argv.includes('--staged')?':':null);
const normalized=(s)=>s.replace(/\r\n/g,'\n');
const hash=(s)=>crypto.createHash('sha256').update(normalized(s)).digest('hex');
const read=(p)=>sourceRef?git(['show',sourceRef===':'?`:${p}`:`${sourceRef}:${p}`]):fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s,'utf8');
const tracked=(p)=>p.startsWith('src/')||p.startsWith('public/')||/^(package(-lock)?\.json|index\.html|vite\.config\..+|tsconfig.*\.json)$/.test(p);
const git=(args)=>execFileSync('git',['-c','core.quotepath=false',...args],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
function snapshot(){
  const args=sourceRef&&sourceRef!==':'?['ls-tree','-r','--name-only','-z',sourceRef]:sourceRef===':'?['ls-files','--cached','-z']:['ls-files','--cached','--others','--exclude-standard','-z'];
  const files=git(args).split('\0').filter(Boolean).filter(tracked);
  return Object.fromEntries([...new Set(files)].sort().filter(p=>sourceRef||fs.existsSync(path.join(root,p))).map(p=>[p,hash(read(p))]));
}
const ledger=JSON.parse(read(dataPath));
const ids=new Set();
function validate(){
  const errors=[];
  for(const f of ledger.features){
    if(!/^FACT-[A-Z]+-\d+$/.test(f.id)||ids.has(f.id))errors.push(`编号非法或重复：${f.id}`);
    ids.add(f.id);
    for(const key of ['name','module','entry','behavior','output','gap','acceptance','verification','reviewedAt'])if(!f[key])errors.push(`${f.id} 缺少 ${key}`);
    if(!ledger.modules.includes(f.module))errors.push(`${f.id} 模块未知`);
    for(const e of f.evidence??[]){
      if(path.isAbsolute(e.path)||e.path.split('/').includes('..')){errors.push(`${f.id} 非法证据路径`);continue;}
      if(!sourceRef&&!fs.existsSync(path.join(root,e.path))){errors.push(`${f.id} 证据文件不存在：${e.path}`);continue;}
      const s=normalized(read(e.path)),i=s.indexOf(e.anchor);
      if(i<0)errors.push(`${f.id} 证据锚点失效：${e.path} / ${e.anchor}`);
      else if(command==='refresh')e.line=s.slice(0,i).split('\n').length;
      else if(e.line!==s.slice(0,i).split('\n').length)errors.push(`${f.id} 证据行号已变化，请重新核对`);
    }
    if(!f.evidence?.length)errors.push(`${f.id} 没有证据`);
  }
  for(const f of ledger.features)if(f.parent&&!ids.has(f.parent))errors.push(`${f.id} 父项不存在`);
  for(const f of ledger.features){let x=f;const seen=new Set();while(x?.parent){if(seen.has(x.id)){errors.push(`${f.id} 父项循环`);break;}seen.add(x.id);x=ledger.features.find(v=>v.id===x.parent);}}
  if(errors.length)throw new Error(errors.join('\n'));
}
const cell=(v)=>String(v??'').replaceAll('|','\\|').replaceAll('\n','<br>');
function markdown(){
  let s=`# FACT MVP 功能台账\n\n版本 v${ledger.version} · 核对日期 ${ledger.reviewedAt} · 基准：${ledger.basis.edition}\n\n`;
  s+=`源码标识：${ledger.basis.prototypeLabel}；核对基准提交：\`${ledger.basis.commit}\`；本次含工作区未提交修改，已在各项中区分。\n\n`;
  s+=`${ledger.basis.scopeNote}\n\n`+ledger.notes.map(x=>`- ${x}`).join('\n')+'\n\n';
  s+=`本版共 ${ledger.features.length} 条台账记录，其中原有 ${ledger.features.filter(f=>f.oldRow).length} 项；细化子项与父项不可重复计算工作量。\n\n`;
  s+='维护源为本目录 feature-ledger.json；本文件由 scripts/feature-ledger.mjs 生成；Excel 为业务评审视图，人工确认值须回写维护源后再导出。\n\n';
  s+='## 当前验证限制\n\n'+ledger.knownIssues.map(x=>`- ${x.id}：${x.path} — ${x.issue}；${x.status}`).join('\n')+'\n\n';
  s+='## 功能索引\n\n|编号|功能|建议主责模块|层级／父项|原型状态|最终优先级|\n|---|---|---|---|---|---|\n';
  for(const f of ledger.features)s+=`|${f.id}|${cell(f.name)}|${cell(f.module)}|${cell(f.parent??f.level)}|${cell(f.prototypeStatus)}|${cell(f.finalPriority)}|\n`;
  s+='\n## 功能详项\n\n';
  for(const f of ledger.features){
    s+=`### ${f.id} ${f.name}\n\n`;
    for(const [label,value] of [['主责模块',f.module],['范围与入口',`${f.role}；${f.entry}`],['现有操作与规则',f.behavior],['输出／状态',f.output],['当前缺口',f.gap],['责任边界／依赖',f.boundary],['建议验收',f.acceptance],['旧范围建议',`${f.legacyPriority} / ${f.legacyForm}；${f.legacyScope}`],['人工确认',`${f.finalPriority??'待确认'}；确认人：${f.confirmedBy??'未填写'}；日期：${f.confirmedDate??'未填写'}；说明：${f.decision??'未填写'}`],['来源',f.source],['核对',`${f.reviewedAt}；${f.sourceState}；${f.verification}`]])s+=`- **${label}：** ${value}\n`;
    s+=`- **代码依据：** ${f.evidence.map(e=>`[${e.path}:${e.line}](../${e.path}#L${e.line})（锚点：\`${e.anchor}\`）`).join('；')}\n`;
    if(f.parent)s+=`- **父项：** ${f.parent}；本条为其细化，避免重复估时。\n`;
    s+='\n';
  }
  s+='## 更新记录\n\n'+ledger.changes.map(c=>`- ${c.date} / v${c.version}：${c.summary}`).join('\n')+'\n';
  return s;
}
try{
  if(!['check','refresh'].includes(command))throw new Error('用法：node scripts/feature-ledger.mjs check | refresh --date YYYY-MM-DD --reason 修改说明 --ids FACT-xxx,FACT-yyy --reviewed');
  validate();
  const files=snapshot();
  if(command==='refresh'){
    const reason=option('--reason'),date=option('--date'),affected=(option('--ids')??'').split(',').filter(Boolean);
    if(!process.argv.includes('--reviewed')||!reason||!/^\d{4}-\d{2}-\d{2}$/.test(date??'')||!affected.length||affected.some(id=>!ids.has(id)))throw new Error('先人工核对并更新 JSON，再提供 --reviewed、--date、--reason 和有效 --ids；此命令不会自动编造功能描述。');
    ledger.reviewedAt=date;
    ledger.changes.push({date,version:ledger.version,summary:reason,ids:affected});
    const previous=fs.existsSync(path.join(root,stampPath))?JSON.parse(read(stampPath)):null;
    if(previous&&hash(JSON.stringify(ledger.features))===previous.featuresHash&&reason.length<12)throw new Error('功能未变化时需具体说明本次修改为何不影响功能及验收');
    write(dataPath,JSON.stringify(ledger,null,2)+'\n');
    write(mdPath,markdown());
    write(stampPath,JSON.stringify({schemaVersion:1,reviewedAt:date,reason,affectedIds:affected,files,ledgerHash:hash(read(dataPath)),featuresHash:hash(JSON.stringify(ledger.features)),markdownHash:hash(read(mdPath))},null,2)+'\n');
    console.log(`已更新台账阅读版和核对指纹：${ledger.features.length} 条；${Object.keys(files).length} 个源码/配置文件。Excel 需同步更新。`);
  }else{
    const base=JSON.parse(read(stampPath));
    const changed=[...new Set([...Object.keys(base.files),...Object.keys(files)])].filter(p=>files[p]!==base.files[p]);
    if(changed.length)throw new Error(`源码变动尚未同步核对功能台账：\n${changed.join('\n')}`);
    if(base.ledgerHash!==hash(read(dataPath))||base.markdownHash!==hash(read(mdPath))||normalized(read(mdPath))!==markdown())throw new Error('台账数据、Markdown 或核对指纹不同步，请更新后 refresh');
    console.log(`功能台账检查通过：${ledger.features.length} 条，ID/父项/证据及源码指纹一致；不代表业务功能已完成或已验收。`);
  }
}catch(error){console.error(error.message);process.exitCode=1;}
