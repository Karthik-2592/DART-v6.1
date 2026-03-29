# Antigravity Agent Directives

Preserve compute quota to the best of your ability.

## 1. Operational Guardrails (Quota Protection)
* **Read Before Writing:** When opening a file, only read the functions or components relevant to the specific task. Do not ingest the entire file into context if you only need to modify a single line.
* **Do Not Perform Verification Unless Asked To:** Verification will be done externally, and never to be performed by you (unless mentioned explicitly to do so).
* **No Automated Verification:** Do not perform automated verification unless explicitly asked to do so.
* **Query for any possible Open questions:** If there are any open questions, ask for clarification before proceeding.
## 2. Code Generation Boundaries
* **Zero-Bloat Outputs:** Do not add "helpful" boilerplate comments like `// Added by AI` or over-explain the code you just wrote. Keep responses and code changes concise.

## 3. General Instructions
* **Split work into smaller tasks** Split each task into smaller tasks (unless mentioned otherwise) and ask for confirmation each time.