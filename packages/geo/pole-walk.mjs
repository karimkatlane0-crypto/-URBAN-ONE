// No tracking, geocoder, push, or network I/O. Pure gate for foreground, consented GPS alerts.
export function distanceMeters(a,b){
  for(const p of [a,b]){
    if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180)
      throw new Error('INVALID_COORDINATES');
  }
  const radians=n=>n*Math.PI/180;
  const dLat=radians(b.lat-a.lat),dLng=radians(b.lng-a.lng);
  const x=Math.sin(dLat/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(dLng/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
}
export function evaluateWalkAlerts({current,targets=[],premiumVerified=false,positionConsent=false,
  foreground=false,now=Date.now(),previous={},radiusMeters=75}={}){
  if(!positionConsent||!foreground)return {alerts:[],reason:'FOREGROUND_CONSENT_REQUIRED'};
  if(!premiumVerified)return {alerts:[],reason:'SERVER_PREMIUM_ENTITLEMENT_REQUIRED'};
  if(!Array.isArray(targets)||targets.length>100)throw new Error('INVALID_TARGETS');
  if(!Number.isFinite(now)||!Number.isFinite(radiusMeters)||radiusMeters<25||radiusMeters>200)
    throw new Error('INVALID_WALK_OPTIONS');
  distanceMeters(current,current);
  const alerts=[];
  for(const item of targets){
    if(!item||item.ownerPublicationAuthorized!==true||item.geocodingVerified!==true||
      item.notificationOptIn!==true||!['sale','rent'].includes(item.status)||
      !/^[a-zA-Z0-9_-]{3,90}$/.test(item.id||''))continue;
    if(!item.position||!Number.isFinite(item.position.lat)||!Number.isFinite(item.position.lng))continue;
    const distance=distanceMeters(current,item.position);
    if(distance>radiusMeters)continue;
    if(Number.isFinite(previous[item.id])&&now-previous[item.id]<24*60*60*1000)continue;
    // Return ID only, not address/user coordinates. A verified private runtime resolves title.
    alerts.push({listingId:item.id,distanceMeters:Math.round(distance),type:'USER_OPT_IN_FOREGROUND_ONLY'});
  }
  return {alerts,reason:alerts.length?'ELIGIBLE':'NO_VERIFIED_OPT_IN_LISTINGS'};
}
