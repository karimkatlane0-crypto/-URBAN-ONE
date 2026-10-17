export const AI_COMMAND_CAPACITY=100000;
export const AI_COMMAND_MAX_PAGE_SIZE=100000;

const ID_PATTERN=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const MODES=new Set(['read','prepare','write','external','payment']);

export function validateCommandDefinition(command){
  if(!command||typeof command!=='object'||Array.isArray(command)) throw new TypeError('AI_COMMAND_INVALID');
  const id=String(command.id??'').trim();
  if(!ID_PATTERN.test(id)) throw new TypeError('AI_COMMAND_ID_INVALID');
  const title=String(command.title??id).trim();
  if(!title||title.length>160) throw new TypeError('AI_COMMAND_TITLE_INVALID');
  const mode=String(command.mode??'prepare');
  if(!MODES.has(mode)) throw new TypeError('AI_COMMAND_MODE_INVALID');
  const provider=command.provider==null?null:String(command.provider).trim()||null;
  return Object.freeze({id,title,mode,provider,enabled:command.enabled!==false});
}

export function createCommandRegistry({capacity=AI_COMMAND_CAPACITY}={}){
  if(!Number.isInteger(capacity)||capacity<1||capacity>AI_COMMAND_CAPACITY) throw new RangeError('AI_COMMAND_CAPACITY_INVALID');
  const commands=new Map();
  return Object.freeze({
    capacity,
    get size(){return commands.size;},
    register(command){
      const normalized=validateCommandDefinition(command);
      if(commands.has(normalized.id)) throw new Error('AI_COMMAND_DUPLICATE');
      if(commands.size>=capacity) throw new RangeError('AI_COMMAND_CAPACITY_EXCEEDED');
      commands.set(normalized.id,normalized);
      return normalized;
    },
    has(id){return commands.has(String(id));},
    get(id){return commands.get(String(id))??null;},
    list({offset=0,limit=100}={}){
      if(!Number.isInteger(offset)||offset<0) throw new RangeError('AI_COMMAND_OFFSET_INVALID');
      if(!Number.isInteger(limit)||limit<1||limit>AI_COMMAND_MAX_PAGE_SIZE) throw new RangeError('AI_COMMAND_LIMIT_INVALID');
      const items=[];
      let index=0;
      for(const command of commands.values()){
        if(index>=offset&&items.length<limit) items.push(command);
        if(items.length===limit) break;
        index+=1;
      }
      return {total:commands.size,offset,limit,items};
    }
  });
}

export function aiCommandCapabilities(){
  return Object.freeze({
    registry:true,
    capacity:AI_COMMAND_CAPACITY,
    maxPageSize:AI_COMMAND_MAX_PAGE_SIZE,
    providerExecution:false,
    executionGate:'PROVIDER_EXECUTION_REQUIRES_CERTIFIED_RUNTIME',
    semantics:'registered-command-capacity-not-concurrent-provider-calls'
  });
}
