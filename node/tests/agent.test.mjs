import test from 'node:test';
import assert from 'node:assert/strict';
import {callAgentTool} from '../lib/agent.mjs';
import {createFixtureAdapter, createLocalGatewayAdapter} from '../lib/adapters.mjs';

test('valid reservation yields immutable PREVIEW_ONLY intent, never a write', async () => {
  const adapter = await createFixtureAdapter();
  const args = {order_number: 'DEMO-0001', sku: 'SKU-DEMO-1', quantity: 2};
  const a = await callAgentTool('preview_reservation', args, adapter);
  const b = await callAgentTool('preview_reservation', args, adapter);
  assert.equal(a.status, 'PREVIEW_ONLY');
  assert.equal(a.approval_required, true);
  assert.equal(a.writes_performed, 0);
  assert.match(a.intent_sha256, /^[a-f0-9]{64}$/);
  assert.equal(a.intent_sha256, b.intent_sha256);
  const order = await adapter.getOrder('DEMO-0001');
  assert.equal(order.lines[0].reserved, 0);
});

test('reads expose strictly synthetic evidence', async () => {
  const adapter = await createFixtureAdapter();
  const row = await callAgentTool('get_stock', {sku: 'SKU-DEMO-1'}, adapter);
  assert.equal(row.mode, 'SYNTHETIC_READ_ONLY');
  assert.equal(row.stock.free, 19);
});

test('unknown tools are blocked', async () => {
  const adapter = await createFixtureAdapter();
  await assert.rejects(
    callAgentTool('reserve_execute', {order_number: 'DEMO-0001'}, adapter), /TOOL_NOT_ALLOWED/);
});

test('extra tool arguments are rejected', async () => {
  const adapter = await createFixtureAdapter();
  await assert.rejects(
    callAgentTool('get_stock', {sku: 'SKU-DEMO-1', url: 'https://example.org'}, adapter),
    /INVALID_TOOL_ARGS/);
});

test('order must be posted', async () => {
  const adapter = await createFixtureAdapter();
  await assert.rejects(
    callAgentTool('preview_reservation',
      {order_number: 'DEMO-0002', sku: 'SKU-DEMO-1', quantity: 1}, adapter),
    /ORDER_NOT_POSTED/);
});

test('preview cannot exceed unreserved order quantity', async () => {
  const adapter = await createFixtureAdapter();
  await assert.rejects(
    callAgentTool('preview_reservation',
      {order_number: 'DEMO-0001', sku: 'SKU-DEMO-1', quantity: 4}, adapter),
    /QUANTITY_EXCEEDS_ORDER_LINE/);
});

test('invalid/ambiguous input is rejected', async () => {
  const adapter = await createFixtureAdapter();
  await assert.rejects(callAgentTool('get_order', {order_number: '../private'}, adapter), /INVALID_ORDER_NUMBER/);
  await assert.rejects(callAgentTool('preview_reservation',
    {order_number: 'DEMO-0001', sku: 'SKU-DEMO-1', quantity: 1.5}, adapter), /INVALID_QUANTITY/);
  await assert.rejects(callAgentTool('get_stock', {sku: 'SKU-DEMO-99'}, adapter), /STOCK_NOT_FOUND/);
});

test('missing live data fails closed rather than fabricating facts', async () => {
  const fail = {getOrder: async () => {throw new Error('OFFLINE');}, getStock: async () => {throw new Error('OFFLINE');}};
  await assert.rejects(callAgentTool('preview_reservation',
    {order_number: 'DEMO-0001', sku: 'SKU-DEMO-1', quantity: 2}, fail), /OFFLINE/);
});

test('stock mismatch is not silently accepted', async () => {
  const bad = {getOrder: async () => ({
    number: 'DEMO-0001', status: 'posted', lines: [{sku:'SKU-DEMO-1', quantity:2, reserved:0}]
  }), getStock: async () => ({sku:'SKU-DEMO-1', physical:10, reserved_total:5, free:9})};
  await assert.rejects(callAgentTool('preview_reservation',
    {order_number:'DEMO-0001', sku:'SKU-DEMO-1', quantity:1}, bad), /STOCK_BALANCE_INCONSISTENT/);
});

test('remote host cannot be configured for mock gateway', () => {
  assert.throws(() => createLocalGatewayAdapter('https://private.example.org'), /NON_LOCAL_GATEWAY_FORBIDDEN/);
});
