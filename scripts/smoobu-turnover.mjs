#!/usr/bin/env node
// Run on a trusted operator-controlled server or PC; no network calls.
// Never commit or upload an actual Smoobu JSON export (may include guest PII).
import {prepareSmoobuTurnover} from '../packages/hospitality/pms-smoobu-turnover.mjs';

const args=process.argv.slice(2);
function param(name){const at=args.indexOf(name);return at<0?null:args[at+1]}
const date=param('--date');
const apartment=param('--apartment');
const property=param('--property');
const approved=args.includes('--authorized-export');
const usage='USAGE: node scripts/smoobu-turnover.mjs --date YYYY-MM-DD --apartment ID --property PROPERTY-REF --authorized-export < PRIVATE_SMOOBU_JSON';
if(!date||!apartment||!property||!approved||args.length!==7){
  console.error(usage);process.exitCode=2;
}else{
 try{
  const chunks=[];let length=0;
  for await(const chunk of process.stdin){
   length+=chunk.length;
   if(length>512000)throw new Error('SMOOBU_EXPORT_TOO_LARGE');
   chunks.push(chunk);
  }
  let payload;
  try{payload=JSON.parse(Buffer.concat(chunks).toString('utf8'))}
  catch{throw new Error('SMOOBU_JSON_INVALID')}
  const plan=prepareSmoobuTurnover(payload,{
   today:date,propertyMapping:{[apartment]:property},
   authorizedExport:true
  });
  process.stdout.write(JSON.stringify(plan,null,2)+'\n');
 }catch(e){
  // Never log any provider JSON, guest fields, URLs, credentials or headers.
  const allowedError=/^[A-Z0-9_]+$/;
  console.error('SMOOBU_TURNOVER_REJECTED: '+
    (allowedError.test(e.message)?e.message:'INVALID_INPUT'));
  process.exitCode=1;
 }
}
