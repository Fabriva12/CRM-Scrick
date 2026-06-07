# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | `~/.claude/skills/branch-pr/SKILL.md` |
| When writing Go tests, using teatest, or adding test coverage | go-testing | `~/.claude/skills/go-testing/SKILL.md` |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | `~/.claude/skills/issue-creation/SKILL.md` |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | judgment-day | `~/.claude/skills/judgment-day/SKILL.md` |
| When user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | `~/.claude/skills/skill-creator/SKILL.md` |
| When user asks to build web components, pages, artifacts, posters, or applications; styling/beautifying any web UI | frontend-design | `~/.cursor/skills/frontend-design/SKILL.md` |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue — no exceptions. Verify issue has `status:approved` label.
- Every PR MUST have exactly one `type:*` label.
- Branch names MUST match: `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`
- PR body MUST include: Closes/Fixes/Resolves #N, PR type checkbox, summary (1-3 bullets), changes table, test plan, contributor checklist.
- Commit messages MUST follow conventional commits: `type(scope): description`.
- Run shellcheck on modified scripts before pushing.
- Use `gh pr create` for PR creation, `gh pr edit` for labels.

### go-testing
- Pure functions → table-driven tests. Each test case: `name`, input, expected, `wantErr`.
- Bubbletea TUI: test `Model.Update()` directly by sending `tea.KeyMsg` and asserting state transitions.
- Full TUI flows: use `teatest.NewTestModel(t, m)` with `tm.Send()` and `tm.WaitFinished()`.
- Visual output: use golden file testing with `testdata/` directory and `-update` flag.
- Side effects: mock dependencies with interfaces. System info: inject `SystemInfo` struct.
- File operations: use `t.TempDir()` for temp directories.
- Go test commands: `go test ./...`, `go test -v`, `go test -cover`, `go test -short`, `go test -update`.
- Test files go next to source: `model.go` → `model_test.go`, in `testdata/` for golden files.

### issue-creation
- MUST use template — blank issues are disabled. Two templates: Bug Report (`bug_report.yml`) and Feature Request (`feature_request.yml`).
- Issues get `status:needs-review` automatically. A maintainer MUST add `status:approved` before any PR.
- Search for duplicates first: `gh issue list --search "keyword"`.
- Bug reports need: pre-flight checks, description, steps to reproduce, expected/actual behavior, OS, agent/client, shell.
- Feature requests need: pre-flight checks, problem description, proposed solution, affected area.
- Questions go to Discussions, NOT issues.
- Auto-labels: Bug → `bug`, `status:needs-review`. Feature → `enhancement`, `status:needs-review`.

### judgment-day
- Launch TWO blind judge sub-agents in PARALLEL via `delegate` — NEVER sequential, NEVER review yourself.
- Resolve skills first: search engram for skill-registry → fallback to `.atl/skill-registry.md` → inject compact rules into judge AND fix agent prompts.
- Judges classify warnings: `WARNING (real)` = triggers in normal usage (FIX), `WARNING (theoretical)` = needs contrived scenario (REPORT as INFO, do NOT fix).
- Verdict synthesis: Confirmed (both judges) → fix immediately. Suspect (one judge) → report but do NOT auto-fix.
- Fix via separate Fix Agent delegation. Re-judge after fix. After 2 iterations → ask user before continuing.
- Convergence: 0 confirmed CRITICALs + 0 confirmed real WARNINGs = APPROVED. Theoretical warnings and suggestions may remain.
- NEVER push/commit before re-judgment completes. NEVER skip Round 2 if fixes were applied.

### skill-creator
- Skill structure: `skills/{name}/SKILL.md` (required) + optional `assets/` (templates/schemas) and `references/` (local docs).
- SKILL.md frontmatter MUST include: `name`, `description` (with Trigger: line), `license` (Apache-2.0), `metadata.author` (gentleman-programming), `metadata.version`.
- Naming: generic = `{technology}`, project-specific = `{project}-{component}`, testing = `{project}-test-{component}`, workflow = `{action}-{target}`.
- Content: start with critical patterns, use tables for decisions, keep code examples minimal, include a Commands section with copy-paste commands.
- DO NOT add Keywords section, duplicate existing docs, include lengthy explanations, add troubleshooting, or use web URLs in references.
- Register new skills in AGENTS.md after creation.

### frontend-design
- Commit to a BOLD aesthetic direction: purpose, tone (extreme choice), constraints, differentiation (what makes it unforgettable).
- Typography: avoid generic fonts (Arial, Inter, Roboto, system). Use distinctive display + refined body pairings.
- Color: cohesive theme with CSS variables. Dominant colors + sharp accents over timid palettes.
- Motion: CSS-only preferred for HTML. Use Motion library for React. Staggered reveals > scattered micro-interactions.
- Spatial composition: asymmetry, overlap, grid-breaking, generous negative space or controlled density.
- NEVER use: Inter/Roboto/Arial/system fonts, purple+white gradients, predictable layouts, generic AI aesthetics.
- Match implementation complexity to vision — maximalist = elaborate code, minimalist = precision in spacing/details.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | `C:\Users\Usuario\.config\opencode\AGENTS.md` | Main agent instructions file |

Read the convention files listed above for project-specific patterns and rules.
