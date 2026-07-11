<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:owner-dashboard-protection -->
# Owner dashboard — protected baseline

Do **not** `git checkout` / `git restore` / bulk-delete owner dashboard files to "fix" issues. The premium owner UI (top nav, property cards, listing workspace, short-term pricing calendar) is the intended product.

If something looks broken: fix the specific file, or `npm run dev:restart:clean` — never revert the whole dashboard to the old sidebar layout unless the user explicitly asks.
<!-- END:owner-dashboard-protection -->
