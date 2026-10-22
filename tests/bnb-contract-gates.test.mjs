import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateBnbContract} from '../packages/bnb/contract-gates.mjs';

test('contract blocks unauthenticated actions', () => {
  assert.equal(evaluateBnbContract({}).decision, 'BLOCKED');
  assert.equal(evaluateBnbContract({action:'monthly_subscription'}).decision,'BLOCKED');
});

test('contract never calls an external payment service', () => {
  const result = evaluateBnbContract({action:'direct_booking_commission'});
  assert.equal(result.externalActionPerformed, false);
  assert.equal(result.proposedAmountCents, null);
});