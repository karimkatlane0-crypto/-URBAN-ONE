// This simulation cannot sign a PDF, identify a person, issue a QES or call InfoCert.
const STATES=new Set(['ready_for_review','invited_mock','in_progress_mock',
  'completed_mock','declined_mock','expired_mock','cancelled_mock']);
function validMockRef(ref){
  return typeof ref==='string'&&/^mock-[a-zA-Z0-9_-]{1,64}$/.test(ref);
}
function gate(mode){
  if(mode!=='sandbox_mock')throw new Error('INFOCERT_PROVIDER_NOT_ENABLED');
}
export function prepareInfocertMock({mode='disabled',tenantId,contractRef,documentSha256,signerIds=[]}={}){
  gate(mode);
  if(!validMockRef(tenantId)||!validMockRef(contractRef))throw new Error('MOCK_CONTRACT_REFERENCE_REQUIRED');
  if(!/^[a-fA-F0-9]{64}$/.test(documentSha256??''))throw new Error('VALID_SHA256_REQUIRED');
  if(!Array.isArray(signerIds)||signerIds.length!==2||
    !signerIds.every(validMockRef)||new Set(signerIds).size!==2){
    throw new Error('TWO_DISTINCT_MOCK_SIGNERS_REQUIRED');
  }
  return {
    provider:'infocert',simulation:true,mode:'sandbox_mock',
    state:'ready_for_review',contractRef,tenantId,documentSha256,
    signerIds:[...signerIds],signatureApplied:false,legalSignature:false,
    providerCalled:false
  };
}
export function advanceInfocertMock(flow,{mode='disabled',event}={}){
  gate(mode);
  if(!flow||flow.simulation!==true||!STATES.has(flow.state)||flow.signatureApplied!==false||
    !Array.isArray(flow.signerIds)||flow.signerIds.length!==2){
    throw new Error('VALID_MOCK_FLOW_REQUIRED');
  }
  const map={
    ready_for_review:{invite:'invited_mock',cancel:'cancelled_mock'},
    invited_mock:{start:'in_progress_mock',decline:'declined_mock',expire:'expired_mock',cancel:'cancelled_mock'},
    in_progress_mock:{mock_complete:'completed_mock',decline:'declined_mock',expire:'expired_mock',cancel:'cancelled_mock'}
  };
  const transitions=map[flow.state];
  const next=typeof event==='string'&&transitions&&Object.hasOwn(transitions,event)
    ?transitions[event]:undefined;
  if(!next)throw new Error('INVALID_MOCK_TRANSITION');
  return {...flow,state:next,signatureApplied:false,legalSignature:false,providerCalled:false};
}
