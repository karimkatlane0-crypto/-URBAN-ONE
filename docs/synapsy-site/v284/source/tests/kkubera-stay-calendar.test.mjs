import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {KK_STAY_CALENDAR_LIMITS,kkStayParseICS,kkStayValidateBlocks,kkStayConflicts,kkStayExportICS,kkStayCalendarBrowserScript} from '../src/kkubera-stay-calendar.js';

const stamp='2026-11-15T13:00:00.000Z';
const calendar=(events='',extra='')=>'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Synthetic test//EN\r\n'+extra+events+'END:VCALENDAR\r\n';
const event=(extra='',start='20261120',end='20261122')=>'BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:'+start+'\r\nDTEND;VALUE=DATE:'+end+'\r\n'+extra+'END:VEVENT\r\n';
const id=n=>'ksb_'+n.toString(16).padStart(32,'0');
const batch='ksbatch_'+'c'.repeat(32);
const block=(n=1,extra={})=>({id:id(n),unitId:'Camera 1',source:'Booking.com',start:'2026-11-20',end:'2026-11-22',importedAt:stamp,batchId:batch,...extra});
const fails=(fn,code)=>assert.throws(fn,error=>error instanceof Error&&error.code===code);

test('ICS imports only date ranges and never retains guest details, raw identifiers or URLs',()=>{
 const raw=calendar(event('UID:guest-secret-token\r\nSUMMARY:Private Guest\r\nDESCRIPTION:Private notes\\nSecond line\r\nLOCATION:Private street\r\nATTENDEE;CN="Private Guest":mailto:guest@example.test\r\nORGANIZER:mailto:host@example.test\r\nURL:https://example.test/private?token=SECRET\r\nDTSTAMP:20261101T100000Z\r\n'));
 const result=kkStayParseICS(raw);
 assert.deepEqual(result,{events:[{start:'2026-11-20',end:'2026-11-22'}],skippedCancelled:0,skippedTransparent:0,warnings:[]});
 assert.doesNotMatch(JSON.stringify(result),/guest|Private|mailto|SECRET|token|example\.test/i);
});

test('unfolds content lines and handles quoted parameter colons without interpreting private content',()=>{
 const raw=calendar(event('DESCRIPTION;ALTREP="https://example.test/private":<script>private()\r\n </script>\r\nUID:guest-\r\n\tsecret\r\n')).replace('20261120','202611\r\n 20');
 assert.deepEqual(kkStayParseICS('\uFEFF'+raw).events,[{start:'2026-11-20',end:'2026-11-22'}]);
 assert.deepEqual(kkStayParseICS(raw.replace(/\r\n/g,'\n')).events,[{start:'2026-11-20',end:'2026-11-22'}]);
});

test('real Gregorian leap days and documented date boundaries are accepted',()=>{
 for(const [start,end] of [['20000229','20000301'],['20240229','20240301'],['19000101','19000102'],['21991230','21991231']]){
  assert.equal(kkStayParseICS(calendar(event('',start,end))).events.length,1);
 }
});

test('invalid dates are rejected rather than normalised into another day or year',()=>{
 for(const start of ['19000229','21000229','20260229','20260431','20260020','20261320','20260100','20260132','18991231','22000101']){
  fails(()=>kkStayParseICS(calendar(event('',start,'21991231'))),'invalid_date');
 }
 for(const [start,end] of [['20261120','20261120'],['20261122','20261120']])fails(()=>kkStayParseICS(calendar(event('',start,end))),'invalid_date_range');
});

test('date-time, timezone and implicit DATE values are rejected',()=>{
 const raw=calendar(event());
 for(const replacement of ['DTSTART:20261120','DTSTART:20261120T120000Z','DTSTART;VALUE=DATE-TIME:20261120T120000','DTSTART;TZID=Europe/Rome:20261120T120000','DTSTART;VALUE=DATE;TZID=Europe/Rome:20261120','DTSTART;VALUE=DATE;X-OPTION=1:20261120']){
  fails(()=>kkStayParseICS(raw.replace('DTSTART;VALUE=DATE:20261120',replacement)),'unsupported_event_date');
 }
 fails(()=>kkStayParseICS(raw.replace('DTEND;VALUE=DATE:20261122\r\n','')),'unsupported_event_date');
});

