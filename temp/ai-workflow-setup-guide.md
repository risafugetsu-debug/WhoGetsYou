# AI Workflow Setup Guide for Existing Codebases

> Turn your existing project into an AI-optimized workspace using Claude Code.
> Time: ~15 minutes across 3 phases.

## Who This Is For

You have a deployed, working codebase and you want to supercharge your productivity with AI. You're not starting from scratch — you're upgrading your workflow.

This guide uses **Claude Code** (Anthropic's CLI tool). Each phase is a prompt you paste directly into Claude Code and let it run.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and working
- An existing code repository (local, with git initialized)
- Terminal open in your project's root directory

## What You're Setting Up

| Phase | What | Why | Time |
|-------|------|-----|------|
| 1 | **CLAUDE.md** | Gives Claude persistent context about your project — no more re-explaining every session | ~5 min |
| 2 | **Custom Slash Commands** | Repeatable workflows you trigger with `/command` — test, deploy, review, etc. | ~5 min |
| 3 | **Permission Tuning** | Stop hitting "approve" on every safe command — let read-only operations run automatically | ~5 min |

---

## Phase 1: CLAUDE.md — Project Context

This is the single highest-leverage thing you can do. A `CLAUDE.md` file in your project root tells Claude about your codebase, conventions, and preferences. It's loaded automatically every session.

### What to do

Open Claude Code in your project root and paste this prompt:

```
I need you to create a CLAUDE.md file for this existing project. Explore the codebase first — read the package.json, look at the directory structure, check the README if one exists, and skim a few key files to understand the architecture.

Then create a CLAUDE.md in the project root that includes:

1. **Project overview** — what this app does, in one paragraph
2. **Tech stack** — frameworks, languages, versions (read from package.json / config files, don't guess)
3. **Project structure** — key directories and what lives in each
4. **Development commands** — how to install, run dev, build, test, lint (read from package.json scripts)
5. **Code conventions** — patterns you observe in the existing code (naming, file organization, component patterns, state management approach)
6. **Environment variables** — list the env vars the project uses (check .env.example, .env.local.example, or references in code — do NOT include actual values or secrets)
7. **Database** — if applicable, note the ORM/client, where schema lives, how migrations work
8. **Deployment** — where it's deployed and any deployment-specific notes you can infer

Rules:
- Only document what you can verify from the code. Don't make assumptions.
- Keep it concise — this will be read by AI on every session, so token efficiency matters.
- Use markdown headers and bullet points, not prose paragraphs.
- If you're unsure about something, add a `<!-- TODO: verify -->` comment so I can fill it in.
```

### After it runs

Review the generated `CLAUDE.md` and:
- Fill in any `<!-- TODO: verify -->` sections
- Add any context Claude couldn't infer (deployment URLs, team conventions, known gotchas)
- Commit it to your repo — it's meant to be version controlled

---

## Phase 2: Custom Slash Commands

Slash commands are reusable prompts you trigger with `/command-name`. They live in `.claude/commands/` as markdown files. Great for workflows you repeat often.

### What to do

Paste this prompt into Claude Code:

```
I want to set up custom slash commands for my project. Create the directory .claude/commands/ and add the following commands as markdown files:

1. **dev.md** — Start the development environment
   - Run the dev server
   - If there are other services that need to run (database, etc.), mention them
   - Read my package.json to get the right commands

2. **check.md** — Pre-commit quality check
   - Run the TypeScript compiler (type checking only, no emit)
   - Run the linter
   - Run the formatter check (not fix)
   - Run tests if a test script exists
   - Summarize: all passed, or list what failed
   - Read my package.json to see which of these tools are actually configured — only include the ones that exist

3. **review.md** — Code review on current changes
   - Look at the current git diff (staged + unstaged)
   - Review for: bugs, security issues, performance problems, and deviations from the patterns in CLAUDE.md
   - Be specific — reference file names and line numbers
   - Keep it concise — only flag things worth fixing

4. **commit.md** — Smart commit
   - Look at staged changes (or all changes if nothing is staged)
   - Write a clear, conventional commit message based on the actual diff
   - Ask me to confirm before committing

Rules for all commands:
- Each command is a separate .md file in .claude/commands/
- The file contents are the prompt that runs when I type the slash command
- Keep prompts clear and specific
- Only reference tools and scripts that actually exist in this project
- Read my package.json and project config before writing these — don't assume what tools I have
```

### After it runs

- Test each command: type `/dev`, `/check`, `/review`, `/commit` in Claude Code
- Tweak the prompts in `.claude/commands/` if the behavior isn't quite right — they're just markdown files
- Add more commands for workflows specific to your project (e.g., `/deploy`, `/db-migrate`, `/new-component`)
- Commit the `.claude/` directory to your repo

---

## Phase 3: Permission Tuning

By default, Claude Code asks for approval on every command it runs. This is safe but slow. You can auto-approve commands that are read-only and harmless.

### What to do

Paste this prompt into Claude Code:

```
I want to reduce approval fatigue by auto-approving safe, read-only commands. Update my project's .claude/settings.json to allow the following without asking:

Bash commands (read-only only):
- ls, find, cat, head, tail, wc — file inspection
- node, npx, tsx — running scripts (needed for dev/build/test)
- npm run, npm test, npm run build, npm run lint — project scripts
- git status, git log, git diff, git branch — git inspection
- echo, date, pwd — basic shell

Rules:
- Do NOT auto-approve anything that modifies files (mv, cp, rm, mkdir)
- Do NOT auto-approve git commands that change state (git push, git commit, git checkout)
- Do NOT auto-approve anything with sudo
- Do NOT auto-approve network commands (curl, wget, ssh)
- Only add to .claude/settings.json (project-level), not global settings
- Show me what you're adding before you save the file
```

### After it runs

- Claude Code should now run read-only commands without prompting you
- If you find yourself approving the same safe command repeatedly, add it to `.claude/settings.json`
- If a command gets auto-approved that you'd rather review, remove it from the settings

---

## What's Next

Once you're comfortable with these basics, consider:

- **Hooks** — Auto-run linting after Claude edits a file, or enforce formatting on save. Configured in `.claude/settings.json` under `hooks`.
- **MCP Servers** — Connect Claude to external tools (GitHub issues, databases, Slack). Useful when you want Claude to interact with services directly.
- **Memory files** — For long-running projects, maintain context across sessions with persistent notes Claude reads at startup.

These are more advanced and benefit from experience with the basics first.

---

## Tips

- **CLAUDE.md is a living document.** Update it as your project evolves. If Claude keeps getting something wrong, add a note about it.
- **Slash commands are just prompts.** Edit them anytime — no special syntax, just markdown instructions.
- **Start conservative on permissions.** It's easy to add more auto-approvals later. Harder to undo damage from an over-permissive setup.
- **Claude reads your codebase.** You don't need to explain your entire project in the prompt — point Claude at the code and let it figure things out.
