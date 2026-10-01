# Node 22 compatibility validation — 2026-09-30

## Goal and tested source
Close the Node 22 validation gap after the dependency hardening PR #2 was merged.
Tested source: `a7462c7d8673ea222b797e86c581bc0c5632424f` (merge of PR #2).
No application code or dependency declarations changed in this increment.

## Isolated execution
Device: SA5S306624. Worktree branch: `automation/node22-validation`.
Portable Node 22.23.3 was installed under the ignored worktree directory `node_modules/.prospector-node22`, using `node-win-x64@22.23.3` with install scripts disabled. Only the validation process PATH was prefixed with its `bin` directory; the global Node installation/configuration was not changed.
The global npm.cmd launcher remains npm 11.16.0; CLI lifecycle tools resolve the portable Node through PATH. This is local compatibility evidence, not a globally switched toolchain or CI evidence.

## Actual results
- `node --version`: v22.23.3.
- `npm.cmd test`: exit 0; 349 tests, 19 suites, 349 PASS, 0 failures/skips/cancellations/todo; 16.11 seconds.
- `npm.cmd run lint`: exit 0; main, React plugin and producer TypeScript checks.
- `npm.cmd run build`: exit 0; Vite client 18.54 seconds, esbuild server 23 milliseconds.
- `npm.cmd audit --json`: exit 0; zero findings in all severities, dependency metadata total 621.
- `git diff --check`: exit 0.
- Working tree remained clean after execution, including the untracked portable runtime being ignored.

## Scope and remaining gates
This closes the previously reported Node 22 runtime test/build gap for the tested source and installed lockfile dependency tree. A clean dependency reinstall under Node 22 and future versions are not covered.
Warnings about large build chunks remain. Zero audit findings is not a guarantee against all vulnerabilities.
The latest visual report still requires the exact Stitch screen HTML or a useful full-resolution reference. The live report records PARTIAL/COHERENCE_FAILED despite successful Groq replay; it does not prove production PAIRED with a real LLM. These gates remain pending, without new external generation, billing, merge or production deploy.
The user's local main remains clean at `5020388be5746a91c75ffa520b7d0cab49fea06c`, ahead 1/behind 4 of origin/main; its mobile-navigation commit was preserved and not included in this branch.