test('duplicates of date and interpretation properties are rejected; separate duplicate intervals survive',()=>{
 for(const extra of ['DTSTART;VALUE=DATE:20261121\r\n','DTEND;VALUE=DATE:20261123\r\n','STATUS:CANCELLED\r\nSTATUS:CONFIRMED\r\n','TRANSP:OPAQUE\r\nTRANSP:TRANSPARENT\r\n'])fails(()=>kkStayParseICS(calendar(event(extra))),'duplicate_calendar_property');
 fails(()=>kkStayParseICS(calendar(event()).replace('DTSTART;VALUE=DATE','DTSTART;VALUE=DATE;VALUE=DATE')),'invalid_calendar_line');
 assert.equal(kkStayParseICS(calendar(event()+event())).events.length,2);
});

test('cancelled and transparent events are counted only after complete validation',()=>{
 const result=kkStayParseICS(calendar(event('STATUS:CANCELLED\r\n')+event('TRANSP:TRANSPARENT\r\n')+event('STATUS:CANCELLED\r\nTRANSP:TRANSPARENT\r\n')+event('STATUS:TENTATIVE\r\n')));
 assert.equal(result.skippedCancelled,2);assert.equal(result.skippedTransparent,1);assert.equal(result.events.length,1);
 fails(()=>kkStayParseICS(calendar(event('STATUS:CANCELLED\r\n','20260229','20260302'))),'invalid_date');
 fails(()=>kkStayParseICS(calendar(event('TRANSP:TRANSPARENT\r\n')).replace('DTEND;VALUE=DATE:20261122\r\n','')),'unsupported_event_date');
});

test('unsupported status and transparency cannot silently change which dates are blocked',()=>{
 fails(()=>kkStayParseICS(calendar(event('STATUS:UNKNOWN\r\n'))),'invalid_event_status');
 fails(()=>kkStayParseICS(calendar(event('TRANSP:FREE\r\n'))),'invalid_event_transparency');
 fails(()=>kkStayParseICS(calendar(event('STATUS;X-OPTION=1:CONFIRMED\r\n'))),'invalid_event_status');
});

test('recurrences and duration-based intervals fail the whole import, including skipped events',()=>{
 for(const property of ['RRULE:FREQ=DAILY','RDATE;VALUE=DATE:20261123','EXDATE;VALUE=DATE:20261120','EXRULE:FREQ=DAILY','RECURRENCE-ID;VALUE=DATE:20261120']){
  fails(()=>kkStayParseICS(calendar(event()+event('STATUS:CANCELLED\r\n'+property+'\r\n'))),'unsupported_recurrence');
 }
 fails(()=>kkStayParseICS(calendar(event('DURATION:P2D\r\n'))),'unsupported_duration');
});

test('only absent method or PUBLISH is supported; cancellation/invitation methods are refused',()=>{
 assert.equal(kkStayParseICS(calendar(event(),'METHOD:PUBLISH\r\n')).events.length,1);
 for(const method of ['CANCEL','REQUEST','REPLY','ADD','REFRESH'])fails(()=>kkStayParseICS(calendar(event(),'METHOD:'+method+'\r\n')),'unsupported_calendar_method');
 fails(()=>kkStayParseICS(calendar(event(),'METHOD:PUBLISH\r\nMETHOD:PUBLISH\r\n')),'duplicate_calendar_property');
});

