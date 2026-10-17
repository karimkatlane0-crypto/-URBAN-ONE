import test from 'node:test';
import assert from 'node:assert/strict';
import {networkPassPolicy,quoteNetworkPass} from '../packages/bnb/network-pass.mjs';

test('default network pass preserves a 6-night standard credit ceiling',()=>{
  const policy=networkPassPolicy();
  assert.equal(policy.annualFeeCents,100000);
  assert.equal(policy.hostSettlementPoolCents,72000);
  assert.equal(policy.platformGrossAllocationCents,18000);
  assert.equal(policy.riskReserveCents,5000);
  assert.equal(policy.paymentAndOpsCents,5000);
  assert.equal(policy.maxStandardNightCredits,6);
  assert.equal(policy.userPromise.zeroAtStayWithinCredits,true);
  assert.equal(policy.userPromise.unlimitedNights,false);
  assert.equal(policy.hostPromise.propertyOwnershipTransferred,false);
  assert.equal(policy.hostPromise.participationReversible,true);
});

test('default expected utilization keeps positive contribution before fixed costs',()=>{
  const q=quoteNetworkPass();
  assert.equal(q.expectedRedeemedNights,4.2);
  assert.equal(q.expectedHostSettlementCents,50400);
  assert.equal(q.contributionBeforeFixedCostsCents,39600);
  assert.equal(q.contributionMarginBps,3960);
  assert.equal(q.effectiveMemberCostPerRedeemedNightCents,23810);
  assert.equal(q.includedCapacityExceeded,false);
});

test('full 6-night utilization preserves the negotiated 18 percent platform gross allocation',()=>{
  const q=quoteNetworkPass({expectedRedeemedNights:6});
  assert.equal(q.expectedHostSettlementCents,72000);
  assert.equal(q.contributionBeforeFixedCostsCents,18000);
  assert.equal(q.contributionMarginBps,1800);
});

test('allocation percentages must total 100 percent',()=>{
  assert.throws(()=>networkPassPolicy({platformGrossBps:1900}),/NETWORK_PASS_ALLOCATIONS_MUST_TOTAL_100_PERCENT/);
});
