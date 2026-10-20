# Architecture and trust boundaries

## Original BRONIX / Georgiy proof-of-concept (private)

The private architecture described in the original project documentation:

\`\`\`text
Telegram request
    |
    v
Hermes agent on VPS
    | restricted tool call
    v
MCP facade / allowlisted operations
    | authenticated bridge and reverse tunnel
    v
HOME-PC adapter
    | authorized OData access
    v
Educational 1C instance
\`\`\`

The private project has documented read-only stock/order lookups and *separately authorized* test-1C reserve/release operations. Work remains on identity-to-order permissions and the full unattended end-to-end transaction. This is **not a claim of a production-ready ERP agent**.

The public repository intentionally excludes Telegram configuration, identities, private integrations, tunnels, tokens, company records and live endpoint code.

## Runnable public demo

\`\`\`text
Node CLI
  |
  +--> allowlisted agent tool dispatcher (node/lib/agent.mjs)
            |
            +--> validate IDs, quantities, permissions
            +--> compare order line + stock availability
            +--> issue PREVIEW_ONLY proposal + intent hash
            |
            v
       adapter interface
           | \
           |  +--> fixture adapter --> fixtures/one_c_demo.json
           |
           +-----> HTTP GET adapter --> Python localhost simulator
                                           |
                                           +--> synthetic JSON fixtures
                                           +--> POST/PATCH/DELETE => 405
\`\`\`

### What is deliberately absent

- No access to real 1C, BRONIX, Telegram, VPS, databases, billing, CRM or email
- No persistence and no write path
- No real LLM calls, autonomy, tools with broad filesystem/shell permissions
- No claim that a \`PREVIEW_ONLY\` proposal changed any underlying system

### Safety design

- **Least privilege:** public tool contract contains only GET and reservation *preview* operations.
- **Fail closed:** unavailable records, inconsistent balances, unknown status or ambiguous identity return an error.
- **No stale fallback:** simulated evidence is explicitly marked \`synthetic\`, not represented as live ERP data.
- **Human confirmation:** fingerprint allows binding a later approval to an exact proposal, but this public demo implements **no approval/write executor**.
- **Testability:** the transport is injected, so the same orchestration can be tested without live systems.

## Implementation choices

Python simulates a restricted read-only ERP API; Node.js orchestrates tool calls and validates business invariants. JSON schemas document the narrow agent-facing interface. This separation mirrors the approach of the private project without exposing sensitive integration details.
