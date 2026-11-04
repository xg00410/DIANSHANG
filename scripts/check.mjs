import assert from 'node:assert/strict';
import {readFile, readdir, access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, dirname, sep} from 'node:path';
import {Script} from 'node:vm';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const pages=(await readdir(root)).filter(p=>p.endsWith('.html'));
assert.equal(pages.length,14);
const titles=new Set();
let links=0;
for(const page of pages){
 const html=await readFile(resolve(root,page),'utf8');
 const title=html.match(/<title>(.*?)<\/title>/)?.[1];
 assert(title,`${page}: title missing`);assert(!titles.has(title),`${page}: duplicate title`);titles.add(title);
 assert.match(html,/<main id="main">/);assert.match(html,/<html lang="zh-CN">/);
 for(const [,value] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(?:https?:|mailto:|tel:|data:)/.test(value))continue;
  const [raw,fragment]=value.split('#');const pathname=raw.split('?')[0]||page;
  const target=resolve(root,pathname);assert(target.startsWith(root.endsWith(sep)?root:root+sep),'Path outside site');
  await access(target);links++;
  if(fragment){const source=await readFile(target,'utf8');assert(source.includes(`id="${fragment}"`),`${page}: missing anchor ${value}`)}
 }
}
for(const name of ['app.js','site-config.js'])new Script(await readFile(resolve(root,name),'utf8'),{filename:name});
console.log(`PASS: ${pages.length} pages, ${links} local links/assets, unique titles and JavaScript syntax.`);
