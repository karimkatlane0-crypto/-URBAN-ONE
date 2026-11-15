// Manual all-day calendar snapshots. No network, persistence, guest data or
// availability assertions. Supported date range: 1900-01-01 to 2199-12-31.
export const KK_STAY_CALENDAR_LIMITS=Object.freeze({maxInputBytes:256*1024,maxEvents:500,maxBlocks:1000,minYear:1900,maxYear:2199,maxUnitLength:80});
const KK_STAY_CALENDAR_SOURCES=Object.freeze(['Booking.com','Altro calendario','Manuale']);

function kkStayError(code){
 const messages={
  invalid_calendar:'Il file non è un calendario supportato.',
  calendar_too_large:'Il calendario supera 256 KiB.',
  too_many_events:'Il calendario contiene più di 500 eventi.',
  invalid_calendar_line:'Il calendario contiene una riga non valida.',
  duplicate_calendar_property:'Il calendario contiene una proprietà ripetuta.',
  unsupported_calendar_component:'Il calendario contiene un componente non supportato.',
  unsupported_calendar_method:'Sono supportati solo calendari senza metodo o con metodo PUBLISH.',
  unsupported_recurrence:'Il calendario contiene ricorrenze non supportate.',
  unsupported_duration:'Il calendario usa una durata invece di date esplicite.',
  unsupported_event_date:'Usa eventi con DTSTART e DTEND espliciti di tipo DATE, senza fuso orario.',
  invalid_date:'Controlla la data: sono supportati gli anni dal 1900 al 2199.',
  invalid_date_range:'La data finale deve essere successiva a quella iniziale.',
  invalid_event_status:'Il calendario contiene uno stato evento non supportato.',
  invalid_event_transparency:'Il calendario contiene una trasparenza evento non supportata.',
  invalid_blocks:'I periodi bloccati non hanno un formato valido.',
  too_many_blocks:'Puoi conservare al massimo 1000 periodi.',
  invalid_unit:'Usa un nome locale per l’unità, da 1 a 80 caratteri.',
  invalid_source:'La fonte del calendario non è supportata.',
  invalid_block_id:'Un identificativo locale non è valido o è ripetuto.',
  invalid_batch_id:'Il gruppo di importazione non è valido.',
  invalid_timestamp:'La data di importazione non è valida.',
  invalid_query:'I criteri del controllo sovrapposizioni non sono validi.',
  random_unavailable:'Il browser non può generare identificativi locali sicuri.'
 };
 return Object.assign(new Error(messages[code]||messages.invalid_calendar),{code});
}

function kkStayDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw kkStayError('invalid_date');
 const year=Number(value.slice(0,4)),month=Number(value.slice(5,7)),day=Number(value.slice(8,10));
 const leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(year<KK_STAY_CALENDAR_LIMITS.minYear||year>KK_STAY_CALENDAR_LIMITS.maxYear||month<1||month>12||day<1||day>days[month-1])throw kkStayError('invalid_date');
 return value;
}

function kkStayRange(start,end){
 kkStayDate(start);kkStayDate(end);
 if(end<=start)throw kkStayError('invalid_date_range');
 return {start,end};
}

function kkStayTimestamp(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))throw kkStayError('invalid_timestamp');
 try{kkStayDate(value.slice(0,10));}catch{throw kkStayError('invalid_timestamp');}
 const time=Date.parse(value);
 if(!Number.isFinite(time)||new Date(time).toISOString()!==value)throw kkStayError('invalid_timestamp');
 return value;
}