test('nested calendars, alarms, timezones and unsupported components fail closed',()=>{
 for(const component of ['VTIMEZONE','VALARM','VTODO','VFREEBUSY','VCALENDAR','VEVENT']){
  fails(()=>kkStayParseICS(calendar(event('BEGIN:'+component+'\r\nEND:'+component+'\r\n'))),'unsupported_calendar_component');
 }
 fails(()=>kkStayParseICS(calendar('BEGIN:VTIMEZONE\r\nEND:VTIMEZONE\r\n')),'unsupported_calendar_component');
});

test('malformed structures and content lines never return a partial successful result',()=>{
 const cases=[calendar(event()).replace('END:VEVENT\r\n',''),calendar(event()).replace('END:VCALENDAR\r\n',''),calendar(event())+'untrusted text',calendar(event())+calendar(event()),'BEGIN:VCALENDAR\nEND:VCALENDAR',calendar(event(),'VERSION:2.0\r\n'),calendar(event('INVALID LINE\r\n')),calendar(event('SUMMARY;CN="unterminated:value\r\n')),calendar(event()).replace('20261120','2026\r1120'),calendar(event('DESCRIPTION:a\u0000b\r\n'))];
 for(const value of cases)assert.throws(()=>kkStayParseICS(value),error=>typeof error.code==='string');
});

test('empty calendars and entirely skipped calendars are explicit, without invented events',()=>{
 assert.deepEqual(kkStayParseICS(calendar()),{events:[],skippedCancelled:0,skippedTransparent:0,warnings:['empty_calendar']});
 assert.deepEqual(kkStayParseICS(calendar(event('STATUS:CANCELLED\r\n'))),{events:[],skippedCancelled:1,skippedTransparent:0,warnings:['all_events_skipped']});
});

test('bounds count UTF-8 bytes and include cancelled events in the 500-event limit',()=>{
 fails(()=>kkStayParseICS('x'.repeat(KK_STAY_CALENDAR_LIMITS.maxInputBytes+1)),'calendar_too_large');
 fails(()=>kkStayParseICS(calendar(event('DESCRIPTION:'+'界'.repeat(90000)+'\r\n'))),'calendar_too_large');
 assert.equal(kkStayParseICS(calendar(event().repeat(500))).events.length,500);
 fails(()=>kkStayParseICS(calendar(event('STATUS:CANCELLED\r\n').repeat(501))),'too_many_events');
});

test('local blocks are projected, independent from source identifiers, and input is never mutated',()=>{
 const input=Object.freeze([Object.freeze({unitId:' Camera 1 ',source:'Booking.com',start:'2026-11-20',end:'2026-11-22',uid:'guest-uid',summary:'private',url:'https://example.test/secret'})]);
 const clean=kkStayValidateBlocks(input);
 assert.deepEqual(Object.keys(clean[0]),['id','unitId','source','start','end','importedAt','batchId']);
 assert.match(clean[0].id,/^ksb_[a-f0-9]{32}$/);assert.match(clean[0].batchId,/^ksbatch_[a-f0-9]{32}$/);
 assert.equal(clean[0].unitId,'Camera 1');assert.equal(input[0].uid,'guest-uid');
 assert.doesNotMatch(JSON.stringify(clean),/guest|private|example\.test/);
});

test('new records receive unique local IDs and one import batch without altering existing metadata',()=>{
 const base={unitId:'Suite Étoile',source:'Altro calendario',start:'2026-11-20',end:'2026-11-22'};
 const clean=kkStayValidateBlocks([block(),{...base},{...base}]);
 assert.equal(new Set(clean.map(row=>row.id)).size,3);
 assert.equal(clean[1].batchId,clean[2].batchId);assert.equal(clean[1].importedAt,clean[2].importedAt);
 assert.equal(clean[0].batchId,batch);assert.equal(clean[0].importedAt,stamp);
 assert.deepEqual(kkStayValidateBlocks(clean),clean);
});

