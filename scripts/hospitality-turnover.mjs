#!/usr/bin/env node
// Private, operator-run CLI. Not a public API or booking-provider integration.
// Usage: node scripts/hospitality-turnover.mjs --date 2026-10-24 < private-bookings.csv
import {processTurnoverCsv} from '../packages/hospitality/turnover-import.mjs';

const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--date'){
  console.error('USAGE: node scripts/hospitality-turnover.mjs --date YYYY-MM-DD < PRIVATE_BOOKINGS.csv');
  process.exitCode=2;
}else{
  try{
    const chunks=[];let bytes=0;
    for await(const chunk of process.stdin){
      bytes+=chunk.length;
      if(bytes>256000)throw new Error('BOOKING_CSV_SIZE_INVALID');
      chunks.push(chunk);
    }
    const csv=Buffer.concat(chunks).toString('utf8');
    const planned=processTurnoverCsv(csv,{today:args[1]});
    process.stdout.write(JSON.stringify(planned,null,2)+'\n');
  }catch(e){
    // Log only the error identifier, never raw contents of guest exports.
    console.error('TURNOVER_INPUT_REJECTED: '+e.message);
    process.exitCode=1;
  }
}
