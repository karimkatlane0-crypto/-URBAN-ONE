// Install metadata contains no private records or provider credentials.
export function superAppWebManifest() {
  const shortcutIcons=[192,512].map(size=>({src:'/assets/seva-icon-'+size+'.png',sizes:size+'x'+size,type:'image/png',purpose:'any'}));
  const icons=shortcutIcons;
  return {id:'/superapp',name:'SYNAPSY · Intelligence Studio',short_name:'SYNAPSY',lang:'it',description:'Clienti, conversazioni, attività, immobili e musica nel tuo spazio di lavoro.',start_url:'/app?section=home',scope:'/',display:'standalone',background_color:'#f3f4ee',theme_color:'#163126',icons,shortcuts:[
    {name:'Clienti e attività',short_name:'Clienti',url:'/app?section=crm',icons:shortcutIcons},
    {name:'KKUBERA 4 · Civici',short_name:'KKUBERA 4',url:'/kkubera/4',icons:shortcutIcons},
    {name:'Musica e Spotify',short_name:'Musica',url:'/music',icons:shortcutIcons},
    {name:'Oggi · Il tuo workspace',short_name:'Oggi',url:'/app?section=home',icons:shortcutIcons},
    {name:'TITANS · Operazioni',short_name:'TITANS',url:'/titans/operazioni',icons:shortcutIcons},
    {name:'Il mio account',short_name:'Account',url:'/account',icons:shortcutIcons},
    {name:'Aggiornamenti',short_name:'Aggiornamenti',url:'/aggiornamenti',icons:shortcutIcons}
  ]};
}
