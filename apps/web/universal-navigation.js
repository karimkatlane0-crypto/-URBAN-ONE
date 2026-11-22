/* SUPER.AI navigation graph — explicit product boundaries, no implicit cross-tenant access. */
(() => {
  'use strict';
  const nodes = [
    { id:'universal-36', label:'UNIVERSAL 36', href:'./universal-36.html', boundary:'control-plane', permission:'workspace:read' },
    { id:'titans', label:'TITANS Enterprise Studio', href:'./titans-enterprise-studio.html', boundary:'titans', permission:'titans:read' },
    { id:'insights', label:'INSIGHTS.ai', href:'./insights-ai.html', boundary:'insights', permission:'insights:read' },
    { id:'gita', label:'GITA.IA', href:'./titans-enterprise-studio.html#intelligence', boundary:'titans-agent-registry', permission:'agents:read' },
    { id:'seva-studio', label:'SEVA Unified Studio', href:'./seva-unified-studio.html', boundary:'seva-studio', permission:'seva:read' },
    { id:'seva-crm', label:'SEVA CRM', href:'./seva-crm-studio.html', boundary:'seva-crm', permission:'crm:read' },
    { id:'synapsy', label:'SYNAPSY', href:'./synapsy.html', boundary:'synapsy', permission:'synapsy:read' },
    { id:'kkubera', label:'KKUBERA Discovery', href:'./discovery.html', boundary:'kkubera', permission:'kkubera:read' },
    { id:'urban-one', label:'URBAN ONE Workspace', href:'./v10-workspace.html', boundary:'urban-one', permission:'urban-one:read' },
    { id:'maps-europe', label:'Maps Europa', href:'./maps-europe.html', boundary:'maps-europe', permission:'maps:read' },
    { id:'seva-public', label:'SEVA pubblico', href:'https://seva.karimkatlane0.chatgpt.site/superapp', boundary:'external', permission:'public:read' }
  ];
  const verify = () => {
    const failures = [];
    for (const node of nodes) {
      const link = document.querySelector('[data-nav-node="' + node.id + '"]');
      if (!link) { failures.push({ id:node.id, reason:'missing node link' }); continue; }
      const actual = link.getAttribute('href');
      if (actual !== node.href) failures.push({ id:node.id, reason:'href mismatch', expected:node.href, actual });
      link.dataset.productBoundary = node.boundary;
      link.dataset.requiredPermission = node.permission;
      link.setAttribute('aria-label', node.label + ' — apri');
      if (node.boundary === 'external') {
        link.setAttribute('target','_blank');
        link.setAttribute('rel','noopener noreferrer');
      }
    }
    const proof = document.getElementById('sa-navigation-proof');
    if (proof) {
      proof.textContent = failures.length
        ? 'Grafo navigazione: NON SUPERATO — ' + failures.length + ' collegamenti da correggere.'
        : 'Grafo navigazione: ' + nodes.length + '/' + nodes.length + ' nodi collegati e verificati. Confini di prodotto espliciti; i permessi effettivi restano verificati dal backend.';
      proof.dataset.status = failures.length ? 'fail' : 'pass';
    }
    document.documentElement.dataset.navigationGraph = failures.length ? 'fail' : 'pass';
    return { total:nodes.length, passed:nodes.length-failures.length, failed:failures.length, failures };
  };
  window.SUPER_AI_NAVIGATION = Object.freeze({ version:'1.0.0', nodes:Object.freeze(nodes), verify });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', verify, { once:true });
  else verify();
})();
