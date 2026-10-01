# Dependency hardening — 2026-09-30

## Scope and acceptance criteria
The initial project audit reported 5 moderate and 1 high vulnerability. This focused change updates Express to 4.22.3 and ExcelJS to 4.4.0, regenerates the lockfile, and pins patched transitive dependencies without running automatic `npm audit fix`.

Overrides: qs 6.16.0, uuid 11.1.1, brace-expansion 1.1.21 for consumers requesting ^1.1.7, and brace-expansion 2.1.7 for consumers requesting ^2.0.1. Keeping brace-expansion's major versions avoids forcing the v1 API into a v2 consumer. The live audit reports vulnerabilities in v2 below 2.1.7, so 2.0.3 is insufficient.

The new XLSX compatibility test writes and reloads a workbook and verifies the business name and numeric score. It checks the ExcelJS/UUID upgrade through actual serialization, without external services or real customer data.

## Validation on SA5S306624
Base commit: `0aac09e27327a0857e97f7ac513537745575f01d`.
Branch: `automation/dependency-audit-hardening`.
Final validation after the scoped override adjustment:
- `npm.cmd install --package-lock-only --ignore-scripts`: exit 0.
- `npm.cmd ci --ignore-scripts`: exit 0; 509 packages installed.
- `npm.cmd audit --json`: exit 0, zero vulnerabilities in all severities; dependency metadata total 621.
- `npm.cmd test`: exit 0, 349/349 tests, 19 suites, zero failures/skips/cancellations, 16.03 seconds.
- `npm.cmd run lint`: exit 0, including main, React plugin, and producer TypeScript checks.
- `npm.cmd run build`: exit 0, client Vite 31.80 seconds and server esbuild completed.
- `git diff --check`: exit 0.

## Limits
Execution used Node v24.18.0 / npm 11.16.0; package engines requests Node 22.x, which is not validated by this run. Deprecated transitive packages and the build chunk-size warning remain. An audit with zero findings does not prove absence of all vulnerabilities.
This increment is independent of the pending Stitch visual fidelity and real PAIRED/consumer gates. No external generation, production deployment, automatic merge, secret copying, or changes to the user's main checkout were performed.