test('block validation rejects invalid sources, units, IDs and date ranges',()=>{
 for(const unitId of ['', ' '.repeat(3),'a'.repeat(81),'<img>','guest@example.test','Room\n1','Room/1'])fails(()=>kkStayValidateBlocks([block(1,{unitId})]),'invalid_unit');
 for(const source of ['', 'ics','manual','Booking.com\n',{},null])fails(()=>kkStayValidateBlocks([block(1,{source})]),'invalid_source');
 fails(()=>kkStayValidateBlocks([block(1,{id:'guest-uid'})]),'invalid_block_id');
 fails(()=>kkStayValidateBlocks([block(),block()]),'invalid_block_id');
 fails(()=>kkStayValidateBlocks([block(1,{batchId:'source-id'})]),'invalid_batch_id');
 fails(()=>kkStayValidateBlocks([block(1,{start:'2026-02-30'})]),'invalid_date');
 fails(()=>kkStayValidateBlocks([block(1,{end:'2026-11-20'})]),'invalid_date_range');
 for(const input of [null,{},[null],[[]]])fails(()=>kkStayValidateBlocks(input),'invalid_blocks');
});

test('import timestamps are canonical UTC metadata, without silent rollover',()=>{
 for(const importedAt of [null,'2026-11-15','2026-11-15T13:00:00Z','2026-11-15T13:00:00.000+01:00','2026-02-30T13:00:00.000Z','2026-11-15T24:00:00.000Z','2026-11-15T13:60:00.000Z'])fails(()=>kkStayValidateBlocks([block(1,{importedAt})]),'invalid_timestamp');
});

test('storage limit permits 1000 blocks and rejects one more without truncating',()=>{
 const rows=Array.from({length:1000},(_,index)=>block(index+1));
 assert.equal(kkStayValidateBlocks(rows).length,1000);
 fails(()=>kkStayValidateBlocks([...rows,block(1001)]),'too_many_blocks');
});

test('conflicts use the selected unit and half-open intervals, preserving adjacent checkout',()=>{
 const rows=[block(1),block(2,{start:'2026-11-22',end:'2026-11-24',source:'Manuale'}),block(3,{unitId:'Camera 2'}),block(4,{start:'2026-11-19',end:'2026-11-20'})];
 assert.deepEqual(kkStayConflicts(rows,{unitId:'Camera 1',start:'2026-11-20',end:'2026-11-22'}).map(row=>row.id),[id(1)]);
 assert.deepEqual(kkStayConflicts(rows,{unitId:'Camera 1',start:'2026-11-21',end:'2026-11-23'}).map(row=>row.id),[id(1),id(2)]);
 assert.equal(kkStayConflicts(rows,{unitId:'Camera 1',start:'2026-11-24',end:'2026-11-25'}).length,0);
 assert.equal(kkStayConflicts(rows,{unitId:'Camera 3',start:'2026-11-20',end:'2026-11-22'}).length,0);
});

test('conflict exclusions use local IDs and do not mutate caller data',()=>{
 const rows=Object.freeze([Object.freeze(block(1)),Object.freeze(block(2))]);
 const result=kkStayConflicts(rows,{unitId:'Camera 1',start:'2026-11-20',end:'2026-11-22',excludeIds:[id(1)]});
 assert.deepEqual(result.map(row=>row.id),[id(2)]);assert.notEqual(result[0],rows[1]);
 fails(()=>kkStayConflicts(rows,{unitId:'Camera 1',start:'2026-11-20',end:'2026-11-22',excludeIds:['guest-id']}),'invalid_query');
 fails(()=>kkStayConflicts(rows,null),'invalid_query');
});

