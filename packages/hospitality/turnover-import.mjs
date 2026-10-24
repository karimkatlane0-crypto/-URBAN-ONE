// URBAN ONE | Operator-side check-in/check-out task planner.
// Accepts ONLY an authorised, identity-free booking CSV export.
// Does not verify identity, mark physical arrival/departure or contact outside providers.
const FIELDS=['reservation_id','property_id','arrival_date','departure_date'];
const REF=/^[A-Za-z0-9_-]{1,48}$/;
const MAX_BYTES=256000;
const MAX_RECORDS=1000;

function isoDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const t=Date.parse(value+'T00:00:00Z');
  return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===value;
}

function readCsv(text){
  if(typeof text!=='string'||Buffer.byteLength(text,'utf8')>MAX_BYTES)
    throw new Error('BOOKING_CSV_SIZE_INVALID');
  const normalized=text.replace(/^\uFEFF/,'');
  if(/^\s*https?:\/\//i.test(normalized))
    throw new Error('BOOKING_EXPORT_REQUIRED_NOT_A_LINK');
  if(!normalized.trim())throw new Error('BOOKING_CSV_EMPTY');
  const records=[];let row=[];let value='';let quoted=false;let afterQuote=false;
  for(let i=0;i<normalized.length;i++){
    const ch=normalized[i];
    if(quoted){
      if(ch==='"'&&normalized[i+1]==='"'){value+='"';i++;}
      else if(ch==='"') {quoted=false;afterQuote=true;}
      else if(ch==='\n'||ch==='\r') throw new Error('BOOKING_CSV_MULTILINE_REJECTED');
      else value+=ch;
      continue;
    }
    if(afterQuote){
      if(ch!==','&&ch!=='\n'&&ch!=='\r')throw new Error('BOOKING_CSV_MALFORMED');
      afterQuote=false;
    }
    if(ch==='"'){
      if(value.length>0)throw new Error('BOOKING_CSV_MALFORMED');
      quoted=true;
    }else if(ch===','){row.push(value);value='';}
    else if(ch==='\n'||ch==='\r'){
      if(ch==='\r'&&normalized[i+1]==='\n')i++;
      row.push(value);value='';
      if(row.some(v=>v!==''))records.push(row);
      row=[];
      if(records.length>MAX_RECORDS+1)throw new Error('BOOKING_CSV_TOO_MANY_ROWS');
    }else{
      value+=ch;
      if(value.length>256)throw new Error('BOOKING_CSV_FIELD_TOO_LONG');
    }
  }
  if(quoted)throw new Error('BOOKING_CSV_UNCLOSED_QUOTE');
  row.push(value);
  if(row.some(v=>v!==''))records.push(row);
  return records;
}

export function parseTurnoverCsv(text){
  const rows=readCsv(text);
  if(!rows.length)throw new Error('BOOKING_CSV_EMPTY');
  const header=rows.shift();
  if(header.length!==FIELDS.length||new Set(header).size!==FIELDS.length||
    !FIELDS.every(key=>header.includes(key)))
    throw new Error('BOOKING_CSV_HEADER_REQUIRED_NO_GUEST_DATA');
  if(rows.length>MAX_RECORDS)throw new Error('BOOKING_CSV_TOO_MANY_ROWS');
  const seen=new Set();
  return rows.map((cells)=>{
    if(cells.length!==FIELDS.length)throw new Error('BOOKING_CSV_COLUMNS_INVALID');
    const obj=Object.fromEntries(FIELDS.map(key=>[key,cells[header.indexOf(key)]]));
    if(!REF.test(obj.reservation_id)||!REF.test(obj.property_id))
      throw new Error('BOOKING_REFERENCE_INVALID');
    if(!isoDate(obj.arrival_date)||!isoDate(obj.departure_date)||
      obj.arrival_date>=obj.departure_date)
      throw new Error('BOOKING_STAY_DATES_INVALID');
    const identity=obj.property_id+':'+obj.reservation_id;
    if(seen.has(identity))throw new Error('BOOKING_DUPLICATE');
    seen.add(identity);
    return Object.freeze(obj);
  });
}

/**
 * Date-only, property-local operational checklist.
 * No staff/physical identity evidence is inferred from a calendar.
 * The result is a task suggestion, never a completed guest check-in/out.
 */
export function planTurnoverTasks(bookings,{today}={}){
  if(!isoDate(today))throw new Error('PROPERTY_LOCAL_DATE_REQUIRED');
  if(!Array.isArray(bookings)||bookings.length>MAX_RECORDS)throw new Error('BOOKING_SET_INVALID');
  const tasks=[];
  for(const b of bookings){
    if(!b||!REF.test(b.reservation_id)||!REF.test(b.property_id)||
      !isoDate(b.arrival_date)||!isoDate(b.departure_date)||
      b.arrival_date>=b.departure_date)throw new Error('BOOKING_INVALID');
    for(const [kind,date] of [['check_in',b.arrival_date],['check_out',b.departure_date]]){
      // A task remains pending even after its due date until evidence from
      // an authenticated operator is recorded elsewhere.
      const phase=date>today?'scheduled':date===today?'due_today':'overdue_unconfirmed';
      tasks.push({
        taskId:b.property_id+':'+b.reservation_id+':'+kind+':'+date,
        reservationId:b.reservation_id,propertyId:b.property_id,
        event:kind,date,phase,
        status:'OPERATOR_CONFIRMATION_REQUIRED',
        guestIdentityVerified:false,
        physicalPresenceVerified:false,
        keyReleaseAuthorized:false,
        providerPmsUpdated:false,
        alloggiatiSubmission:'NOT_PERFORMED',
        paymentCollected:false,
        requiresStaffReview:true
      });
    }
  }
  return {mode:'private_operator_planner',simulatedProviderActions:false,
    reservationCount:bookings.length,taskCount:tasks.length,today,
    automation:'DATE_DUE_TASK_GENERATION_ONLY',
    externalProvidersCalled:false,guestCheckInAutomaticallyCompleted:false,
    actualGuestCheckOutAutomaticallyCompleted:false,alloggiatiWebSent:false,
    tasks:tasks.sort((a,b)=>a.date.localeCompare(b.date)||
      a.propertyId.localeCompare(b.propertyId)||a.taskId.localeCompare(b.taskId))};
}

export function processTurnoverCsv(csv,{today}={}){
  const bookings=parseTurnoverCsv(csv);
  return planTurnoverTasks(bookings,{today});
}
