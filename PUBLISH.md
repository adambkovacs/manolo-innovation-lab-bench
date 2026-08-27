# Publish: the repository already exists, push is one command

The zip contains a fully initialized git repository: CLAUDE.md at the root auto-loads project context for any future Claude Code session (competition facts, decision log, gotchas, task tracker), so a fresh session opening this repo has what this one had. One clean commit
(author Adam Kovacs, GitHub noreply email), 54 tracked files,
node_modules and the private signing key excluded by .gitignore. The
private key stays on your machine for live signing during the demo;
every receipt embeds its public key, so anyone who clones can verify
the whole chain without it.

Assumed repo name: manolo-bench under github.com/adambkovacs. If you
pick another name, adjust the two links in docs/index.html (hero button
and footer) in one commit.

## Push with the gh CLI

```
cd manolo-bench
gh repo create manolo-bench --public --source=. --push \
  --description "Signed claim receipts for the MANOLO assessment loop: measured evidence, declared origins, replayable verdicts. Apache-2.0."
gh repo edit adambkovacs/manolo-bench --add-topic trustworthy-ai \
  --add-topic benchmarking --add-topic ed25519 --add-topic horizon-europe
gh api repos/adambkovacs/manolo-bench/pages -X POST \
  -f "source[branch]=main" -f "source[path]=/docs"
```

## Without gh

1. Create an empty public repo named manolo-bench on github.com.
2. `git remote add origin git@github.com:adambkovacs/manolo-bench.git`
3. `git push -u origin main`
4. Repo Settings, Pages, Deploy from a branch, main, /docs, Save.

## If you want your real email on the commit

Before pushing, with your own git identity configured:
`git commit --amend --reset-author`

## Verify after the push, two minutes

- https://adambkovacs.github.io/manolo-bench/ loads the explainer and
  the Live demo link opens the dashboard in sample mode.
- `git ls-files | grep -c node_modules` returns 0, and
  `git ls-files results/keys/` shows the public key only.
- On any other machine: `git clone`, then `node --test` (5 pass), then
  `node src/claims.js verify` (11 receipts, all valid). No install step.

Then put the Pages link in the submission email next to the repo link.
