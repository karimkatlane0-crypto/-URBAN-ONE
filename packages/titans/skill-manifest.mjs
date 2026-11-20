import {TITANS_REQUEST_PURPOSES,TITANS_REQUEST_SCOPES} from './request-ledger.mjs';

export const TITANS_SKILL_TOOLS=Object.freeze([
  'read.public','read.own','search.web','analyze.data','draft.create','propose.workflow'
]);
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const semver=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export class TitansSkillError extends Error{
  constructor(code){super(code);this.name='TitansSkillError';this.code=code;}
}
function text(value,code,max){
  if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new TitansSkillError(code);
  return value.trim();
}
function uniqueAllowlist(values,allowed,code){
  if(!Array.isArray(values)||values.length<1||values.length>12||new Set(values).size!==values.length||
    values.some(value=>!allowed.includes(value)))throw new TitansSkillError(code);
  return [...values].sort();
}
/** Pure local skill manifest builder. Drafts cannot execute, publish or call providers. */
export function createSkillDraft(input={}){
  const id=text(input.id,'INVALID_SKILL_ID',80);
  if(!slug.test(id))throw new TitansSkillError('INVALID_SKILL_ID');
  const name=text(input.name,'INVALID_SKILL_NAME',80);
  const description=text(input.description,'INVALID_SKILL_DESCRIPTION',500);
  const version=text(input.version||'0.1.0','INVALID_SKILL_VERSION',24);
  if(!semver.test(version))throw new TitansSkillError('INVALID_SKILL_VERSION');
  if(!TITANS_REQUEST_PURPOSES.includes(input.purpose))throw new TitansSkillError('INVALID_SKILL_PURPOSE');
  const scopes=uniqueAllowlist(input.scopes,TITANS_REQUEST_SCOPES,'INVALID_SKILL_SCOPES');
  const tools=uniqueAllowlist(input.tools,TITANS_SKILL_TOOLS,'INVALID_SKILL_TOOLS');
  const ownerId=text(input.ownerId,'INVALID_SKILL_OWNER',90);
  const createdAt=new Date(input.createdAt||Date.now());
  if(!Number.isFinite(createdAt.getTime()))throw new TitansSkillError('INVALID_SKILL_TIMESTAMP');
  return Object.freeze({
    manifestVersion:1,id,name,version,description,purpose:input.purpose,ownerId,
    scopes,tools,createdAt:createdAt.toISOString(),status:'DRAFT',riskTier:scopes.some(s=>['contacts:read','calendar:read','analytics:read','skill:execute'].includes(s))?'MEDIUM':'LOW',
    executionEnabled:false,publishable:false,signature:null,requiresHumanApproval:true,
    policy:'DENY_BY_DEFAULT',externalSideEffects:false
  });
}
