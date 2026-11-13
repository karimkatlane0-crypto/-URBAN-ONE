#!/usr/bin/env node
// SEVA Enterprise flow registry: fail-closed evidence reconciliation. No network or LIVE actions.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = new URL('../docs/SEVA_ENTERPRISE_72_NODE_RECONCILIATION.md', import.meta.url);
export const STAGES = Object.freeze(['FRONTEND','API','BACKEND','DATABASE','EVENTO','FOLLOW-UP','AUDIT']);
export const STATES = Object.freeze(['NOT VERIFIED','BLOCKED','FAIL','PASS']);
export function parseCheckpoints(markdown) {
  const rows = markdown.split(/\r?\n/).filter(line => /^\| NODE-\d{3} \|/.test(line));
  const nodes = rows.map(line => {
    const cells = line.split('|').slice(1,-1).map(x=>x.trim());
    return {id:cells[0],area:cells[1],checkpoint:cells[2],status:cells[5]};
  });
  if(nodes.length !== 72 || new Set(nodes.map(n=>n.id)).size !== 72 ||
     nodes.some((n,i)=>n.id !== `NODE-${String(i+1).padStart(3,'0')}`)) throw new Error('72-node source inventory invalid');
  return nodes;
}
export function makeRegistry(markdown) {
  const nodes=parseCheckpoints(markdown);
  return {schemaVersion:1,scopeTarget:154,identified:72,unidentified:82,
    stages:STAGES, nodes:nodes.map(n=>({...n,flowId:null,sourcePath:null,commitSha:null,testName:null,
      ciRunUrl:null,providerE2eEvidence:null,tenant:null,environment:null,owner:null,
      dependency:null,reviewedAt:null,stages:Object.fromEntries(STAGES.map(s=>[s,null]))}))};
}
export function validateNode(node) {
  if(!STATES.includes(node.status)) throw new Error(`Invalid status: ${node.id}`);
  if(node.status === 'PASS') {
    const required=['flowId','sourcePath','commitSha','testName','ciRunUrl','owner','environment','reviewedAt'];
    for(const key of required) if(typeof node[key] !== 'string' || !node[key].trim()) throw new Error(`PASS missing ${key}: ${node.id}`);
    if(!/^[a-f0-9]{40}$/.test(node.commitSha)) throw new Error(`Invalid commit: ${node.id}`);
    if(!/^https:\/\/github\.com\//.test(node.ciRunUrl)) throw new Error(`Invalid CI URL: ${node.id}`);
    for(const stage of STAGES) if(typeof node.stages?.[stage] !== 'string' || !node.stages[stage].trim()) throw new Error(`PASS missing stage ${stage}: ${node.id}`);
  }
  if(node.status==='BLOCKED' && !node.dependency) throw new Error(`BLOCKED missing dependency: ${node.id}`);
  return true;
}
export function validateRegistry(registry) {
  if(registry.scopeTarget!==154 || registry.identified!==72 || registry.unidentified!==82 || registry.nodes.length!==72) throw new Error('Invalid scope');
  if(new Set(registry.nodes.map(n=>n.id)).size!==72) throw new Error('Duplicate IDs');
  registry.nodes.forEach(validateNode);
  return true;
}
if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) {
  const registry=makeRegistry(readFileSync(source,'utf8'));
  validateRegistry(registry);
  process.stdout.write(JSON.stringify(registry,null,2)+'\n');
}