function kkStayUnit(value){
 if(typeof value!=='string'||value.length>KK_STAY_CALENDAR_LIMITS.maxUnitLength||!value.trim()||!/^[\p{L}\p{N} ._'’\-]+$/u.test(value))throw kkStayError('invalid_unit');
 return value.trim();
}

function kkStayNewId(prefix){
 const cryptoAPI=globalThis.crypto;
 if(!cryptoAPI||typeof cryptoAPI.getRandomValues!=='function')throw kkStayError('random_unavailable');
 const bytes=new Uint8Array(16);cryptoAPI.getRandomValues(bytes);
 return prefix+Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
}

function kkStayContentLine(line){
 let quoted=false,colon=-1;
 for(let i=0;i<line.length;i++){
  if(line[i]==='"')quoted=!quoted;
  else if(line[i]===':'&&!quoted){colon=i;break;}
 }
 if(colon<1||quoted)throw kkStayError('invalid_calendar_line');
 const header=line.slice(0,colon),parts=[];let from=0;quoted=false;
 for(let i=0;i<header.length;i++){
  if(header[i]==='"')quoted=!quoted;
  else if(header[i]===';'&&!quoted){parts.push(header.slice(from,i));from=i+1;}
 }
 parts.push(header.slice(from));
 const name=parts.shift().toUpperCase();
 if(!/^[A-Z][A-Z0-9-]*$/.test(name))throw kkStayError('invalid_calendar_line');
 const params=Object.create(null);
 for(const part of parts){
  const equal=part.indexOf('=');
  if(equal<1)throw kkStayError('invalid_calendar_line');
  const key=part.slice(0,equal).toUpperCase();let value=part.slice(equal+1);
  if(!/^[A-Z][A-Z0-9-]*$/.test(key)||Object.hasOwn(params,key)||!value)throw kkStayError('invalid_calendar_line');
  if(value.startsWith('"')){
   if(!value.endsWith('"')||value.length<2||value.slice(1,-1).includes('"'))throw kkStayError('invalid_calendar_line');
   value=value.slice(1,-1);
  }else if(/["\s]/.test(value))throw kkStayError('invalid_calendar_line');
  params[key]=value;
 }
 return {name,params,value:line.slice(colon+1)};
}

function kkStayICSDate(property){
 if(Object.keys(property.params).length!==1||property.params.VALUE?.toUpperCase()!=='DATE'||!/^\d{8}$/.test(property.value))throw kkStayError('unsupported_event_date');
 return kkStayDate(property.value.slice(0,4)+'-'+property.value.slice(4,6)+'-'+property.value.slice(6,8));
}

export function kkStayParseICS(text){
 if(typeof text!=='string')throw kkStayError('invalid_calendar');
 if(text.length>KK_STAY_CALENDAR_LIMITS.maxInputBytes||new TextEncoder().encode(text).byteLength>KK_STAY_CALENDAR_LIMITS.maxInputBytes)throw kkStayError('calendar_too_large');
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)||/\r(?!\n)/.test(text))throw kkStayError('invalid_calendar_line');
 const physical=text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').split('\n'),lines=[];
 for(const line of physical){
  if(/^[ \t]/.test(line)){
   if(!lines.length||!lines[lines.length-1])throw kkStayError('invalid_calendar_line');
   lines[lines.length-1]+=line.slice(1);
  }else lines.push(line);
 }
 let state='before',current=null,eventCount=0,skippedCancelled=0,skippedTransparent=0;
 const events=[],calendarSeen=new Set();
 for(const line of lines){
  if(line==='')continue;
  const property=kkStayContentLine(line),{name,params,value}=property;
  if(name==='BEGIN'){
   if(Object.keys(params).length)throw kkStayError('invalid_calendar_line');
   const component=value.toUpperCase();
   if(state==='before'&&component==='VCALENDAR'){state='calendar';continue;}
   if(state==='calendar'&&component==='VEVENT'){
    if(++eventCount>KK_STAY_CALENDAR_LIMITS.maxEvents)throw kkStayError('too_many_events');
    current={seen:new Set(),start:null,end:null,status:null,transparency:null};state='event';continue;
   }
   throw kkStayError('unsupported_calendar_component');
  }
  if(name==='END'){
   if(Object.keys(params).length)throw kkStayError('invalid_calendar_line');
   const component=value.toUpperCase();
   if(state==='event'&&component==='VEVENT'){
    if(!current.start||!current.end)throw kkStayError('unsupported_event_date');
    const range=kkStayRange(current.start,current.end);
    // Validate the entire event before skipping it. Cancellation wins when both
    // flags are present, so the skip counters represent disjoint event counts.
    if(current.status==='CANCELLED')skippedCancelled++;
    else if(current.transparency==='TRANSPARENT')skippedTransparent++;
    else events.push(range);
    current=null;state='calendar';continue;
   }
   if(state==='calendar'&&component==='VCALENDAR'){state='after';continue;}
   throw kkStayError('invalid_calendar');
  }
  if(state==='before'||state==='after')throw kkStayError('invalid_calendar');
  if(['RRULE','RDATE','EXDATE','EXRULE','RECURRENCE-ID'].includes(name))throw kkStayError('unsupported_recurrence');
  if(name==='DURATION')throw kkStayError('unsupported_duration');
  if(state==='calendar'){
   if(['DTSTART','DTEND','STATUS','TRANSP'].includes(name))throw kkStayError('invalid_calendar');
   if(['VERSION','PRODID','METHOD','CALSCALE'].includes(name)){
    if(calendarSeen.has(name))throw kkStayError('duplicate_calendar_property');
    calendarSeen.add(name);
    if(Object.keys(params).length)throw kkStayError('invalid_calendar_line');
    if(name==='VERSION'&&value!=='2.0')throw kkStayError('invalid_calendar');
    if(name==='METHOD'&&value.toUpperCase()!=='PUBLISH')throw kkStayError('unsupported_calendar_method');
    if(name==='CALSCALE'&&value.toUpperCase()!=='GREGORIAN')throw kkStayError('invalid_calendar');
   }
   continue;
  }
  if(['VERSION','PRODID','METHOD','CALSCALE'].includes(name))throw kkStayError('invalid_calendar');
  if(['DTSTART','DTEND','STATUS','TRANSP'].includes(name)){
   if(current.seen.has(name))throw kkStayError('duplicate_calendar_property');
   current.seen.add(name);
   if(name==='DTSTART')current.start=kkStayICSDate(property);
   if(name==='DTEND')current.end=kkStayICSDate(property);
   if(name==='STATUS'){
    if(Object.keys(params).length||!['CONFIRMED','TENTATIVE','CANCELLED'].includes(value.toUpperCase()))throw kkStayError('invalid_event_status');
    current.status=value.toUpperCase();
   }
   if(name==='TRANSP'){
    if(Object.keys(params).length||!['OPAQUE','TRANSPARENT'].includes(value.toUpperCase()))throw kkStayError('invalid_event_transparency');
    current.transparency=value.toUpperCase();
   }
  }
  // Other valid content lines are intentionally discarded, including raw UID,
  // SUMMARY, DESCRIPTION, LOCATION, CONTACT, ATTENDEE, ORGANIZER, URL and dates
  // describing source edits. They never become local data or error messages.
 }
 if(state!=='after'||!calendarSeen.has('VERSION'))throw kkStayError('invalid_calendar');
 return {events,skippedCancelled,skippedTransparent,warnings:eventCount===0?['empty_calendar']:events.length===0?['all_events_skipped']:[]};
}

export function kkStayValidateBlocks(blocks){
 if(!Array.isArray(blocks))throw kkStayError('invalid_blocks');
 if(blocks.length>KK_STAY_CALENDAR_LIMITS.maxBlocks)throw kkStayError('too_many_blocks');
 const ids=new Set();let generatedBatch=null,generatedTime=null;
 return blocks.map(block=>{
  if(!block||typeof block!=='object'||Array.isArray(block))throw kkStayError('invalid_blocks');
  const unitId=kkStayUnit(block.unitId);
  if(!KK_STAY_CALENDAR_SOURCES.includes(block.source))throw kkStayError('invalid_source');
  const range=kkStayRange(block.start,block.end);
  const id=block.id===undefined?kkStayNewId('ksb_'):block.id;
  if(typeof id!=='string'||!/^ksb_[a-f0-9]{32}$/.test(id)||ids.has(id))throw kkStayError('invalid_block_id');
  ids.add(id);
  if(block.batchId===undefined&&!generatedBatch)generatedBatch=kkStayNewId('ksbatch_');
  const batchId=block.batchId===undefined?generatedBatch:block.batchId;
  if(typeof batchId!=='string'||!/^ksbatch_[a-f0-9]{32}$/.test(batchId))throw kkStayError('invalid_batch_id');
  if(block.importedAt===undefined&&!generatedTime)generatedTime=kkStayTimestamp(new Date().toISOString());
  const importedAt=kkStayTimestamp(block.importedAt===undefined?generatedTime:block.importedAt);
  return {id,unitId,source:block.source,...range,importedAt,batchId};
 });
}

export function kkStayConflicts(blocks,query){
 if(!query||typeof query!=='object'||Array.isArray(query))throw kkStayError('invalid_query');
 const unitId=kkStayUnit(query.unitId),{start,end}=kkStayRange(query.start,query.end),exclude=query.excludeIds===undefined?[]:query.excludeIds;
 if(!Array.isArray(exclude)||exclude.length>KK_STAY_CALENDAR_LIMITS.maxBlocks||exclude.some(id=>typeof id!=='string'||!/^ksb_[a-f0-9]{32}$/.test(id)))throw kkStayError('invalid_query');
 const excluded=new Set(exclude);
 return kkStayValidateBlocks(blocks).filter(block=>block.unitId===unitId&&!excluded.has(block.id)&&start<block.end&&end>block.start).sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end)||a.id.localeCompare(b.id));
}

