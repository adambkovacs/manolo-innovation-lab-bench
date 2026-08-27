# Publish: pushed to github.com/adambkovacs/manolo-innovation-lab-bench

The repository lives at
https://github.com/adambkovacs/manolo-innovation-lab-bench, branch main. The
history is the original build commit plus small follow-up commits: link
repoints after the repo was named and renamed, and a Pages deploy
workflow. CLAUDE.md at the root auto-loads project context for any future
Claude Code session (competition facts, decision log, gotchas, task
tracker), so a fresh session opening this repo has what the build
session had. 55 tracked files, node_modules and the private signing key
excluded by .gitignore. The private key stays on your machine for live
signing during the demo; every receipt embeds its public key, so anyone
who clones can verify the whole chain without it.

The project name inside the code stays manolo-bench (package.json,
prose, deck). Only the GitHub repo is named manolo-innovation-lab-bench.

## Settings done by hand, 27 Aug 2026

The session that pushed this had no permission to call the GitHub
settings APIs, so Adam clicked these in repo Settings: repo made
public, Pages source set to GitHub Actions. The workflow at
.github/workflows/pages.yml now publishes docs/ on every push to main.

Still open: repo About, add topics trustworthy-ai, benchmarking,
ed25519, horizon-europe. With the gh CLI instead:

```
gh repo edit adambkovacs/manolo-innovation-lab-bench --add-topic trustworthy-ai \
  --add-topic benchmarking --add-topic ed25519 --add-topic horizon-europe
```

## If you want your real email on the commits

The commits carry Adam Kovacs with the GitHub noreply email. To swap in
another identity you would have to rewrite pushed history, so leave it
unless the submission needs a different address.

## Verify after Pages is on, two minutes

- https://adambkovacs.github.io/manolo-innovation-lab-bench/ loads the
  explainer and the Live demo link opens the dashboard in sample mode.
- `git ls-files | grep -c node_modules` returns 0, and
  `git ls-files results/keys/` shows the public key only.
- On any other machine: `git clone`, then `node --test` (5 pass), then
  `node src/claims.js verify` (11 receipts, all valid). No install step.

Then put the Pages link in the submission email next to the repo link.
