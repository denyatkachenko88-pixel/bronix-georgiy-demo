#!/usr/bin/env node
import {callAgentTool} from './lib/agent.mjs';
import {createFixtureAdapter, createLocalGatewayAdapter} from './lib/adapters.mjs';

const raw = process.argv.slice(2);
const gateway = raw.includes('--gateway');
const argv = raw.filter(x => x !== '--gateway');
const [command, ...params] = argv;

async function main() {
  const adapter = gateway
    ? createLocalGatewayAdapter()
    : await createFixtureAdapter();

  let result;
  if (command === 'health' && params.length === 0) {
    result = await adapter.health();
  } else if (command === 'stock' && params.length === 1) {
    result = await callAgentTool('get_stock', {sku: params[0]}, adapter);
  } else if (command === 'order' && params.length === 1) {
    result = await callAgentTool('get_order', {order_number: params[0]}, adapter);
  } else if (command === 'preview' && params.length === 3) {
    result = await callAgentTool('preview_reservation',
      {order_number: params[0], sku: params[1], quantity: Number(params[2])}, adapter);
  } else {
    throw new Error('Usage: node node/cli.mjs health|stock SKU-DEMO-1|order DEMO-0001|preview DEMO-0001 SKU-DEMO-1 2 [--gateway]');
  }
  console.log(JSON.stringify(result, null, 2));
}
main().catch(err => {
  // No secrets, stack traces or source records in CLI error output.
  console.error('ERROR: ' + err.message);
  process.exitCode = 1;
});
