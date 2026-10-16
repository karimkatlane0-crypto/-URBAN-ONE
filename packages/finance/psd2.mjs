export function preparePis({amount,currency,beneficiary,humanApproved=false,scaReceipt=null}){
  if(!humanApproved) throw new Error('HUMAN_APPROVAL_REQUIRED');
  if(!scaReceipt) throw new Error('SCA_RECEIPT_REQUIRED');
  return {state:'prepared_not_executed',amount,currency,beneficiary,scaReceipt};
}
