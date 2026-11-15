// Presentation only. Account scopes, APIs and persisted identifiers stay stable.
export function synapsySurfaceForURL(input){
 const path=new URL(input,'https://seva.karimkatlane0.chatgpt.site').pathname;
 if(path==='/app')return 'workspace';
 if(path==='/'||path==='/superapp'||path==='/synapsy')return 'home';
 if(path==='/music')return 'music';
 if(path==='/onboarding'||path==='/onboarding/competenze')return 'onboarding';
 if(path==='/territorio')return 'territory';
 if(path==='/titans')return 'titans';
 if(path==='/titans/operazioni')return 'titans-operations';
 if(path==='/titans/manifesto')return 'runtime-manifest';
 if(path==='/titans/completamento')return 'completion';
 if(path==='/connections/telecom')return 'telecom';
 if(path==='/connections')return 'connections';
 if(['/kkubera','/kkubera/1','/kkubera/2','/kkubera/3','/kkubera/4'].includes(path))return 'kkubera-workspace';
 if(path==='/studio/diritti'||path==='/studio/trattative')return 'studio';
 if(path==='/galleria'||path.startsWith('/galleria/'))return 'gallery';
 if(path==='/kkubera/confronto')return 'kkubera';
 if(['/kkubera/visite','/kkubera/immobili'].includes(path))return 'kkubera2';
 // Documents and older tools receive the same palette and no sky decoration.
 return 'document';
}

