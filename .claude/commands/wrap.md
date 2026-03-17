End-of-session wrap-up. Do all of the following in order:

**1. Update docs/state.md**
- Read the current docs/state.md
- Mark any newly completed routes as ✅
- Update DB table if schema changed
- Remove resolved known issues, add new ones
- Prepend a new row to Recent Changes with today's date and a one-line summary

**2. Update docs/decisions.md**
- Read the current docs/decisions.md
- Add any product questions that came up this session under "❓ Needs Your Answer" with context and what's blocked
- Move any questions that got answered to "✅ Decided" with a one-line summary of the decision

**3. Commit all changes**
- Run: git status
- Stage all modified and new files (exclude .env.local and node_modules)
- Write a commit message that summarizes what was built or changed this session — be specific, not generic
- Commit

**4. Push to GitHub**
- Run: git push origin main
- If it fails due to auth, report the error and stop — do not retry or force push
