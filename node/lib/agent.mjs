import {createHash} from 'node:crypto';

const ORDER_ID = /^DEMO-[0-9]{4}$/;
const SKU = /^SKU-DEMO-[0-9]+$/;
const ALLOWED = new Set(['get_order', 'get_stock', 'preview_reservation']);
const requireValid = (ok, msg) => {if (!ok) throw new Error(msg);};

function exactFields(data, keys) {
  requireValid(data && typeof data === 'object' && !Array.isArray(data), 'INVALID_ARGS');
  const actual = Object.keys(data).sort();
  requireValid(JSON.stringify(actual) === JSON.stringify([...keys].sort()), 'INVALID_TOOL_ARGS');
}

function validOrderNumber(id) {
  requireValid(typeof id === 'string' && ORDER_ID.test(id), 'INVALID_ORDER_NUMBER');
}
function validSku(sku) {
  requireValid(typeof sku === 'string' && SKU.test(sku), 'INVALID_SKU');
}
function validQuantity(quantity) {
  requireValid(Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= 20, 'INVALID_QUANTITY');
}

function validStock(row, sku) {
  requireValid(row?.sku === sku, 'STOCK_IDENTITY_MISMATCH');
  for (const key of ['physical', 'reserved_total', 'free']) {
    requireValid(Number.isSafeInteger(row[key]) && row[key] >= 0, 'STOCK_INVALID_' + key);
  }
  requireValid(row.physical - row.reserved_total === row.free, 'STOCK_BALANCE_INCONSISTENT');
}

/** Narrow MCP-style tool router. There is deliberately no write tool. */
export async function callAgentTool(name, args, adapter) {
  requireValid(ALLOWED.has(name), 'TOOL_NOT_ALLOWED');
  requireValid(adapter && typeof adapter.getOrder === 'function'
    && typeof adapter.getStock === 'function', 'ADAPTER_UNAVAILABLE');

  if (name === 'get_order') {
    exactFields(args, ['order_number']);
    validOrderNumber(args.order_number);
    const order = await adapter.getOrder(args.order_number);
    requireValid(order?.number === args.order_number, 'ORDER_IDENTITY_MISMATCH');
    return {mode: 'SYNTHETIC_READ_ONLY', order};
  }

  if (name === 'get_stock') {
    exactFields(args, ['sku']);
    validSku(args.sku);
    const stock = await adapter.getStock(args.sku);
    validStock(stock, args.sku);
    return {mode: 'SYNTHETIC_READ_ONLY', stock};
  }

  exactFields(args, ['order_number', 'sku', 'quantity']);
  validOrderNumber(args.order_number);
  validSku(args.sku);
  validQuantity(args.quantity);

  // Re-read both records every time; don't silently use cached or fabricated balances.
  const order = await adapter.getOrder(args.order_number);
  const stock = await adapter.getStock(args.sku);
  requireValid(order?.number === args.order_number, 'ORDER_IDENTITY_MISMATCH');
  requireValid(order?.status === 'posted', 'ORDER_NOT_POSTED');
  requireValid(Array.isArray(order.lines), 'ORDER_LINES_INVALID');
  const rows = order.lines.filter(row => row.sku === args.sku);
  requireValid(rows.length === 1, 'ORDER_LINE_MISSING_OR_AMBIGUOUS');
  const line = rows[0];
  requireValid(Number.isSafeInteger(line.quantity) && Number.isSafeInteger(line.reserved)
    && line.quantity > 0 && line.reserved >= 0 && line.reserved <= line.quantity,
  'ORDER_LINE_INVALID');
  validStock(stock, args.sku);
  requireValid(args.quantity <= line.quantity - line.reserved, 'QUANTITY_EXCEEDS_ORDER_LINE');
  requireValid(args.quantity <= stock.free, 'INSUFFICIENT_FREE_STOCK');

  const intent = {
    operation: 'reserve_preview',
    order_number: order.number,
    sku: args.sku,
    quantity: args.quantity,
    observed: {line_reserved: line.reserved, free_stock: stock.free}
  };
  const intent_sha256 = createHash('sha256').update(JSON.stringify(intent)).digest('hex');
  return {
    status: 'PREVIEW_ONLY',
    data_origin: 'SYNTHETIC_ONLY',
    approval_required: true,
    writes_performed: 0,
    intent,
    intent_sha256,
    note: 'Demonstration proposal only. No live ERP read/write, no reservation.'
  };
}
