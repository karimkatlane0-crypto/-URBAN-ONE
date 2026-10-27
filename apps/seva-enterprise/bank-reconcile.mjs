#!/usr/bin/env node
// Private operator-only banking reconciliation. NEVER expose this script via HTTP.
// Requires independently verified cleared funds in the merchant's own bank statement.
import {createStore} from './core.mjs';
import {createInterface} from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import {isAbsolute} from 'node:path';
const fail=message=>{throw Error(message);};
async function main(){
 const [orderId,amountStr]=process.argv.slice(2);
 if(process.env.SEVA_BANK_RECONCILE_ALLOWED!=='true')fail('Operator reconciliation is disabled');
 if(!process.stdin.isTTY||!process.stdout.isTTY)fail('Reconciliation requires a direct interactive operator TTY');
 if(!process.env.SEVA_DB_PATH||!isAbsolute(process.env.SEVA_DB_PATH))fail('Use an absolute path to the persistent SEVA SQLite database');
 const operator=String(process.env.SEVA_BANK_OPERATOR||'').trim();
 if(operator.length<3)fail('Set SEVA_BANK_OPERATOR for audit attribution');
 if(!/^[0-9a-f-]{36}$/i.test(orderId||''))fail('Valid order ID required');
 if(!/^[1-9][0-9]{0,8}$/.test(amountStr||''))fail('Enter exact bank statement credit amount in euro cents');
 const store=createStore(process.env.SEVA_DB_PATH);
 const rl=createInterface({input,output});
 try{
  const approval=await rl.question('Did you independently inspect a CLEARED bank statement credit in the recipient account for this exact order, beneficiary and amount? Type CREDIT VERIFIED: ');
  if(approval!=='CREDIT VERIFIED')fail('Independent cleared-funds review not confirmed');
  const bankReference=await rl.question('Enter unique credited transaction reference from bank statement (not buyer screenshot): ');
  if(bankReference.trim().length<8)fail('Unique bank statement reference missing');
  const preview=store.db.prepare('SELECT reference,plan,amount_cents,status,user_id FROM seva_bank_orders WHERE id=?').get(orderId);
  if(!preview||preview.status!=='pending'||preview.amount_cents!==Number(amountStr))fail('Order pending status and amount must match exactly');
  output.write('Review: '+JSON.stringify({orderId,reference:preview.reference,plan:preview.plan,amountCents:preview.amount_cents,status:preview.status})+'\n');
  const final=await rl.question('To reconcile the cleared credit and grant time-limited access, type the order reference exactly: ');
  if(final!==preview.reference)fail('Final reconciliation check failed');
  const result=store.bank.reconcile({orderId,amountCents:Number(amountStr),bankTransactionReference:bankReference,operator,statementVerified:true});
  output.write('Verified credit recorded: '+JSON.stringify(result)+'\n');
 }finally{rl.close();store.db.close();}
}
main().catch(e=>{process.stderr.write('Reconciliation stopped: '+e.message+'\n');process.exitCode=1;});