export const SYNAPSY_WORKSPACE_STYLE=`
/* One palette; the existing appearance and accessibility preferences remain in use. */
@font-face{font-family:"SYNAPSY Symbols";src:local("Noto Sans Symbols2"),local("Noto Sans Symbols 2"),local("Noto Sans Symbols"),local("Segoe UI Symbol"),local("DejaVu Sans");unicode-range:U+2190-21FF,U+2304,U+2315,U+2580-259F;font-display:swap}
html:root{--sy-bg:#f2f5f0;--sy-surface:#fff;--sy-raised:#e8f0e7;--sy-ink:#163126;--sy-muted:#52675c;--sy-line:#cbd9cf;--sy-accent:#25613f;--sy-accent-ink:#fff;--sy-soft:#e6f2dc;--sy-warning:#814800;--sy-warning-bg:#fff1da;--sy-positive:#236343;--sy-positive-bg:#e6f2e9;--sy-danger:#b02a37;--sy-danger-bg:#fff0f0;--sy-focus:#25613f;--sy-yellow:#b6f07b;--sy-yellow-ink:#163121;--sy-red:#c04b49;--sy-shell:#10291f;--sy-gold:#ad8747;--sy-radius:8px;--sy-font:"SYNAPSY Symbols",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
html:root[data-seva-theme=dark]{--sy-bg:#0c1914;--sy-surface:#142a21;--sy-raised:#1e382b;--sy-ink:#f0f7ed;--sy-muted:#b7cbbd;--sy-line:#426052;--sy-accent:#b6f07b;--sy-accent-ink:#163121;--sy-soft:#243f2b;--sy-warning:#f6cc84;--sy-warning-bg:#403425;--sy-positive:#b5e1c7;--sy-positive-bg:#243b2f;--sy-danger:#ffb8bd;--sy-danger-bg:#442b31;--sy-focus:#b6f07b;--sy-red:#ef9285}
html:root:not([data-command-contrast]) body[data-synapsy-surface]{--ink:var(--sy-ink);--text:var(--sy-ink);--muted:var(--sy-muted);--dim:var(--sy-muted);--paper:var(--sy-bg);--bg:var(--sy-bg);--panel:var(--sy-surface);--surface:var(--sy-surface);--surface2:var(--sy-raised);--white:var(--sy-surface);--line:var(--sy-line);--green:var(--sy-accent);--lime:var(--sy-accent);--accent:var(--sy-accent);--pink:var(--sy-accent);--mint:var(--sy-accent);--gold:var(--sy-warning);--orange:var(--sy-warning);background:var(--sy-bg);color:var(--sy-ink);font-family:var(--sy-font);color-scheme:light}
html:root[data-seva-theme=dark]:not([data-command-contrast]) body[data-synapsy-surface]{color-scheme:dark}
body[data-synapsy-surface]::before,body[data-synapsy-surface]::after{display:none}
body[data-synapsy-surface] :is(h1,h2,h3,.metric strong,.money,.result strong){font-family:inherit}
body[data-synapsy-surface] :is(h1,h2,h3){text-wrap:balance}
body[data-synapsy-surface] :is(a,button,.button,.btn,summary){font-family:var(--sy-font);touch-action:manipulation}
body[data-synapsy-surface] :is(input,textarea,select){font-family:inherit}
body[data-synapsy-surface] :is(.skip,.skip-link,.sy-skip,.ps-skip):focus{z-index:110;top:10px;background:var(--sy-surface);color:var(--sy-ink);border:2px solid var(--sy-focus)}
html:root:not([data-command-contrast]) body[data-synapsy-surface] :focus-visible{outline:3px solid var(--sy-focus)!important;outline-offset:4px!important}
/* Exact page headers only; section headings and business controls remain visible. */
body[data-seva-unified][data-synapsy-surface=home]>.sy-header,
body[data-seva-unified][data-synapsy-surface=music]>.top,
body[data-seva-unified][data-synapsy-surface=titans]>.shell>.titans-page-header,
body[data-seva-unified][data-synapsy-surface=connections]>.wrap>.connections-page-header,
body[data-seva-unified][data-synapsy-surface=kkubera3]>.kk3-wrap>.kk3-header,
body[data-seva-unified][data-synapsy-surface=kkubera]>header:not(#seva-experience),
body[data-seva-unified][data-synapsy-surface=kkubera2].ps-app>header:not(#seva-experience),
body[data-seva-unified][data-synapsy-surface=document] .hub-header,
body[data-seva-unified][data-synapsy-surface=document]>.wrap>header:has(>.brand),
body[data-seva-unified][data-synapsy-page=automation]>.auto-shell>.auto-header,
body[data-seva-unified][data-synapsy-surface=home]>.sy-footer{display:none}
/* Legacy page content stays available; only its decorative presentation changes. */
body[data-synapsy-surface=document] .cosmic-scene{display:none}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] :is(.shell,.wrap,.studio-wrap,main){background:transparent;color:var(--sy-ink);box-shadow:none}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] :is(h1,h2,h3,h4,label,th){color:var(--sy-ink);font-family:inherit;text-shadow:none}
html:root body[data-synapsy-surface=document] h1{font-size:clamp(32px,4.8vw,56px);font-weight:650;line-height:1.12;letter-spacing:-.04em}
html:root body[data-synapsy-surface=document] :is(.hero,.studio-hero,.intro){min-height:0;background:transparent;background-image:none;border:0;box-shadow:none;border-radius:0;padding-block:32px;margin-top:0}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] :is(p,li,dt,dd,.lede,.small,.fine,.muted,.tool-scope,.tool-evidence,.functional-note){color:var(--sy-muted)}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] a{color:var(--sy-accent)}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] :is(.panel,.card,.tool-card,.status-card,.flow-panel,.quick-card,.pathway,.price,.notice,.studio-card,.step,pre,dialog){background:var(--sy-surface);color:var(--sy-ink);border-color:var(--sy-line);border-radius:var(--sy-radius);box-shadow:none}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] :is(button,.button,.btn,input,textarea,select){background:var(--sy-surface);color:var(--sy-ink);border:1px solid #85868e;border-radius:6px;font-family:inherit;box-shadow:none}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] :is(input,textarea)::placeholder{color:var(--sy-muted);opacity:1}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] :is(button,.button,.btn){min-height:44px}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] :is(button.primary,.button.primary,.btn:not(.light),button[aria-pressed=true]){background:var(--sy-yellow);color:var(--sy-yellow-ink);border-color:var(--sy-yellow)}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] :is(.eyebrow,.cosmic-kicker,.functional-kicker,h1 em){color:var(--sy-accent);text-shadow:none}
/* The international composer's language selector remains a working control. */
body[data-seva-unified] #internationalStudio>.studio-header>.studio-brand,
body[data-seva-unified] #internationalStudio>.studio-header>nav{display:none}
html:root #internationalStudio>.studio-header{display:flex;justify-content:flex-end;min-height:0;background:transparent;border:0;border-bottom:1px solid var(--sy-line);border-radius:0;box-shadow:none;margin:0;padding:12px 0}
html:root #internationalStudio .studio-language{display:flex;align-items:center;gap:10px;max-width:100%;width:auto}
html:root:not([data-command-contrast]) #internationalStudio :is(.studio-panel,#studioContacts article){background:var(--sy-surface);color:var(--sy-ink);border-color:var(--sy-line);border-radius:10px;box-shadow:none}
html:root:not([data-command-contrast]) #internationalStudio .badge{background:var(--sy-positive-bg);color:var(--sy-positive)}
html:root:not([data-command-contrast]) #internationalStudio .badge.pending{background:var(--sy-warning-bg);color:var(--sy-warning)}
html:root:not([data-command-contrast]) #internationalStudio .studio-status{color:var(--sy-accent)!important}
/* Preserve section navigation in Flussi while removing its second brand bar. */
body[data-seva-unified]>.flow-wrap>.flow-header>.flow-brand,
body[data-seva-unified]>.flow-wrap>.flow-header>nav>a[href^="/"]{display:none}
html:root body[data-synapsy-surface=document]>.flow-wrap{--flow-yellow:var(--sy-accent);--flow-red:var(--sy-danger);--flow-muted:var(--sy-muted);--flow-line:var(--sy-line)}
html:root .flow-wrap>.flow-header{position:relative;justify-content:flex-start;padding:12px 0;border-color:var(--sy-line)}
html:root .flow-wrap>.flow-header .seva-language-menu{position:static}
html:root .flow-wrap>.flow-header .seva-language-menu:not([open])>nav{display:none}
html:root .flow-wrap>.flow-header .seva-language-menu>nav{inset-inline-start:0;inset-inline-end:auto;top:calc(100% + 6px);width:min(280px,100%);max-width:100%;box-sizing:border-box;background:var(--sy-surface);color:var(--sy-ink);border-color:var(--sy-line)}
html:root .flow-wrap>.flow-header .seva-language-menu>nav a{color:var(--sy-ink)!important}
html:root .flow-wrap>.flow-header .seva-language-menu>nav a:is(:hover,[aria-current]){background:var(--sy-soft)}
html:root:not([data-command-contrast]) .flow-wrap :is(.flow-card,.flow-metrics article,.sector-source-panel){background:var(--sy-surface);color:var(--sy-ink);border-color:var(--sy-line);border-radius:10px;box-shadow:none}
html:root:not([data-command-contrast]) .flow-wrap .flow-note{background:var(--sy-soft);color:var(--sy-ink);border-color:var(--sy-accent)}
html:root:not([data-command-contrast]) .flow-wrap .flow-note-red{background:var(--sy-warning-bg);color:var(--sy-warning);border-color:var(--sy-warning)}
html:root:not([data-command-contrast]) .flow-wrap :is(.flow-metrics span,.flow-status,.flow-empty,.flow-muted){color:var(--sy-muted)}
html:root:not([data-command-contrast]) .flow-wrap .flow-primary{background:var(--sy-yellow);color:var(--sy-yellow-ink);border-color:var(--sy-yellow)}
html:root:not([data-command-contrast]) .flow-wrap .flow-button:not(.flow-primary){background:var(--sy-surface);color:var(--sy-ink);border-color:var(--sy-line)}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] main.translation-wrap{background:var(--sy-surface);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:10px}
html:root:not([data-command-contrast]) .translation-wrap .translation-eyebrow{color:var(--sy-accent)!important}
/* CRM follow-ups keep their forms, receipts and states in the shared palette. */
html:root:not([data-command-contrast]) body[data-synapsy-page=automation] :is(.auto-panel,.auto-stat,.auto-lane){background:var(--sy-surface);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:10px;box-shadow:none}
html:root:not([data-command-contrast]) body[data-synapsy-page=automation] :is(.auto-stat strong,.auto-panel h2,.auto-panel h3,.cfu-rows legend){color:var(--sy-ink)}
html:root:not([data-command-contrast]) body[data-synapsy-page=automation] :is(.auto-muted,.auto-status,.auto-stat span,.auto-update-grid time,.auto-update-grid p,.auto-foot){color:var(--sy-muted)}
html:root:not([data-command-contrast]) body[data-synapsy-page=automation] :is(.auto-eyebrow,.auto-badge){color:var(--sy-accent)}
html:root:not([data-command-contrast]) body[data-synapsy-page=automation] .auto-badge.ready{color:var(--sy-positive)}
html:root:not([data-command-contrast]) body[data-synapsy-page=automation] .auto-badge.unavailable{color:var(--sy-danger)}
html:root:not([data-command-contrast]) body[data-synapsy-page=automation] :is(.auto-task,.auto-controls,.auto-foot,.auto-update-grid article,.cfu-rows fieldset,.cfu-receipt){border-color:var(--sy-line)}
html:root:not([data-command-contrast]) body[data-synapsy-page=automation] .auto-code{background:var(--sy-raised);color:var(--sy-ink)}
html:root:not([data-command-contrast]) body[data-synapsy-page=automation] #cfuConfirm{background:var(--sy-yellow);color:var(--sy-yellow-ink);border-color:var(--sy-yellow)}
/* Common header and utility controls. */
#seva-experience{background:var(--sy-surface);color:var(--sy-ink);border-bottom:1px solid var(--sy-line);box-shadow:0 1px 0 #18333c06;font-family:var(--sy-font)}
#seva-experience .seva-bar{max-width:1440px;min-height:76px;padding:12px 32px;gap:20px}
#seva-experience .seva-orbit-mark{display:block;flex:none;width:42px;height:42px}
#seva-experience .seva-orbit-mark img{position:static;width:42px;height:42px;max-width:42px;object-fit:contain;border:0;border-radius:0;padding:0;background:none;box-shadow:none}
#seva-experience .seva-identity{gap:11px}#seva-experience .seva-identity strong{font-size:20px;letter-spacing:.12em;font-weight:750}
#seva-experience .seva-identity small{font-size:9px;letter-spacing:.08em;color:var(--sy-muted)}
#seva-experience .seva-edition,#seva-experience .seva-owner-credit,#seva-experience .seva-freshness{display:none}
#seva-experience .seva-main-nav{gap:3px;font-size:13px}
#seva-experience .seva-main-nav>a,#seva-experience summary,#seva-experience button,#seva-experience .seva-preferences a{min-height:44px;border-radius:6px;padding:10px 12px}
#seva-experience :is([aria-current=page],[aria-current=location]){background:var(--sy-soft);color:var(--sy-ink);box-shadow:inset 0 -2px var(--sy-accent)}
#seva-experience :is(a,button,summary):hover{background:var(--sy-raised);color:var(--sy-ink)}
#seva-experience .seva-join{font-weight:650}#seva-experience .seva-account{border:1px solid var(--sy-line);font-size:12px;padding:10px 14px}
#seva-experience .seva-tools-panel{background:var(--sy-surface);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:10px;box-shadow:0 20px 50px #0a23352b;max-height:calc(100dvh - var(--seva-header-height,76px) - 28px)}
#seva-experience #seva-tool-menu[open]>summary{background:var(--sy-soft)}
#seva-experience input{background:var(--sy-bg);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:6px}
#seva-experience .seva-menu-language,#seva-experience #seva-tool-count{color:var(--sy-muted)}
#seva-experience .seva-menu-language,#seva-experience .seva-menu-language a,#seva-experience .seva-tool-list a{border-color:var(--sy-line)}
#seva-experience .seva-tool-list a{font-size:13px;line-height:1.45;border-radius:6px}
#seva-experience .seva-mobile-destinations{display:none}
#seva-experience .seva-menu-actions{display:grid;gap:6px}
#seva-experience :is(.seva-menu-actions,.seva-mobile-destinations)>a{display:flex;align-items:center;justify-content:space-between;min-height:44px;padding:11px 13px;border:1px solid var(--sy-line);border-radius:6px;font-size:14px;line-height:1.5}
#seva-experience .seva-menu-language{margin:16px 0 8px;padding:0;border:0}
#seva-experience .seva-languages-note{max-width:45ch;font-size:12px;line-height:1.6;margin:0}
#seva-experience .seva-menu-settings{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--sy-line);padding-top:14px;margin-top:18px}
#seva-experience .seva-menu-settings>button{border:1px solid var(--sy-line);font-size:12px}
#seva-experience .seva-menu-settings #seva-languages{position:static}
#seva-experience .seva-languages-panel{background:var(--sy-surface);color:var(--sy-ink);border-color:var(--sy-line);max-height:60dvh;overflow:auto}
#seva-experience .seva-languages-panel :is(a,p,bdi){color:var(--sy-ink)}
#seva-experience .seva-languages-note{color:var(--sy-muted)}
#seva-experience :focus-visible{outline:3px solid var(--sy-focus);outline-offset:3px}
#seva-update{background:var(--sy-soft);color:var(--sy-ink);border-top:1px solid var(--sy-line)}#seva-update button{border-color:var(--sy-line)}
#seva-copyright{display:block;max-width:none;margin:0;background:var(--sy-surface);color:var(--sy-ink);border-top:1px solid var(--sy-line);padding:24px max(24px,calc((100% - 1280px)/2));font:12px/1.65 system-ui,sans-serif}
#seva-copyright p{color:inherit;margin:5px 0}#seva-copyright p+p{color:var(--sy-muted);font-size:12px}#seva-copyright a{color:inherit;text-underline-offset:3px}
#seva-copyright .synapsy-footer-links{display:flex;flex-wrap:wrap;gap:8px 22px;margin:12px 0}
#seva-copyright .synapsy-footer-links a{display:inline-flex;align-items:center;min-height:36px}
html:root:not([data-command-contrast]) #seva-command-dialog{background:var(--sy-surface);color:var(--sy-ink);border-color:var(--sy-line);box-shadow:0 22px 70px #10253240;font-family:var(--sy-font)}
html:root:not([data-command-contrast]) #seva-command-dialog :is(p,label){color:var(--sy-muted)}
html:root:not([data-command-contrast]) #seva-command-dialog h2{color:var(--sy-ink)}
html:root:not([data-command-contrast]) #seva-command-dialog input::placeholder{color:var(--sy-muted);opacity:1}
html:root:not([data-command-contrast]) #seva-command-dialog :is(input,button,a){background:var(--sy-bg);color:var(--sy-ink);border-color:var(--sy-line);border-radius:6px}
html:root:not([data-command-contrast]) body :is(#command-access>summary,#seva-quick-actions>summary){background:var(--sy-surface);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:8px;box-shadow:0 3px 15px #17323d12;font-weight:600}
html:root:not([data-command-contrast]) body :is(#command-access>.command-sheet,#seva-quick-actions nav){background:var(--sy-surface);color:var(--sy-ink);border-color:var(--sy-line);border-radius:10px;box-shadow:0 12px 40px #10253230}
html:root:not([data-command-contrast]) #command-access .command-sheet :is(h2,h3,label){color:var(--sy-ink)}
html:root:not([data-command-contrast]) #command-access .command-sheet :is(p,small,li){color:var(--sy-muted)}
html:root:not([data-command-contrast]) #command-access .command-sheet :is(button,select,a){background:var(--sy-bg);color:var(--sy-ink);border-color:var(--sy-line);border-radius:6px}
html:root:not([data-command-contrast]) #command-access .command-sheet button[aria-pressed=true]{background:var(--sy-soft);color:var(--sy-ink);border-color:var(--sy-accent)}
html:root:not([data-command-contrast]) body #seva-quick-actions nav a{color:var(--sy-ink)}
html:root:not([data-command-contrast]) body #seva-quick-actions nav a:hover{background:var(--sy-soft)}
html:root:not([data-command-contrast]) body #command-access summary::before{color:var(--sy-accent)}
/* Feedback sits above the fixed utility controls, including text zoom. */
html:root body[data-synapsy-surface] .toast{bottom:calc(144px + env(safe-area-inset-bottom));z-index:81;max-width:calc(100vw / var(--command-zoom,1) - 32px);background:var(--sy-ink);color:var(--sy-surface);border:1px solid var(--sy-line);border-radius:8px;box-shadow:0 6px 24px #10253230}
/* Workspace. */
html:root body[data-synapsy-surface=workspace]>aside{background:var(--sy-surface);color:var(--sy-ink);border:0;border-right:1px solid var(--sy-line);border-radius:0;width:228px;inset:var(--seva-header-height,76px) auto 0 0;height:calc(100dvh - var(--seva-header-height,76px));padding:20px 14px}
html:root body[data-synapsy-surface=workspace]>main{background:var(--sy-bg);color:var(--sy-ink);border-radius:0;max-width:none;margin:0 0 0 228px;min-height:calc(100vh - 76px);padding:0 32px 40px}
html:root body[data-synapsy-surface=workspace] .workspace-nav{margin-top:0;gap:3px}
html:root body[data-synapsy-surface=workspace] .workspace-nav a{display:flex;align-items:center;gap:8px;min-height:44px;padding:10px 12px;border:1px solid transparent;border-radius:6px;font-size:13px;color:var(--sy-muted);text-decoration:none;font-weight:500}
html:root body[data-synapsy-surface=workspace] .workspace-nav a.active{background:var(--sy-soft);color:var(--sy-ink);font-weight:700;box-shadow:inset 3px 0 var(--sy-accent)}
html:root body[data-synapsy-surface=workspace] .workspace-nav a:hover{background:var(--sy-raised);color:var(--sy-ink)}
html:root body[data-synapsy-surface=workspace] .workspace-nav .workspace-product-link{color:var(--sy-ink);font-weight:650}
html:root body[data-synapsy-surface=workspace] .workspace-nav-label{margin:18px 12px 6px;color:var(--sy-muted);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em}
html:root body[data-synapsy-surface=workspace] .workspace-nav summary{font-size:12px;color:var(--sy-muted);margin-top:7px;min-height:44px}
html:root body[data-synapsy-surface=workspace] .aside-bottom{color:var(--sy-muted);font-size:11px;line-height:1.7;border-color:var(--sy-line)}
html:root body[data-synapsy-surface=workspace] .topbar{min-height:54px;border-color:var(--sy-line);font-size:12px;color:var(--sy-muted)}html:root body[data-synapsy-surface=workspace] .topbar a{color:var(--sy-accent)}
html:root body[data-synapsy-surface=workspace] h1{font-size:clamp(32px,4vw,48px);line-height:1.12;letter-spacing:-.045em;font-weight:650}
html:root body[data-synapsy-surface=workspace] h2{font-size:24px;line-height:1.25;letter-spacing:-.03em;font-weight:650}
html:root body[data-synapsy-surface=workspace] :is(.panel,.metric,.intent,.task,.starter,.result,.preview,.bundle-panel,.bundle-result,.crm-listening-card){background:var(--sy-surface);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:var(--sy-radius);box-shadow:none}
html:root body[data-synapsy-surface=workspace] .panel{padding:24px}html:root body[data-synapsy-surface=workspace] .task{border-left:2px solid var(--sy-accent)}
html:root body[data-synapsy-surface=workspace] :is(p,.small,.muted,.metric small){color:var(--sy-muted)}
html:root body[data-synapsy-surface=workspace] .eyebrow{color:var(--sy-accent);font-size:11px;letter-spacing:.12em}
html:root body[data-synapsy-surface=workspace] :is(input,textarea,select){background:var(--sy-surface);color:var(--sy-ink);border:1px solid #85868e;border-radius:6px}
html:root body[data-synapsy-surface=workspace] :is(input,textarea)::placeholder{color:var(--sy-muted);opacity:1}
html:root body[data-synapsy-surface=workspace] button{background:var(--sy-surface);color:var(--sy-ink);border:1px solid #85868e;border-radius:6px;min-height:44px;font-weight:600;box-shadow:none}
html:root body[data-synapsy-surface=workspace] button:hover:not(:disabled){background:var(--sy-raised);border-color:var(--sy-accent)}
html:root body[data-synapsy-surface=workspace] :is(button.primary,button.accent,.sy-primary-link){background:var(--sy-yellow);color:var(--sy-yellow-ink);border-color:var(--sy-yellow);font-weight:650}
html:root body[data-synapsy-surface=workspace] .pill{background:var(--sy-raised);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:5px;padding:5px 8px;font-size:11px}
html:root body[data-synapsy-surface=workspace] .notice{background:var(--sy-soft);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:6px}
html:root body[data-synapsy-surface=workspace] .notice.warn{background:var(--sy-warning-bg);color:var(--sy-warning);border-color:var(--sy-line)}
html:root body[data-synapsy-surface=workspace] :is(.danger,.notice.error){color:var(--sy-danger)}
html:root body[data-synapsy-surface=workspace] :is(pre,dialog){background:var(--sy-surface);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:10px}
html:root body[data-synapsy-surface=workspace] .sy-work-hero{display:grid;grid-template-columns:minmax(0,1fr) 245px;gap:32px;align-items:center;padding:34px 0 28px}
html:root body[data-synapsy-surface=workspace] .sy-work-hero h1{margin:16px 0}html:root body[data-synapsy-surface=workspace] .sy-work-hero h1 em{font-style:normal;color:var(--sy-accent)}
html:root body[data-synapsy-surface=workspace] .sy-work-hero p{font-size:15px;max-width:650px}
html:root body[data-synapsy-surface=workspace] .sy-home-music{display:flex;flex-direction:column;gap:10px;padding:24px;background:var(--sy-surface);color:var(--sy-ink);border:1px solid var(--sy-line);border-top:3px solid var(--sy-accent);border-radius:8px;text-decoration:none}
html:root body[data-synapsy-surface=workspace] .sy-home-music>span:not(.sy-equalizer){font-size:10px;letter-spacing:.1em;color:var(--sy-muted)}
html:root body[data-synapsy-surface=workspace] .sy-home-music strong{font-size:23px;line-height:1.25;font-weight:600;letter-spacing:-.025em}
html:root body[data-synapsy-surface=workspace] .sy-home-music small{font-size:12px;color:var(--sy-muted)}html:root body[data-synapsy-surface=workspace] .sy-equalizer{font-size:24px;color:var(--sy-accent);letter-spacing:2px}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--sy-line);border-radius:8px;margin-bottom:24px;overflow:hidden;background:var(--sy-surface)}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics article{padding:22px 18px;min-width:0;border-right:1px solid var(--sy-line)}html:root body[data-synapsy-surface=workspace] .sy-work-metrics article:last-child{border-right:0}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics span{display:block;font-size:10px;letter-spacing:.08em;color:var(--sy-muted)}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics strong{display:block;font-size:32px;line-height:1.2;margin:13px 0;color:var(--sy-ink);letter-spacing:-.035em;font-weight:650}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics strong.sy-metric-label{font-size:17px;line-height:1.6;color:var(--sy-warning)}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics small{font-size:12px;color:var(--sy-muted)}
html:root body[data-synapsy-surface=workspace] .sy-work-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:24px}html:root body[data-synapsy-surface=workspace] .sy-work-grid .panel{margin-bottom:24px}
html:root body[data-synapsy-surface=workspace] .sy-due-task{display:flex;justify-content:space-between;gap:16px;padding:17px 0;border-top:1px solid var(--sy-line);text-decoration:none;color:var(--sy-ink)}
html:root body[data-synapsy-surface=workspace] .sy-due-task small{display:block;color:var(--sy-muted);font-size:12px;margin-top:5px}
html:root body[data-synapsy-surface=workspace] .sy-empty{padding:28px 0 10px}html:root body[data-synapsy-surface=workspace] .sy-empty p{font-size:14px;max-width:430px}
html:root body[data-synapsy-surface=workspace] .sy-action-list{display:grid;gap:0;margin-top:20px}
html:root body[data-synapsy-surface=workspace] .sy-action-list a{display:flex;justify-content:space-between;gap:12px;padding:14px 0;border-top:1px solid var(--sy-line);color:var(--sy-ink);text-decoration:none;font-size:14px}
html:root body[data-synapsy-surface=workspace] .sy-action-list span{font-size:12px;color:var(--sy-accent)}
html:root body[data-synapsy-surface=workspace] .sy-verification>summary{font-weight:650;font-size:14px;min-height:44px}html:root body[data-synapsy-surface=workspace] .sy-verification p{font-size:13px}
html:root body[data-synapsy-surface=workspace] .sy-evidence p{padding:12px;border-left:2px solid var(--sy-warning);background:var(--sy-raised);color:var(--sy-ink)}
html:root body[data-synapsy-surface=workspace] .sy-evidence p[data-result=pass]{border-color:var(--sy-positive)}
html:root body[data-synapsy-surface=workspace] .synapsy-crm-stat{padding:18px;border:1px solid var(--sy-line);border-radius:7px;background:var(--sy-raised)}
html:root body[data-synapsy-surface=workspace] .synapsy-crm-timeline{padding-left:22px}html:root body[data-synapsy-surface=workspace] .synapsy-crm-timeline li{padding:12px 0;border-bottom:1px solid var(--sy-line)}
html:root body[data-synapsy-surface=workspace] .crm-contact-options>summary{font-size:12px;color:var(--sy-accent);min-height:44px}
/* Specialist pages adopt shared surfaces without changing any controls. */
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(.shell,.wrap){width:100%;max-width:1280px;padding-inline:32px;margin-inline:auto;background:transparent;border:0;box-shadow:none}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(.hero,.intro){background:transparent;border:0;box-shadow:none;border-radius:0;padding-block:42px;margin:0}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) h1{font-size:clamp(34px,4.8vw,58px);line-height:1.1;letter-spacing:-.045em;color:var(--sy-ink);font-weight:650}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) h2{font-size:clamp(24px,3vw,32px);line-height:1.25;letter-spacing:-.025em;font-weight:650}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(h1 span,h1 em,.eyebrow,.ps-eyebrow,.tool-number,.role-index){color:var(--sy-accent)}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(.panel,.card,.data-card,.integration,.role,.connection-card,.hero-note,.ps-card,.kk2-card){background:var(--sy-surface);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:10px;box-shadow:none}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(p,.lede,.fineprint,.detail,dt,label small){color:var(--sy-muted)}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(input,select,textarea){background:var(--sy-surface);color:var(--sy-ink);border-color:#85868e;border-radius:6px}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(input,textarea)::placeholder{color:var(--sy-muted);opacity:1}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(button,.button,.btn){background:var(--sy-surface);color:var(--sy-ink);border:1px solid #85868e;border-radius:6px;min-height:44px;box-shadow:none}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(.primary,.btn:not(.light)){background:var(--sy-yellow);color:var(--sy-yellow-ink);border-color:var(--sy-yellow)}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(.status,.callout,.ps-notice){background:var(--sy-soft);color:var(--sy-ink);border-color:var(--sy-line)}
html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections]) :is(.state,.connection-state,.connection-state.prepare,.connection-state.connect){background:var(--sy-warning-bg);color:var(--sy-warning);border:1px solid var(--sy-line);border-radius:4px;line-height:1.5}
html:root body[data-synapsy-surface=connections] .connection-state.ready{background:var(--sy-positive-bg);color:var(--sy-positive)}
body[data-synapsy-surface=connections] .intro{max-width:900px}
body[data-synapsy-surface=connections] .connection-card h2{font-size:24px}
body[data-synapsy-surface=connections] #connectionNextSteps>li{background:var(--sy-surface)}
body[data-synapsy-surface=titans] .hero{gap:32px;grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr)}
body[data-synapsy-surface=titans] .hero-note{border-top:3px solid var(--sy-accent);padding:24px}
body[data-synapsy-surface=titans] .section{padding-block:36px}
/* Music retains original record artwork inside the shared interface. */
body[data-synapsy-surface=music] .page{max-width:1344px;padding:40px 32px}
body[data-synapsy-surface=music] .intro h1{font-size:clamp(34px,4.8vw,56px);line-height:1.1;letter-spacing:-.045em;font-weight:650}
body[data-synapsy-surface=music] .intro h1 em,body[data-synapsy-surface=music] .eyebrow{color:var(--sy-accent)}
body[data-synapsy-surface=music] .player{--ink:#142b3b;background:#142b3b;color:#f3f6f2;border-radius:12px}
body[data-synapsy-surface=music] .library{background:var(--sy-surface);color:var(--sy-ink);border:1px solid var(--sy-line);border-radius:12px}
body[data-synapsy-surface=music] .track{border-color:var(--sy-line)}
body[data-synapsy-surface=music] .track.selected{background:var(--sy-soft)}
body[data-synapsy-surface=music] .player button{border-radius:6px}
body[data-synapsy-surface=music] .add-button{background:var(--sy-accent);color:var(--sy-accent-ink);border-radius:6px;min-height:44px}
body[data-synapsy-surface=music] .status{color:var(--sy-accent)}
body[data-synapsy-surface=music] .toggle{min-height:44px}
@media(max-width:1100px){
 #seva-experience .seva-bar{padding:10px 24px;gap:10px}#seva-experience .seva-main-nav{gap:0;font-size:12px}
 #seva-experience .seva-main-nav>a,#seva-experience summary{padding-inline:9px}#seva-experience .seva-command-trigger{display:none}
 html:root body[data-synapsy-surface=workspace]>aside{width:200px}html:root body[data-synapsy-surface=workspace]>main{margin-left:200px;padding-inline:24px}html:root body[data-synapsy-surface=workspace] .sy-work-grid{grid-template-columns:1fr}
 html:root body[data-synapsy-surface=workspace] .sy-work-metrics{grid-template-columns:1fr 1fr}html:root body[data-synapsy-surface=workspace] .sy-work-metrics article:nth-child(2){border-right:0}html:root body[data-synapsy-surface=workspace] .sy-work-metrics article:nth-child(-n+2){border-bottom:1px solid var(--sy-line)}
}
@media(max-width:820px){
 #seva-experience .seva-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px 16px;min-height:0;padding:10px 20px 8px}
 #seva-experience .seva-main-nav{grid-column:1/-1;order:initial;width:100%;display:flex;justify-content:flex-start;gap:5px}
 #seva-experience .seva-preferences{grid-column:2;grid-row:1;margin:0}#seva-experience .seva-identity{grid-column:1;grid-row:1}
 body[data-synapsy-surface=titans] .hero{grid-template-columns:1fr}html:root body[data-synapsy-surface=workspace] .sy-work-hero{grid-template-columns:1fr}html:root body[data-synapsy-surface=workspace] .sy-work-hero .sy-home-music{max-width:450px}
}
@media(max-width:650px){
 #seva-experience .seva-bar{padding:8px 16px 6px;gap:5px 12px}
 #seva-experience .seva-orbit-mark,#seva-experience .seva-orbit-mark img{width:29px;height:29px;max-width:29px}
 #seva-experience .seva-identity{gap:9px}#seva-experience .seva-identity strong{font-size:18px}#seva-experience .seva-identity small{font-size:8px;letter-spacing:.05em}
 #seva-experience .seva-main-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}
 #seva-experience .seva-main-nav>.seva-mobile-secondary{display:none}
 #seva-experience .seva-main-nav>a,#seva-experience .seva-main-nav>details>summary{min-height:44px;padding:8px 3px;font-size:12px;white-space:nowrap;justify-content:center}
 #seva-experience .seva-account{font-size:12px;min-height:44px;padding:9px 12px}
 #seva-experience .seva-tools-panel{left:12px;right:12px;top:100%;width:auto;transform:none;padding:18px;max-height:calc(100dvh - var(--seva-header-height,108px) - 20px)}
 #seva-experience .seva-mobile-destinations{display:grid;grid-template-columns:1fr 1fr;gap:6px;border-bottom:1px solid var(--sy-line);padding-bottom:12px;margin-bottom:12px}
 #seva-experience .seva-tool-list{grid-template-columns:1fr}#seva-experience .seva-menu-settings{gap:8px}
 #seva-experience .seva-menu-language{font-size:12px;gap:8px}#seva-experience .seva-menu-language a{padding:8px}
 html:root body[data-synapsy-surface=workspace]>aside{position:relative;inset:auto;height:auto;width:auto;margin:0;padding:8px 16px;border:0;border-bottom:1px solid var(--sy-line)}
 html:root body[data-synapsy-surface=workspace]>main{margin:0;padding:0 18px 28px;min-height:0}html:root body[data-synapsy-surface=workspace] .workspace-nav-label{grid-column:1/-1;margin-top:12px}html:root body[data-synapsy-surface=workspace] .workspace-nav a{white-space:normal}
 html:root body[data-synapsy-surface=workspace] .topbar{padding:9px 0;min-height:40px}html:root body[data-synapsy-surface=workspace] .sy-work-hero{padding:26px 0;gap:22px}html:root body[data-synapsy-surface=workspace] .sy-work-hero h1{font-size:36px}
 html:root body[data-synapsy-surface=workspace] .sy-home-music{padding:18px;display:grid;grid-template-columns:36px 1fr;gap:5px 12px}html:root body[data-synapsy-surface=workspace] .sy-home-music .sy-equalizer{grid-row:span 3;overflow:hidden}
 html:root body[data-synapsy-surface=workspace] .sy-home-music strong{font-size:21px}html:root body[data-synapsy-surface=workspace] .sy-home-music>span:last-child{display:none}html:root body[data-synapsy-surface=workspace] .panel{padding:20px}
 html:root body[data-synapsy-surface=workspace] .sy-work-metrics article{padding:18px 14px}html:root body[data-synapsy-surface=workspace] .sy-work-metrics strong{font-size:29px}html:root body[data-synapsy-surface=workspace] .sy-work-grid{gap:0}
 html:root body[data-synapsy-surface=workspace] .sy-work-grid .row.between{align-items:start}html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(.shell,.wrap){padding-inline:18px}html:root body:is([data-synapsy-surface=titans],[data-synapsy-surface=connections],[data-synapsy-surface=kkubera],[data-synapsy-surface=kkubera2]) :is(.hero,.intro){padding-block:30px}
 body[data-synapsy-surface=music] .page{padding:30px 18px}#seva-copyright{padding:24px 18px}#seva-copyright .synapsy-footer-links{gap:4px 18px}
 html:root body[data-synapsy-surface] .toast{bottom:calc(80px + env(safe-area-inset-bottom))}
}
@media(max-width:380px){
 #seva-experience .seva-identity small{display:none}#seva-experience .seva-identity strong{font-size:17px}
 #seva-experience .seva-main-nav>a,#seva-experience .seva-main-nav>details>summary{font-size:13px}
 html:root body[data-synapsy-surface=workspace] .sy-work-metrics{grid-template-columns:1fr}html:root body[data-synapsy-surface=workspace] .sy-work-metrics article{border-right:0;border-bottom:1px solid var(--sy-line)}
}
/* At ordinary text size, automatic accessibility reflow still uses two rows.
   Enlarged-text layouts retain the accessibility module's flexible wrapping. */
@media(max-width:650px){
 html:root:is(:not([data-command-scale]),[data-command-scale="100"]) #seva-experience .seva-bar{display:grid!important;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto;align-items:center;gap:4px 12px;min-height:0;padding:8px 16px 6px}
 html:root:is(:not([data-command-scale]),[data-command-scale="100"]) #seva-experience .seva-identity{grid-column:1;grid-row:1;min-width:0;margin:0}
 html:root:is(:not([data-command-scale]),[data-command-scale="100"]) #seva-experience .seva-preferences{grid-column:2;grid-row:1;justify-self:end;flex-basis:auto;flex-wrap:nowrap;width:auto;margin:0;gap:0}
 html:root:is(:not([data-command-scale]),[data-command-scale="100"]) #seva-experience .seva-main-nav{display:grid!important;grid-column:1/-1;grid-row:2;grid-template-columns:repeat(3,minmax(0,1fr));order:initial;flex:none;width:100%;margin:0;gap:4px}
}
html:root[data-command-narrow] body[data-synapsy-surface] .toast{bottom:calc(80px + env(safe-area-inset-bottom))}
@media(prefers-reduced-motion:reduce){body[data-synapsy-surface] *,body[data-synapsy-surface] *::before,body[data-synapsy-surface] *::after{scroll-behavior:auto;transition:none;animation:none}}
/* Executive presentation: luminous green actions, forest structure, restrained gold.
   Text links keep a separate readable accent; color never replaces state text. */
html:root:not([data-command-contrast]) body[data-synapsy-surface] :is(.primary,.sy-primary-link,.kkw-primary,.kk4-primary,.syo-primary,.onb-primary,.syt-primary,.syde-primary,.flow-primary,button.accent,.add-button,.play-button){background:var(--sy-yellow);color:var(--sy-yellow-ink);border-color:var(--sy-yellow);font-weight:750}
html:root:not([data-command-contrast]) body[data-synapsy-surface] :is(.btn:not(.light),#cfuConfirm){background:var(--sy-yellow);color:var(--sy-yellow-ink);border-color:var(--sy-yellow)}
html:root:not([data-command-contrast]) body[data-synapsy-surface] :is(.primary,.sy-primary-link,.kkw-primary,.kk4-primary,.syo-primary,.onb-primary,.syt-primary,.syde-primary,.flow-primary,button.accent,.add-button,.play-button,.btn:not(.light)):hover:not(:disabled){background:#c9f79e;color:#10291f;border-color:#92c85b;filter:none}
html:root:not([data-command-contrast]) body[data-synapsy-surface] :is(input[type=checkbox],input[type=radio]){accent-color:var(--sy-accent)}
html:root:not([data-command-contrast]) #seva-experience{--sy-bg:#0c1914;--sy-surface:#10291f;--sy-raised:#234434;--sy-ink:#f4f4f1;--sy-muted:#c1d1c5;--sy-line:#456050;--sy-accent:#b6f07b;--sy-soft:#234434;--sy-focus:#b6f07b;background:var(--sy-surface);border-bottom:3px solid #b6f07b;box-shadow:none}
html:root:not([data-command-contrast]) #seva-experience .seva-identity{color:#fff}
html:root:not([data-command-contrast]) #seva-experience .seva-orbit-mark{padding:4px;background:#b6f07b;border-radius:4px;width:34px;height:34px;display:grid;place-items:center}
html:root:not([data-command-contrast]) #seva-experience .seva-orbit-mark img{width:26px;height:26px;max-width:26px;padding:0;border:0;box-shadow:none;border-radius:0}
html:root:not([data-command-contrast]) #seva-experience .seva-identity strong{letter-spacing:.11em;font-weight:800}
html:root:not([data-command-contrast]) #seva-experience :is(.seva-main-nav>a,.seva-preferences a,summary,button){color:var(--sy-ink)}
html:root:not([data-command-contrast]) #seva-experience .seva-main-nav>a[aria-current]{background:#234434;box-shadow:inset 0 -3px #b6f07b;color:#b6f07b}
html:root:not([data-command-contrast]) #seva-experience .seva-preferences>a.seva-account{background:#b6f07b;border-color:#b6f07b;color:#10291f;font-weight:750}
html:root:not([data-command-contrast]) #seva-experience .seva-command-trigger{background:#234434;color:#fff;border:1px solid #5a7c67;border-radius:6px}
html:root:not([data-command-contrast]) #seva-experience .seva-tools-panel{border-top:3px solid #b6f07b;box-shadow:0 16px 42px #0004}
html:root:not([data-command-contrast]) #seva-experience .seva-preferences>a.seva-account:hover{background:#c9f79e;color:#10291f}
/* Public entry: a clear editorial opening and six equally usable work areas. */
html:root body[data-synapsy-surface=home] .sy-home-hero{position:relative;isolation:isolate;max-width:none;margin:28px 0 44px;padding:52px 48px 40px;border:0;border-radius:10px;overflow:hidden}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-home-hero{background:#10291f;color:#fff}
html:root body[data-synapsy-surface=home] .sy-home-hero> *{position:relative;z-index:1}
html:root body[data-synapsy-surface=home] .sy-home-hero h1{font-size:clamp(42px,5.1vw,70px);font-weight:720;line-height:1.04;letter-spacing:-.05em;max-width:900px}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-home-hero :is(h1 span,.sy-kicker){color:#b6f07b}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-home-hero :is(.sy-lead,.sy-note){color:#d3e3d7}
html:root body[data-synapsy-surface=home] .sy-home-hero .sy-lead{max-width:650px;line-height:1.75;font-size:17px}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-home-hero .sy-button:not(.primary){background:transparent;border-color:#749581;color:#fff}
html:root body[data-synapsy-surface=home] .sy-section-head{align-items:start;margin-bottom:26px}
html:root body[data-synapsy-surface=home] .sy-section-head h2{font-weight:720;max-width:640px}
html:root body[data-synapsy-surface=home] .sy-tool{border-radius:8px;position:relative;padding:27px;min-height:205px;border-top:3px solid var(--sy-line);transition:background-color .15s,border-color .15s}
html:root body[data-synapsy-surface=home] .sy-tool-top{margin-bottom:23px;align-items:center}
html:root body[data-synapsy-surface=home] .sy-tool-top>span:first-child{font-variant-numeric:tabular-nums;font-size:12px;font-weight:750;letter-spacing:.08em}
html:root body[data-synapsy-surface=home] .sy-tool-top>span:last-child{display:grid;place-items:center;width:30px;height:30px;border:1px solid var(--sy-line);border-radius:50%;font-size:17px;color:var(--sy-ink)}
html:root body[data-synapsy-surface=home] .sy-tool h3{font-size:24px;font-weight:720}
html:root body[data-synapsy-surface=home] .sy-tool:hover{border-top-color:var(--sy-yellow);border-color:var(--sy-accent)}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-tool[data-home-area="01"]{background:var(--sy-yellow);border-color:#9ac768;color:#10291f}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-tool[data-home-area="01"] :is(p,.sy-tool-top){color:#31562e}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-tool[data-home-area="01"] .sy-tool-top>span:last-child{color:#10291f;border-color:#6a963e}
html:root body[data-synapsy-surface=home] .sy-status-note{border-left:4px solid var(--sy-red);border-radius:6px;padding:27px}
html:root body[data-synapsy-surface=home] .sy-status-note h2{font-weight:700}
html:root body[data-synapsy-surface=home] .sy-install{padding-top:24px}
/* Daily work uses the same editorial order and stable data-driven counts. */
html:root body[data-synapsy-surface=workspace] .sy-work-hero{padding:35px 0 32px;border-bottom:1px solid var(--sy-line);margin-bottom:26px}
html:root body[data-synapsy-surface=workspace] .sy-work-hero h1{font-size:clamp(36px,3.7vw,54px);font-weight:720}
html:root body[data-synapsy-surface=workspace] .sy-work-hero h1 em{color:var(--sy-ink)}
html:root body[data-synapsy-surface=workspace] .sy-work-hero h1 em::after{content:"";display:block;width:88px;height:5px;margin-top:20px;background:var(--sy-yellow)}
html:root body[data-synapsy-surface=workspace] .workspace-nav a.active{box-shadow:inset 4px 0 var(--sy-yellow);font-weight:750}
html:root body[data-synapsy-surface=workspace] .sy-home-music{background:#10291f;color:#fff;border-color:#10291f;border-top:4px solid #b6f07b;padding:25px}
html:root body[data-synapsy-surface=workspace] .sy-home-music :is(small,span:not(.sy-equalizer)){color:#c6d7c9}
html:root body[data-synapsy-surface=workspace] .sy-home-music .sy-equalizer{color:#b6f07b;font-size:29px;letter-spacing:4px}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics{gap:14px;background:none;border:0;border-radius:0;overflow:visible}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics article{background:var(--sy-surface);border:1px solid var(--sy-line);border-top:3px solid var(--sy-ink);border-radius:6px;padding:22px 18px}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics article:nth-child(n){border-right:1px solid var(--sy-line);border-bottom:1px solid var(--sy-line)}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics article:last-child{border-top-color:var(--sy-red)}
html:root body[data-synapsy-surface=workspace] .sy-work-metrics strong{font-size:38px;font-weight:720;font-variant-numeric:tabular-nums}
html:root body[data-synapsy-surface=workspace] .sy-intelligence{border-top:3px solid var(--sy-yellow)}
html:root body[data-synapsy-surface=workspace] .sy-action-list a{min-height:48px;font-weight:600}
html:root body[data-synapsy-surface=workspace] .sy-due-task:hover{background:var(--sy-raised)}
/* Native specialist pages retain their controls while adopting one hierarchy. */
html:root body[data-synapsy-surface] :is(.kkw-hero,.kk4-hero,.syo-hero,.srm-hero,.onb-hero,.syt-hero,.syst-hero,.syde-hero){border-bottom:1px solid var(--sy-line)}
html:root body[data-synapsy-surface] :is(.kkw-hero,.kk4-hero,.syo-hero,.srm-hero,.onb-hero,.syt-hero,.syde-hero) h1{font-weight:720;letter-spacing:-.045em}
html:root body[data-synapsy-surface] :is(.kkw-eyebrow,.kk4-kicker,.syo-kicker,.srm-kicker,.onb-kicker,.syt-eyebrow,.syde-eyebrow){display:block;padding-left:14px;border-left:3px solid var(--sy-red);font-size:11px;line-height:1.5}
html:root body[data-synapsy-surface] :is(.syo-panel,.kk4-panel,.srm-card,.kkw-sidebar,.kkw-detail,.onb-grid article){border-radius:8px}
html:root body[data-synapsy-surface] :is(.syo-boundary,.srm-hero-aside,.onb-aside){border-left:3px solid var(--sy-red)}
html:root body[data-synapsy-surface] :is(.syo-card:has(.syo-badge:is([data-state=attention],[data-state=conflict],[data-state=unavailable],[data-state=timeout])),.srm-summary[data-state=blocked],.srm-summary[data-state=unavailable]){border-left-color:var(--sy-red)}
html:root body[data-synapsy-surface] .kk4-status:is([data-state=loadError],[data-state=invalidReceipt],[data-state=conflict],[data-state=uncertain],[data-state=receiptFailed]){border-left:3px solid var(--sy-red);padding-left:12px;color:var(--sy-danger)}
html:root body[data-synapsy-surface] :is(.kkw-tabs a[aria-current],.kkw-tabs a.active){background:var(--sy-soft);box-shadow:inset 0 -3px var(--sy-yellow);color:var(--sy-ink)}
/* Public services and documents get a strong index and readable content panels. */
html:root body[data-synapsy-surface=document] .intro{max-width:none;border-bottom:1px solid var(--sy-line);padding-block:42px}
html:root body[data-synapsy-surface=document] .intro h1{font-size:clamp(34px,4.8vw,62px);font-weight:720;max-width:900px}
html:root body[data-synapsy-surface=document] .intro>.eyebrow{padding-left:14px;border-left:3px solid var(--sy-red);font-weight:750}
html:root body[data-synapsy-surface=document] .document{gap:42px;grid-template-columns:220px minmax(0,1fr);border-top:0}
html:root body[data-synapsy-surface=document] .document>aside{font-weight:600;padding-right:22px}
html:root body[data-synapsy-surface=document] .document>aside ol a{display:inline-flex;align-items:center;min-height:40px;text-decoration:none;color:var(--sy-ink)}
html:root body[data-synapsy-surface=document] .document>aside ol a:hover{text-decoration:underline;text-decoration-color:var(--sy-red);text-decoration-thickness:2px;text-underline-offset:6px}
html:root body[data-synapsy-surface=document] .document>article>section{padding-block:32px;scroll-margin-top:calc(var(--seva-header-height,108px) + 20px)}
html:root body[data-synapsy-surface=document] .document>article>section>h2{font-weight:700;font-size:clamp(25px,3vw,32px)}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] .cards article{background:var(--sy-surface);border:1px solid var(--sy-line);border-top:3px solid var(--sy-yellow);border-radius:8px}
html:root:not([data-command-contrast]) body[data-synapsy-surface=document] blockquote{background:var(--sy-surface);color:var(--sy-ink);border-color:var(--sy-red);font-family:inherit;font-size:20px}
/* Music: original artwork and playback behavior, with the shared palette. */
html:root:not([data-command-contrast]) body[data-synapsy-surface=music]{--cyan:#b6f07b;--coral:#f16b76}
html:root body[data-synapsy-surface=music] .player{--ink:#10291f;background:#10291f;border-top:4px solid #b6f07b;border-radius:8px}
html:root body[data-synapsy-surface=music] .intro{border-bottom:1px solid var(--sy-line);padding-bottom:28px}
html:root body[data-synapsy-surface=music] .intro h1{font-weight:720}
html:root body[data-synapsy-surface=music] .intro h1 em{font-style:normal;color:var(--sy-ink)}
html:root body[data-synapsy-surface=music] .library{border-radius:8px}
html:root:not([data-command-contrast]) body[data-synapsy-surface=music] .empty-icon{background:var(--sy-soft);color:var(--sy-accent)}
html:root:not([data-command-contrast]) body[data-synapsy-surface=music] .text-button{color:var(--sy-accent)}
html:root body[data-synapsy-surface=music] .art{background:linear-gradient(140deg,#2e5240,#12291e 65%,#3f4930)}
html:root body[data-synapsy-surface=music] .spotify-section{border-top:3px solid var(--sy-yellow)}

@media(max-width:850px){
 html:root body[data-synapsy-surface=document] .document{grid-template-columns:1fr;gap:0}
 html:root body[data-synapsy-surface=document] .document>aside{padding-right:0}
}
@media(max-width:700px){
 html:root body[data-synapsy-surface=home] .sy-home-hero{padding:30px 23px 27px;margin:20px 0 32px;border-radius:7px}
 html:root body[data-synapsy-surface=home] .sy-home-hero h1{font-size:clamp(34px,8.4vw,52px);margin-bottom:21px}
 html:root body[data-synapsy-surface=home] .sy-home-hero .sy-lead{font-size:15px;line-height:1.7}
 html:root body[data-synapsy-surface=home] .sy-home-hero .sy-actions{align-items:stretch}
 html:root body[data-synapsy-surface=home] .sy-home-hero .sy-button{width:100%;gap:12px}
 html:root body[data-synapsy-surface=home] .sy-tool{padding:23px 20px;min-height:190px}
 html:root body[data-synapsy-surface=home] .sy-tool h3{font-size:22px}
 html:root body[data-synapsy-surface=home] .sy-tool-top{margin-bottom:17px}
 html:root body[data-synapsy-surface=home] .sy-status-note{padding:23px}
 html:root body[data-synapsy-surface=workspace] .sy-work-hero{padding-top:27px;gap:24px}
 html:root body[data-synapsy-surface=workspace] .sy-work-hero h1{font-size:36px}
 html:root body[data-synapsy-surface=workspace] .sy-work-metrics{gap:10px}
 html:root body[data-synapsy-surface=workspace] .sy-work-metrics article{padding:19px 14px}
 html:root body[data-synapsy-surface=document] .intro{padding-block:30px}
}
@media(max-width:380px){
 html:root body[data-synapsy-surface=home] .sy-home-hero{padding:27px 19px}
 html:root body[data-synapsy-surface=home] .sy-home-hero h1{font-size:33px;letter-spacing:-.045em}
 html:root body[data-synapsy-surface=home] .sy-tool{min-height:0}
}
/* The personal operations surfaces use their own ivory/green workspace palette.
   Scope the tokens here because the shared chrome is appended after page CSS.
   High-contrast accessibility retains precedence. Other surfaces are unchanged. */
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]){--sy-bg:var(--sc-bg);--sy-surface:var(--sc-paper);--sy-raised:#edf2e7;--sy-ink:var(--sc-ink);--sy-muted:var(--sc-muted);--sy-line:var(--sc-line);--sy-accent:#365c2c;--sy-accent-ink:#fff;--sy-soft:#edf4e1;--sy-focus:var(--sc-focus);--sy-yellow:var(--sc-green);--sy-yellow-ink:#f4faec;background:var(--sc-bg);color:var(--sc-ink);color-scheme:light;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) :is(.sc-hero h1,.sc-register-head h2,.sc-focus-card h2,.sc-empty h2,.sc-stat strong,.tp-hero h1,.tp-panel h2,.tp-result h2,.tp-owner-gate h2){font-family:Georgia,"Times New Roman",serif;font-weight:400}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) :is(.sc-hero h1,.sc-register-head h2,.sc-empty h2,.sc-stat strong,.tp-hero h1,.tp-panel h2,.tp-result h2,.tp-owner-gate h2){color:var(--sc-ink)}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) .sc-stat[data-state=ready] strong{color:#426f28}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) .sc-stat[data-state=blocked] strong{color:var(--sc-red)}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) .sc-focus-card{background:var(--sc-green);color:#eaf4e5}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) .sc-focus-card h2{color:#eaf4e5}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) .sc-button.primary{background:var(--sc-green);border-color:var(--sc-green);color:#f4faec;font-weight:600}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) .sc-button.primary:hover:not(:disabled){background:#294332;border-color:#294332;color:#f4faec;filter:none}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) #seva-experience{--sy-bg:#142b22;--sy-surface:#142b22;--sy-raised:#294332;--sy-ink:#eff6e7;--sy-muted:#b7c9bc;--sy-line:#405843;--sy-accent:#daf4a1;--sy-soft:#294332;--sy-focus:#daf4a1;background:#142b22;border-bottom:1px solid #405843}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) #seva-experience :is(.seva-orbit-mark,.seva-preferences>a.seva-account){background:var(--sc-lime);border-color:var(--sc-lime);color:var(--sc-green)}
html:root:not([data-command-contrast]) body.sc-page:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom]) #seva-experience .seva-main-nav>a[aria-current]{background:#294332;box-shadow:inset 0 -2px var(--sc-lime);color:var(--sc-lime)}
@media(min-width:861px){body.sc-page[data-seva-unified]:is([data-synapsy-surface=completion],[data-synapsy-surface=telecom])>.sc-sidebar{inset:var(--seva-header-height,76px) auto 0 0}}
/* Green operations workspace. Existing states, forms and account boundaries are preserved. */
html:root:not([data-command-contrast]) body[data-synapsy-surface=workspace]>aside{--sy-surface:#10291f;--sy-ink:#edf7e9;--sy-muted:#bdd0c2;--sy-line:#355342;--sy-soft:#294832;--sy-raised:#203e2d;--sy-accent:#b6f07b;background:#10291f;color:#edf7e9;border-right:1px solid #355342}
html:root:not([data-command-contrast]) body[data-synapsy-surface=workspace] .workspace-nav a.active{color:#d5f6bb;background:#294832;box-shadow:inset 3px 0 #b6f07b}
html:root:not([data-command-contrast]) body[data-synapsy-surface=workspace] .workspace-nav a:hover{color:#fff;background:#203e2d}
html:root:not([data-command-contrast]) body[data-synapsy-surface=workspace] .workspace-nav-label{color:#a6c0ae}
html:root:not([data-command-contrast]) body[data-synapsy-surface=workspace] .aside-bottom{color:#bdd0c2;border-color:#355342}
html:root body[data-synapsy-surface=home] .sy-home-hero{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(290px,.85fr);gap:40px;align-items:center;margin:30px 0 22px;padding:48px;border-radius:16px}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-home-hero{background:#123528;color:#f4faef;border:1px solid #2f5b41}
html:root body[data-synapsy-surface=home] .sy-home-hero h1{font-size:clamp(42px,4.9vw,68px);max-width:750px;line-height:1.06;font-weight:650;letter-spacing:-.05em}
html:root body[data-synapsy-surface=home] .sy-home-hero .sy-lead{max-width:590px;font-size:16px;line-height:1.8}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-home-hero :is(h1 span,.sy-kicker){color:#b6f07b}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-home-hero .sy-button:not(.primary){background:#1c4030;border-color:#749581;color:#fff}
html:root body[data-synapsy-surface=home] .sy-home-hero .sy-actions{gap:10px;margin-top:28px}
html:root body[data-synapsy-surface=home] .sy-hero-side{min-width:0;padding:28px;border:1px solid #4e7059;border-radius:12px;background:#214a37;color:#f4faef}
html:root body[data-synapsy-surface=home] .sy-hero-side>h2{font-size:24px;line-height:1.2;letter-spacing:-.03em;font-weight:600;margin:0 0 22px;color:inherit}
html:root body[data-synapsy-surface=home] .sy-hero-side>p:first-child{color:#c4d9b4;font:600 10px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.12em;margin:0 0 12px}
html:root body[data-synapsy-surface=home] .sy-workflow{display:grid}
html:root body[data-synapsy-surface=home] .sy-workflow>a{display:grid;grid-template-columns:28px minmax(0,1fr) 18px;gap:12px;align-items:center;min-height:74px;padding:15px 0;border-top:1px solid #50705c;text-decoration:none;color:inherit}
html:root body[data-synapsy-surface=home] .sy-workflow>a:hover{color:#d8ffbf}
html:root body[data-synapsy-surface=home] .sy-workflow-number{font:500 11px ui-monospace,SFMono-Regular,Consolas,monospace;color:#b6f07b}
html:root body[data-synapsy-surface=home] .sy-workflow strong{font-size:14px;font-weight:600;line-height:1.4;display:block}
html:root body[data-synapsy-surface=home] .sy-workflow small{display:block;font-size:12px;line-height:1.5;color:#c4d6c7;margin-top:4px}
html:root body[data-synapsy-surface=home] .sy-hero-side>p:last-child{font-size:11px;line-height:1.7;color:#c4d6c7;margin:12px 0 0}
html:root body[data-synapsy-surface=home] .sy-work-rail{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin-bottom:42px;padding:12px 0 20px;border-bottom:1px solid var(--sy-line)}
html:root body[data-synapsy-surface=home] .sy-work-rail>span{font:600 10px ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.1em;color:var(--sy-muted);margin-right:7px}
html:root body[data-synapsy-surface=home] .sy-work-rail>a{min-height:44px;display:inline-flex;align-items:center;gap:10px;padding:9px 13px;border:1px solid var(--sy-line);border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;color:var(--sy-ink);background:var(--sy-surface)}
html:root body[data-synapsy-surface=home] .sy-work-rail>a:hover{border-color:var(--sy-accent);background:var(--sy-soft)}
html:root body[data-synapsy-surface=home] .sy-tool{border-top-width:1px;border-radius:10px;min-height:195px;padding:26px}
html:root body[data-synapsy-surface=home] .sy-tool-top{margin-bottom:22px}
html:root body[data-synapsy-surface=home] .sy-tool h3{font-size:23px;font-weight:650}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-tool[data-home-area="01"]{background:#e5f4d4;color:#163126;border-color:#a4c88b}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-tool[data-home-area="01"] :is(p,.sy-tool-top){color:#375b35}
html:root:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-tool[data-home-area="01"] .sy-tool-top>span:last-child{color:#163126;border-color:#7fa46a}
html:root[data-seva-theme=dark]:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-tool[data-home-area="01"]{background:#284a30;color:#effbe8;border-color:#6b9257}
html:root[data-seva-theme=dark]:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-tool[data-home-area="01"] :is(p,.sy-tool-top){color:#d0e6c5}
html:root[data-seva-theme=dark]:not([data-command-contrast]) body[data-synapsy-surface=home] .sy-tool[data-home-area="01"] .sy-tool-top>span:last-child{color:#effbe8;border-color:#7fa46a}
html:root body[data-synapsy-surface=home] .sy-business{padding-bottom:42px}
html:root body[data-synapsy-surface=home] .sy-business-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--sy-line);border-radius:10px;overflow:hidden;background:var(--sy-surface)}
html:root body[data-synapsy-surface=home] .sy-business-card{min-width:0;padding:26px;border-right:1px solid var(--sy-line)}
html:root body[data-synapsy-surface=home] .sy-business-card:last-child{border-right:0}
html:root body[data-synapsy-surface=home] .sy-business-card>span{display:block;font:600 10px ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.1em;color:var(--sy-accent);margin-bottom:13px}
html:root body[data-synapsy-surface=home] .sy-business-card h3{font-size:22px;line-height:1.25;margin:0 0 12px;font-weight:650;letter-spacing:-.025em}
html:root body[data-synapsy-surface=home] .sy-business-card p{font-size:13px;line-height:1.75;margin:0 0 12px;color:var(--sy-muted)}
html:root body[data-synapsy-surface=home] .sy-business-card a{display:inline-flex;align-items:center;min-height:44px;gap:12px;font-size:13px;font-weight:650;color:var(--sy-accent);text-underline-offset:5px}
html:root body[data-synapsy-surface=home] .sy-status-note{border-left-color:var(--sy-gold);padding:26px;border-radius:10px}
@media(max-width:1050px){html:root body[data-synapsy-surface=home] .sy-home-hero{grid-template-columns:minmax(0,1fr) 295px;gap:26px;padding:34px}html:root body[data-synapsy-surface=home] .sy-hero-side{padding:22px}html:root body[data-synapsy-surface=home] .sy-home-hero h1{font-size:clamp(39px,5.2vw,57px)}}
@media(max-width:800px){html:root body[data-synapsy-surface=home] .sy-home-hero{grid-template-columns:1fr;gap:28px;padding:32px}html:root body[data-synapsy-surface=home] .sy-hero-side{padding:22px 24px}html:root body[data-synapsy-surface=home] .sy-workflow{grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}html:root body[data-synapsy-surface=home] .sy-workflow>a{grid-template-columns:1fr;gap:8px;align-content:start}html:root body[data-synapsy-surface=home] .sy-workflow>a>span:last-child{display:none}html:root body[data-synapsy-surface=home] .sy-business-grid{grid-template-columns:1fr}html:root body[data-synapsy-surface=home] .sy-business-card{border-right:0;border-bottom:1px solid var(--sy-line)}html:root body[data-synapsy-surface=home] .sy-business-card:last-child{border-bottom:0}}
@media(max-width:560px){html:root body[data-synapsy-surface=home] .sy-home-hero{padding:27px 22px;gap:27px;margin-top:20px;border-radius:11px}html:root body[data-synapsy-surface=home] .sy-home-hero h1{font-size:clamp(34px,9vw,48px)}html:root body[data-synapsy-surface=home] .sy-home-hero .sy-lead{font-size:15px}html:root body[data-synapsy-surface=home] .sy-hero-side{padding:21px}html:root body[data-synapsy-surface=home] .sy-hero-side>h2{font-size:23px;margin-bottom:18px}html:root body[data-synapsy-surface=home] .sy-workflow{grid-template-columns:1fr;gap:0}html:root body[data-synapsy-surface=home] .sy-workflow>a{grid-template-columns:24px minmax(0,1fr) 16px;min-height:65px;gap:10px;padding:12px 0}html:root body[data-synapsy-surface=home] .sy-workflow>a>span:last-child{display:block}html:root body[data-synapsy-surface=home] .sy-work-rail{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:30px}html:root body[data-synapsy-surface=home] .sy-work-rail>span{grid-column:1/-1;padding-block:4px}html:root body[data-synapsy-surface=home] .sy-work-rail>a{justify-content:space-between;min-width:0;font-size:12px;padding:10px}html:root body[data-synapsy-surface=home] .sy-business-card{padding:23px}html:root body[data-synapsy-surface=home] .sy-business{padding-bottom:30px}html:root body[data-synapsy-surface=home] .sy-tool{min-height:0}}
html:root body[data-synapsy-surface=home] .sy-hero-copy{min-width:0}
html:root[data-command-compact] body[data-synapsy-surface=home] :is(.sy-home-hero,.sy-business-grid){grid-template-columns:minmax(0,1fr);gap:24px}
html:root[data-command-compact] body[data-synapsy-surface=home] .sy-business-card{border-right:0;border-bottom:1px solid var(--sy-line)}
html:root[data-command-compact] body[data-synapsy-surface=home] .sy-business-card:last-child{border-bottom:0}
html:root[data-command-narrow] body[data-synapsy-surface=home] :is(.sy-tools,.sy-workflow,.sy-work-rail){grid-template-columns:minmax(0,1fr)}
html:root[data-command-narrow] body[data-synapsy-surface=home] .sy-home-hero{padding:25px 20px}
html:root[data-command-narrow] body[data-synapsy-surface=home] .sy-home-hero h1{font-size:36px}
html:root[data-command-narrow] body[data-synapsy-surface=home] .sy-actions{align-items:stretch}
html:root[data-command-narrow] body[data-synapsy-surface=home] .sy-actions>a{width:100%;overflow-wrap:anywhere}
html:root[data-command-contrast] body[data-synapsy-surface=home] :is(.sy-home-hero,.sy-hero-side,.sy-work-rail>a,.sy-business-grid){background:Canvas;color:CanvasText;border-color:CanvasText}
html:root[data-command-contrast] body[data-synapsy-surface=home] :is(.sy-hero-side h2,.sy-hero-side p,.sy-workflow>a,.sy-workflow small,.sy-workflow-number){color:CanvasText}
@media print{body[data-synapsy-surface]{background:white!important;color:#172e3b!important}#seva-experience,#command-access,#seva-quick-actions{display:none}html:root body[data-synapsy-surface=workspace]>aside{display:none}html:root body[data-synapsy-surface=workspace]>main{margin:0;padding:0}#seva-copyright{background:white;color:#172e3b}}
`;