export function kkStayExportICS(blocks,nowISO){
 const clean=kkStayValidateBlocks(blocks),stamp=kkStayTimestamp(nowISO===undefined?new Date().toISOString():nowISO).replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 if(clean.length>KK_STAY_CALENDAR_LIMITS.maxEvents)throw kkStayError('too_many_events');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SYNAPSY//Stay Calendar Snapshot//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 for(const block of clean)lines.push('BEGIN:VEVENT','UID:'+block.id+'@synapsy.invalid','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+block.start.replace(/-/g,''),'DTEND;VALUE=DATE:'+block.end.replace(/-/g,''),'SUMMARY:Blocked period','CLASS:PRIVATE','TRANSP:OPAQUE','END:VEVENT');
 lines.push('END:VCALENDAR');
 return lines.join('\r\n')+'\r\n';
}

export function kkStayCalendarBrowserScript(){
 const helpers=[kkStayError,kkStayDate,kkStayRange,kkStayTimestamp,kkStayUnit,kkStayNewId,kkStayContentLine,kkStayICSDate,kkStayParseICS,kkStayValidateBlocks,kkStayConflicts,kkStayExportICS];
 return '(function(){\nconst KK_STAY_CALENDAR_LIMITS=Object.freeze('+JSON.stringify(KK_STAY_CALENDAR_LIMITS)+');\nconst KK_STAY_CALENDAR_SOURCES=Object.freeze('+JSON.stringify(KK_STAY_CALENDAR_SOURCES)+');\n'+helpers.map(fn=>fn.toString()).join('\n')+'\nglobalThis.KK_STAY_CALENDAR=Object.freeze({parseICS:kkStayParseICS,validateBlocks:kkStayValidateBlocks,conflicts:kkStayConflicts,exportICS:kkStayExportICS,limits:KK_STAY_CALENDAR_LIMITS});\n})();';
}
