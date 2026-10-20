# BRONIX / Georgiy — AI Agent + 1C integration (public engineering demo)

**Python · Node.js · JSON contracts · MCP-style tools · 1C/OData concepts · Agent orchestration · Tests**

A **sanitized, runnable engineering demonstration** based on the architecture and verified learning-environment experiments of a private BRONIX / Georgiy project. It shows how an AI assistant can request narrow business operations, verify facts and prepare a controlled action against an ERP-like system.

> **Scope matters.** The public code uses **synthetic fixtures** and a local, read-only **1C simulator**. It does **not** connect to a real 1C instance, the private Hermes agent, Telegram, company infrastructure or customer records. A preview is **not** a completed reservation. The private source project is a work in progress, not a finished production rollout.

## What you can review here

| Component | Purpose |
| --- | --- |
| [Node.js agent/tool layer](node/lib/agent.mjs) | Strict allowlisted tools, input validation, order/stock cross-checks, fail-closed reserve preview, SHA-256 intent fingerprint |
| [Adapters](node/lib/adapters.mjs) | Same interface for JSON fixture data and a localhost Python simulator |
| [Python read-only gateway](python/demo_gateway.py) | Minimal REST GET facade over synthetic 1C-style data; rejects state-changing HTTP verbs |
| [MCP-style tool contracts](shared/mcp-tools.json) | JSON schemas describing exactly what an agent is allowed to request |
| [Tests](node/tests/agent.test.mjs) | Positive/negative scenarios: invalid input, missing order, insufficient stock, unauthorized tool names and data unavailability |
| [Architecture](docs/ARCHITECTURE.md) | Private system concept vs public runnable demo |
| [Evidence and limitations](docs/VERIFIED_SCOPE.md) | Distinguishes original 1C checks from locally simulated functionality |

## Quick start — no tokens, accounts or dependencies

Requires **Node.js 20+** and **Python 3.10+**. Both demos use only built-in libraries.

### 1. Run the Node.js agent against fixture data

\`\`\`bash
node node/cli.mjs health
node node/cli.mjs stock SKU-DEMO-1
node node/cli.mjs order DEMO-0001
node node/cli.mjs preview DEMO-0001 SKU-DEMO-1 2
\`\`\`

The \`preview\` command returns an immutable *proposed intent*, evidence from order and stock data, and a SHA-256 fingerprint. **It does not reserve stock, post documents or send messages.**

### 2. Connect Node.js to the local Python API

Terminal A:

\`\`\`bash
python python/demo_gateway.py
\`\`\`

Terminal B:

\`\`\`bash
node node/cli.mjs preview DEMO-0001 SKU-DEMO-1 2 --gateway
\`\`\`

The gateway only listens on \`127.0.0.1:8765\` and serves synthetic test data. Node accepts this hardcoded local endpoint only.

### 3. Run tests

\`\`\`bash
node --test node/tests/*.test.mjs
python -m unittest discover -s python/tests -v
\`\`\`

GitHub Actions also runs both test suites on pushes.

## What this demonstrates

1. **Business understanding:** translate natural-language requests into explicit, bounded business operations.
2. **Agent safety:** expose a narrow tool catalog rather than arbitrary code execution or database access.
3. **Integration design:** isolate data access from orchestration, make the transport mockable.
4. **Correctness:** verify order state, item identity, requested quantity and available stock; reject ambiguous/missing data.
5. **Operational discipline:** stage action proposals, preserve exact intent with a fingerprint and reserve live writes for a separately authorized and audited workflow.

The real private project's documented architecture is Telegram → Hermes (VPS) → MCP bridge → authenticated HOME-PC integration → educational 1C. Only selected parts have passed live educational-1C checks; read [verified scope](docs/VERIFIED_SCOPE.md).

## For a technical interview

I can walk through the agent/tool boundary, Python/Node interaction, validation and error paths, data contracts, testing, and how the private proof-of-concept evolved. Private repositories and credentials are not published; a screen-share walkthrough of private code is possible by arrangement.

**No license is granted in this repository.** Source is provided for portfolio review.
