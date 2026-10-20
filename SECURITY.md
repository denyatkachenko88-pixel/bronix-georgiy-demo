# Security policy for the public demo

This repository contains **no intentional production credentials or real customer data**.

- Do not put \`.env\`, service-account JSON, API keys, Telegram tokens, SSH keys, 1C logins or business exports into commits.
- Public samples must use synthetic IDs, synthetic inventory and localhost-only endpoints.
- No production or private 1C connection is provided.
- The Node adapter refuses non-local HTTP bases.
- The Python simulator refuses state-changing methods.
- If any credential is accidentally committed, **revoke/rotate it immediately**, even if the file is later deleted: Git history can preserve secrets.

The public demo is intentionally not a production service and must not be exposed to the internet as an authenticated integration.
