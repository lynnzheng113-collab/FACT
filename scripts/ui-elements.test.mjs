import test from 'node:test';
import assert from 'node:assert/strict';
import {nextId,validateRegistry} from './ui-elements.mjs';
const fixture=()=>({modules:[{id:'MOD1'}],submodules:[{id:'SUB1'}],pages:[{id:'PAGE1'}],areas:[{id:'AREA1',pageId:'PAGE1'}],actions:[{id:'ACT1'}],features:[{id:'REQ1'}],elements:[{id:'FACT-CTL-00001',label:'保存 / Save',pageId:'PAGE1',areaId:'AREA1',actionId:'ACT1',featureId:'REQ1',status:'现行',contextCode:'INSIDE_WORKSPACE'}],relations:[{controlId:'FACT-CTL-00001',actionId:'ACT1',event:'onClick',mode:'edit'}]});
test('append allocation never reuses retired IDs',()=>assert.equal(nextId([{id:'FACT-CTL-00001'},{id:'FACT-CTL-00125',status:'停用'}],'FACT-CTL'),'FACT-CTL-00126'));
test('duplicate and dangling IDs are rejected',()=>{const r=fixture();r.elements.push({...r.elements[0],pageId:'missing'});assert.match(validateRegistry(r).join('\n'),/Duplicate ID/);r.elements[1].id='FACT-CTL-00002';assert.match(validateRegistry(r).join('\n'),/Broken page/);});
test('old identity cannot disappear on refresh',()=>{const old=fixture(),r=fixture();r.elements[0].id='FACT-CTL-00002';assert.match(validateRegistry(r,old).join('\n'),/Old identity removed/);});
test('retirement preserves identity and requires reason',()=>{const old=fixture(),r=fixture();r.elements[0].status='停用';assert.match(validateRegistry(r,old).join('\n'),/Missing retirement/);r.elements[0].retirementReason='Removed in source';assert.deepEqual(validateRegistry(r,old),[]);});
test('sorting never determines identity',()=>{const r=fixture();r.elements.push({...r.elements[0],id:'FACT-ELM-00001',label:'结果 / Result',actionId:''});const old=structuredClone(r);r.elements.reverse();assert.deepEqual(validateRegistry(r,old),[]);});
test('bilingual and owning page required',()=>{const r=fixture();r.elements[0].label='保存';r.areas[0].pageId='OTHER';const e=validateRegistry(r);assert.ok(e.some(x=>x.includes('bilingual')));assert.ok(e.some(x=>x.includes('ownership')));});

test('source originals survive Chinese renaming and English replacement',()=>{
 const old=fixture();old.bilingualPolicy={version:1};
 for(const key of ['modules','submodules','pages','areas','elements','actions','features'])for(const x of old[key])x.sourceNames=[];
 old.elements[0].sourceNames=[{key:'copy.save',source:'src/constants/copy.ts',text:'保存 / Save'}];
 const r=structuredClone(old);r.elements[0].label='存储 / Store';r.elements[0].previousRegisteredName='保存 / Save';r.elements[0].sourceNames=[{key:'copy.save',source:'src/constants/copy.ts',text:'存储 / Store'}];
 assert.ok(validateRegistry(r,old).some(x=>x.includes('Bilingual original lost')));
 assert.ok(validateRegistry(r,old).some(x=>x.includes('Previous name lost')));
 r.elements[0].sourceNameHistory=old.elements[0].sourceNames;r.elements[0].nameHistory=[{name:'保存 / Save'}];
 assert.deepEqual(validateRegistry(r,old),[]);
});
