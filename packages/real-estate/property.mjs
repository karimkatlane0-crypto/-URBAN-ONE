export const statuses=['sale','sold','rent','rented','reserved','unavailable','off_market'];
export function normalizeAddress({country,city,street,number,postalCode}){
  return {country:String(country||'').toUpperCase(),city:String(city||'').trim(),street:String(street||'').trim(),number:String(number||'').trim(),postalCode:String(postalCode||'').trim()};
}
