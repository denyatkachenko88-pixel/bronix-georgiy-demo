import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const FIXTURE_URL = new URL('../../fixtures/one_c_demo.json', import.meta.url);

function notFound(kind, id) {
  throw new Error(kind + '_NOT_FOUND: ' + id);
}

/** Purely synthetic, dependency-free adapter used by tests and offline demo. */
export async function createFixtureAdapter() {
  const data = JSON.parse(await readFile(fileURLToPath(FIXTURE_URL), 'utf8'));
  if (data.dataset !== 'SYNTHETIC_ONLY') throw new Error('UNTRUSTED_DATASET');
  return {
    async getOrder(number) {
      const item = data.orders.find(row => row.number === number);
      if (!item) return notFound('ORDER', number);
      return structuredClone(item);
    },
    async getStock(sku) {
      const item = data.stock.find(row => row.sku === sku);
      if (!item) return notFound('STOCK', sku);
      return structuredClone(item);
    },
    async health() {
      return {status: 'ok', dataset: 'SYNTHETIC_ONLY', mode: 'FIXTURE_READ_ONLY'};
    }
  };
}

/** Only the local mock Python server is accepted, never a production endpoint. */
export function createLocalGatewayAdapter(base = 'http://127.0.0.1:8765') {
  if (base !== 'http://127.0.0.1:8765') throw new Error('NON_LOCAL_GATEWAY_FORBIDDEN');
  async function get(path) {
    const response = await fetch(base + path, {
      method: 'GET',
      headers: {Accept: 'application/json'},
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) throw new Error('GATEWAY_UNAVAILABLE_OR_REJECTED_' + response.status);
    const data = await response.json();
    if (data.dataset && data.dataset !== 'SYNTHETIC_ONLY') throw new Error('UNTRUSTED_DATASET');
    return data;
  }
  return {
    getOrder: number => get('/orders/' + encodeURIComponent(number)),
    getStock: sku => get('/stock/' + encodeURIComponent(sku)),
    health: () => get('/health')
  };
}
