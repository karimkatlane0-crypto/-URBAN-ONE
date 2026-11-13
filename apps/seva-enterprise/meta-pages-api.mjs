// Meta Pages integration: safe preview and server-side credential gate.
// No posting without approved Page access, explicit post approval and deployment opt-in.
const err=(status,message)=>Object.assign(new Error(message),{status});
export function metaPagesRoute({method,path,user,body={},env=process.env}){
 if(!user?.id)throw err(401,'Authentication required');
 const configured=Boolean(env.SEVA_META_PAGE_ID&&env.SEVA_META_PAGE_ACCESS_TOKEN);
 const enabled=env.SEVA_META_PUBLISH_ENABLED==='true';
 if(path==='/api/v1/meta/pages/status'&&method==='GET')return {status:200,data:{configured,enabled,connected:false,published:false,provider:'Meta Graph API',requiresPageAuthorization:true}};
 if(path==='/api/v1/meta/pages/post-preview'&&method==='POST'){
   if(typeof body.message!=='string'||!body.message.trim()||body.message.length>5000)throw err(400,'Message must be 1–5000 characters');
   if(body.link!==undefined){let u;try{u=new URL(body.link)}catch{throw err(400,'Invalid link')};if(u.protocol!=='https:')throw err(400,'HTTPS link required');}
   return {status:200,data:{message:body.message.trim(),link:body.link||null,preview:true,published:false,requiresExplicitApproval:true}};
 }
 if(path==='/api/v1/meta/pages/publish'&&method==='POST')return {status:503,data:{error:'Publication disabled pending Page authorization, approved content and live provider verification',published:false}};
 return null;
}
