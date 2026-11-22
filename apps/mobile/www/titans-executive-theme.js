(() => {
'use strict';
const key='titans-enterprise-theme';
const root=document.documentElement;
let theme='dark';
try{const saved=window.localStorage.getItem(key);if(saved==='light'||saved==='dark')theme=saved}catch{}
const apply=value=>{
 theme=value==='light'?'light':'dark';
 root.dataset.theme=theme;
 root.style.colorScheme=theme;
 const button=document.getElementById('titans-theme-toggle');
 if(button){const next=theme==='dark'?'light':'dark';button.setAttribute('aria-label','Attiva modalità '+(next==='light'?'chiara':'scura'));button.setAttribute('aria-pressed',String(theme==='light'));button.title='Passa alla modalità '+(next==='light'?'chiara':'scura');button.innerHTML='<span class="theme-icon" aria-hidden="true">'+(next==='light'?'☼':'◐')+'</span><span>'+(next==='light'?'LIGHT MODE':'DARK MODE')+'</span>'}
};
apply(theme);
const mount=()=>{
 const host=document.querySelector('.top-actions');
 if(!host||document.getElementById('titans-theme-toggle'))return;
 const button=document.createElement('button');
 button.id='titans-theme-toggle';button.className='theme-toggle';button.type='button';
 button.addEventListener('click',()=>{const next=theme==='dark'?'light':'dark';try{window.localStorage.setItem(key,next)}catch{}apply(next)});
 host.append(button);apply(theme);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();