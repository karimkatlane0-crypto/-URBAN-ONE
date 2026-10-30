/** Fetch current server state before committing a cursor. Private data stays in memory. */
export function createDBRelaySync(request) {
 let cursor=null,generation=0,pending=null;
 function reset(){cursor=null;generation++;pending=null;}
 function refresh(){
  if(pending)return pending;
  const run=generation;
  const task=(async()=>{
   const status=await request('/api/dbrelay/status');
   let snapshot=null,changes=0,hasMore=false;
   if(cursor===null||status.cursor<cursor){
    snapshot=await request('/api/dbrelay/snapshot');
   }else{
    const page=await request('/api/dbrelay/changes?after='+encodeURIComponent(cursor)+'&limit=100');
    changes=page.changes.length;hasMore=page.hasMore;
    // One snapshot includes the complete current state and its consistent cursor,
    // even when the feed has more than one page. Never acknowledge IDs first.
    if(changes)snapshot=await request('/api/dbrelay/snapshot');
   }
   if(run!==generation)return null; // Account changed while the request was in flight.
   const initial=cursor===null;
   if(snapshot)cursor=snapshot.cursor;
   return {status,snapshot,cursor,changes,hasMore,initial};
  })();
  pending=task;
  task.finally(()=>{if(pending===task)pending=null;}).catch(()=>{});
  return task;
 }
 return {refresh,reset};
}
