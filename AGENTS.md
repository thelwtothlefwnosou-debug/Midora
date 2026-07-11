<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:owner-dashboard-protection -->
# Owner dashboard — protected baseline

Do **not** `git checkout` / `git restore` / bulk-delete owner dashboard files to "fix" issues. The premium owner UI (top nav, property cards, listing workspace, short-term pricing calendar) is the intended product.

If something looks broken: fix the specific file, or `npm run dev:restart:clean` — never revert the whole dashboard to the old sidebar layout unless the user explicitly asks.
<!-- END:owner-dashboard-protection -->

<!-- BEGIN:auto-checkpoint -->
# Auto checkpoint

Cursor hooks save a file checkpoint automatically when agent edits end (`auto-agent` label in `midora-checkpoints/`). Git commits are still required for permanent version history — run `git add` + `git commit` after completed work or when the user asks.

**Important:** If the UI or code changes again without the user sending a follow-up message, that change is **not** auto-saved. Only agent work that completes after a user prompt gets a checkpoint. Silent cache, restore, or revert = not recorded unless the user reports it and the agent saves/commits.

After editing source files, end replies with a one-line footer: `Git: \`<hash>\` — \`<subject>\` (\`uncommitted\` if not committed yet). User copies this back if UI drifts.

Each `git commit` auto-updates `CURRENT_GIT_COMMIT.txt` (post-commit hook). Run `npm run git:hooks` once per clone to install hooks.
<!-- END:auto-checkpoint -->
