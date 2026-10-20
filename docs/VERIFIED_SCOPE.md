# Verified project scope vs simulated portfolio demo

This document distinguishes **reported/verified educational-1C work in the private project** from the **public example**.

## Private project — documented evidence dated 19 October 2026

The project's internal progress notes document:

- A Hermes MCP connector discovering the configured 1C read tools.
- A verified natural-language lookup for a demonstration order.
- A **human-approved** reservation of two units in the **educational 1C database**, with readback confirming the order reserve changed from 0 to 2.
- A separately approved release of that reserve, with readback from 2 to 0.
- Recovery of a disconnected bridge/reverse tunnel and successful read-only MCP checks.

These are **test environment** results, not evidence of a deployed production solution, customer ROI, or autonomous execution.

## Known unfinished work in private project

- A single independently verified Telegram-driven journey from a new order through reserve, actual invoice, PDF and authorized sending
- Mapping authenticated Telegram identities to permitted counterparties and orders
- Full safe automation of reserve/release without requiring a UI operator for every step
- Production hardening, incident handling and permissions

## Public repository — what is actually runnable here

- Read-only simulated ERP API implemented in Python
- Node.js tool routing, business-state validation and dry-run reservation planning
- Synthetic JSON inputs, SHA-256 intent fingerprint and automated tests
- Local demonstration of Python ↔ Node integration

**Public demo never makes an actual 1C write.** Its examples are intentionally synthetic and must not be cited as real integration-test results. The original integration sources remain private.
