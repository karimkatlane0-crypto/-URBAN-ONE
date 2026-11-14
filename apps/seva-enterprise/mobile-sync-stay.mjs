// Operational stay register only: no OTA, identity filing, access keys or payments.
export const stayFields=['bookingReference','unit','guestReference','arrivalDate','departureDate','status'];
const fail=code=>{throw Object.assign(Error(code),{status:409,code});};
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)
  &&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
export function validateStay(previous,next,operation='upsert') {
  if(operation==='delete')fail('stay_history_must_be_retained');
  if(!next||stayFields.some(k=>typeof next[k]!=='string'||!next[k].trim()))fail('stay_fields_required');
  if(!date(next.arrivalDate)||!date(next.departureDate)||next.departureDate<=next.arrivalDate)
    fail('stay_dates_invalid');
  const transitions={planned:['planned','checked_in','cancelled'],checked_in:['checked_out'],checked_out:[],cancelled:[]};
  if(!Object.hasOwn(transitions,next.status))fail('stay_status_invalid');
  if(!previous) {if(next.status!=='planned')fail('stay_must_start_planned');return;}
  if(!transitions[previous.status]?.includes(next.status))fail('stay_transition_forbidden');
  if(previous.status!=='planned'||next.status!=='planned') {
    for(const k of stayFields.filter(k=>k!=='status'))if(previous[k]!==next[k])fail('stay_details_locked');
  }
}