test('ICS export is sanitised and stable by local block identity, not raw calendar identity',()=>{
 const rows=[block(1,{unitId:'Private local unit',summary:'Guest Person',uid:'source-guest-id',description:'secret',url:'https://example.test/private'}),block(2,{start:'2026-12-24',end:'2026-12-26'})];
 const first=kkStayExportICS(rows,stamp),second=kkStayExportICS(rows,'2026-11-16T13:00:00.000Z');
 assert.doesNotMatch(first,/Private local|Guest Person|source-guest-id|secret|example\.test|Booking\.com/);
 assert.match(first,new RegExp('UID:'+id(1)+'@synapsy\\.invalid'));
 assert.deepEqual(first.match(/^UID:.+$/gm),second.match(/^UID:.+$/gm));
 assert.ok(first.endsWith('\r\n'));assert.equal(first.replace(/\r\n/g,'').includes('\n'),false);
 assert.deepEqual(kkStayParseICS(first).events,[{start:'2026-11-20',end:'2026-11-22'},{start:'2026-12-24',end:'2026-12-26'}]);
});

test('exports preserve separate identical intervals and support explicit empty snapshots',()=>{
 assert.equal(kkStayParseICS(kkStayExportICS([block(1),block(2)],stamp)).events.length,2);
 assert.deepEqual(kkStayParseICS(kkStayExportICS([],stamp)).warnings,['empty_calendar']);
 fails(()=>kkStayExportICS([block()],'not-a-timestamp'),'invalid_timestamp');
});

test('an exported ICS remains within parser limits; large storage uses a separate backup path',()=>{
 const rows=Array.from({length:500},(_,index)=>block(index+1));
 const output=kkStayExportICS(rows,stamp);
 assert.ok(new TextEncoder().encode(output).byteLength<=KK_STAY_CALENDAR_LIMITS.maxInputBytes);
 assert.equal(kkStayParseICS(output).events.length,500);
 fails(()=>kkStayExportICS([...rows,block(501)],stamp),'too_many_events');
});

test('browser script is standalone raw JS and matches module behaviour without any network/storage APIs',()=>{
 const source=kkStayCalendarBrowserScript(),context=vm.createContext({crypto:webcrypto,TextEncoder});
 assert.doesNotMatch(source,/<script|<\/script|\bimport\s|\bfetch\s*\(|localStorage|sessionStorage/);
 vm.runInContext(source,context);const api=context.KK_STAY_CALENDAR;
 assert.equal(typeof api.parseICS,'function');assert.equal(typeof api.validateBlocks,'function');assert.equal(typeof api.conflicts,'function');assert.equal(typeof api.exportICS,'function');
 assert.deepEqual(JSON.parse(JSON.stringify(api.parseICS(calendar(event())))),kkStayParseICS(calendar(event())));
 const clean=api.validateBlocks([{unitId:'Camera 1',source:'Manuale',start:'2026-11-20',end:'2026-11-22'}]);
 assert.match(clean[0].id,/^ksb_[a-f0-9]{32}$/);assert.equal(api.parseICS(api.exportICS(clean,stamp)).events.length,1);
 vm.runInContext(source,context);assert.equal(context.KK_STAY_CALENDAR.limits.maxEvents,500);
 assert.equal(Object.isFrozen(api),true);assert.equal(Object.isFrozen(api.limits),true);
});

test('missing secure randomness refuses new IDs instead of deriving them from guest data',()=>{
 const context=vm.createContext({TextEncoder});vm.runInContext(kkStayCalendarBrowserScript(),context);
 assert.throws(()=>context.KK_STAY_CALENDAR.validateBlocks([{unitId:'Camera 1',source:'Manuale',start:'2026-11-20',end:'2026-11-22'}]),error=>error.code==='random_unavailable');
 assert.equal(context.KK_STAY_CALENDAR.validateBlocks([block()]).length,1);
});

test('errors never interpolate raw file content or supplied private identifiers',()=>{
 let error;try{kkStayParseICS(calendar(event('UID:PRIVATE_GUEST_TOKEN\r\nDTSTART;VALUE=DATE:20261121\r\n')));}catch(value){error=value;}
 assert.equal(error.code,'duplicate_calendar_property');assert.doesNotMatch(error.message,/PRIVATE_GUEST_TOKEN|20261121/);
});