// A page needs the shared shell and its own surface rules, not every specialist
// layout. Keep the authored stylesheet intact and cache a conservative projection.
// Unknown selectors are retained; only explicit positive body scopes are omitted.
const synapsyStyleCache=new Map();
function synapsyCSSComments(source){
 let output='',quote='';
 for(let i=0;i<source.length;i++){
  const char=source[i];
  if(quote){output+=char;if(char==='\\'){output+=source[++i]||'';}else if(char===quote)quote='';continue;}
  if(char==='"'||char==="'"){quote=char;output+=char;continue;}
  if(char==='/'&&source[i+1]==='*'){const end=source.indexOf('*/',i+2);if(end<0)break;i=end+1;continue;}
  output+=char;
 }
 return output;
}
function synapsyCSSSelectors(source){
 const result=[];let start=0,depth=0,quote='';
 for(let i=0;i<source.length;i++){
  const char=source[i];
  if(quote){if(char==='\\')i++;else if(char===quote)quote='';continue;}
  if(char==='"'||char==="'"){quote=char;continue;}
  if(char==='('||char==='[')depth++;
  else if(char===')'||char===']')depth--;
  else if(char===','&&depth===0){result.push(source.slice(start,i).trim());start=i+1;}
 }
 result.push(source.slice(start).trim());return result;
}
function synapsyCSSMatchesSurface(selector,surface){
 const direct=selector.match(/\bbody(?:\.[\w-]+|\[(?!data-synapsy-surface=)[^\]]+\])*\[data-synapsy-surface=(["']?)([\w-]+)\1\]/);
 if(direct)return direct[2]===surface;
 const grouped=selector.match(/\bbody(?:\.[\w-]+|\[(?!data-synapsy-surface=)[^\]]+\])*:is\((\s*\[data-synapsy-surface=[^)]+)\)/);
 if(grouped){
  const scopes=synapsyCSSSelectors(grouped[1]).map(item=>item.match(/^\[data-synapsy-surface=(["']?)([\w-]+)\1\]$/));
  if(scopes.every(Boolean))return scopes.some(match=>match[2]===surface);
 }
 return true;
}
function synapsyCSSProject(source,surface){
 let output='',start=0,bodyStart=0,depth=0,quote='',header='';
 for(let i=0;i<source.length;i++){
  const char=source[i];
  if(quote){if(char==='\\')i++;else if(char===quote)quote='';continue;}
  if(char==='"'||char==="'"){quote=char;continue;}
  if(char==='{'){
   if(depth===0){header=source.slice(start,i).trim();bodyStart=i+1;}
   depth++;
  }else if(char==='}'&&--depth===0){
   const body=source.slice(bodyStart,i);
   if(/^@(media|supports|container|layer)\b/.test(header)){
    const nested=synapsyCSSProject(body,surface);if(nested)output+=header+'{'+nested+'}';
   }else if(header.startsWith('@'))output+=header+'{'+body.trim()+'}';
   else{
    const selectors=synapsyCSSSelectors(header).filter(selector=>synapsyCSSMatchesSurface(selector,surface));
    if(selectors.length)output+=selectors.join(',')+'{'+body.trim()+'}';
   }
   start=i+1;
  }
 }
 return output+source.slice(start).trim();
}
export function synapsyStyleForSurface(surface){
 if(!synapsyStyleCache.has(surface))synapsyStyleCache.set(surface,synapsyCSSProject(synapsyCSSComments(SYNAPSY_WORKSPACE_STYLE),surface));
 return synapsyStyleCache.get(surface);
}

export function withSynapsyChrome(html,url){
 if(typeof html!=='string'||!html.includes('</head>'))return html;
 const surface=synapsySurfaceForURL(url);
 if(!html.includes('id="synapsy-style"')){
  const appleIcon=/<link\b[^>]*\brel=["']apple-touch-icon["']/i.test(html)?'':'<link rel="apple-touch-icon" href="/assets/seva-icon-192.png" sizes="192x192">';
  html=html.replace('</head>','<link rel="icon" href="/assets/seva-icon-192.png" type="image/png" sizes="192x192">'+appleIcon+'<style id="synapsy-style">'+synapsyStyleForSurface(surface)+'</style></head>');
 }
 if(surface)html=html.replace(/<body\b([^>]*)>/i,(_,attrs)=>'<body'+attrs+(/\bdata-synapsy-surface=/.test(attrs)?'':' data-synapsy-surface="'+surface+'"')+(surface==='workspace'&&!/\bdata-synapsy-workspace=/.test(attrs)?' data-synapsy-workspace="true"':'')+'>');
 return html;
}
