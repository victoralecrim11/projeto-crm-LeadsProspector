# Stitch visual fidelity — investigation and partial correction

Project: 6210769524554228286. Production: fa56df3c-f3e6-4d10-876d-591e8c773544.

## Verified failure
The persisted candidates used generated-0/1/2 rather than provider screen IDs, omitted screenshots and all color/typography/spacing signals, and used generic split/standard/grid patterns. The SDK response contains outputComponents[].design.screens[]; the real client incorrectly projected the parent design object. Three actual MOBILE screens were retrieved read-only from the project; the inspected response did not contain a desktop screen. This is not evidence of a valid desktop companion.

The supported renderer is a blueprint component renderer, not a Stitch HTML renderer. Its responsive selection previously applied section order and provenance only. Correct artifact identity and PAIRED therefore do not establish visual fidelity.

## Changes
- Project exact screen identity and screenshot/download metadata from the SDK response; reject wrong project/device or absent screen instead of inventing an ID.
- Download provider HTML only from the observed exact HTTPS host, with redirects disabled, a timeout and a 2MB cap. Do not evaluate scripts or pass HTML/copy to the CRM.
- Extract literal hex color roles from the observed Tailwind colors object and preserve them through existing candidate colorSignals.
- Apply explicit color roles to responsive design tokens and presentation theme.

## Validation
Three new regression tests passed. Full suite: 300 tests, 19 suites, 300 pass, zero fail/cancelled/skipped. TypeScript/lint including producer: passed. Read-only replay against all three downloaded real screens recovered exact IDs, screenshots and 47 color roles per screen.

## Remaining work / status
PARTIAL. This does not reproduce typography, imagery, custom section composition or exact spacing. No visual similarity PASS is claimed. Existing immutable artifacts and the existing generated site were not rewritten. The original selected screen cannot be reconstructed from generated-0 without additional evidence. The user was asked to identify the intended screen for recovery without generating another Stitch project. No additional Stitch generation calls were made. No commit/freeze/homologation.

## Follow-up: confirmed reference project
Re-read list_screens on 2026-09-22 for the user-supplied project. Confirmed these references without making generation calls:
- Atelier da Navalha - Mobile: 77174b2e55c7481b9eb7f4c8b1aa6ce7.
- Navalha & Brasa - Barbearia Editorial: 29101805c2ce4b1f8fbd1ae235a28d94.
- Cortês Barbearia - Variante 3 (Editorial): 021b0bb1b1094e91b07447a75fbd8f17.
All are MOBILE. Use all three as evidence references; their list order does not establish the lost original winner.
Downloaded screenshots read-only for inspection. Confirmed dark editorial direction in the Atelier reference, unlike the user's blue/white generic result.
Opened localhost:3000/redesenhar with the automated browser: CRM loaded, but this browser profile has no saved leads or projects. Therefore this is not a live comparison of the user's saved Barbearia do Zequinha site. RedesenhoView and VisualEditorView both pass project.siteDesign to the shared renderer, so changing only either screen's UI would not address the conversion loss.

## Exported project reproduction (2026-09-22)
User supplied proj-775b74f7-1f0c-4303-a906-371b0b8b030e. Its production is 8dca3732-d4f9-4010-b0f2-f75d48681207, not the original fa56df3c production. Reloaded it through real shared consumer preparation and constructed a test-browser copy from the persisted design plus supplied project identity/fallback metadata. This is a reconstructed reproduction, not an exact byte-for-byte import of the pasted JSON (which contains Markdown escapes).

Confirmed selected generated-1, primary #153a50, light surfaces. The production artifacts reference remote Stitch project 15542973177563075092, whereas the user comparison link is 6210769524554228286. Do not conflate those projects or infer a lost screen ID from candidate index.

The saved standard-ai request siteai_87b239df-edaf-416d-bc6c-67e2d68336a7 was provider-http-503 fallback. Backend logs additionally show 429/503 attempts. Provider connection test success is not successful site generation.

Fixed misleading completion feedback and added a persistent fallback notice to both RedesenhoView and VisualEditorView. Verified the reconstructed project loads in the test editor; its iframe still uses #153a50, as expected for unchanged historical data. No original user browser data or artifacts modified. No new Stitch calls.

Validation: 302 tests passed, 0 failed/skipped; lint/TypeScript passed. Visual fidelity remains pending, as does real LLM homologation.

## Cross-project editor state bug — fixed
User screenshot showed Júlia Cabeleireira navigation with Barbearia do Zequinha hero/copy. Reproduced before the fix by switching between two separate test projects without a page reload. useEditorHistory and useMediaManager initialized their state on mount only, while VisualEditorView reused the component for another project. Context changed but draft/history/manifest remained from the old project; saving could persist the wrong draft.

VisualEditorView now resolves the active project and mounts a ProjectEditor keyed by project ID. All document/history/media/transient state is scoped to that project. Same-project updates do not remount. Existing unsaved-change confirmation is preserved.

Browser regression: tests/browser/editorProjectIsolation.playwright.js (run separately through Playwright browser_run_code with filename). Uses an isolated context, two explicit fixtures, an edit in A, confirmed discard, A-to-B and B-to-A switches, saving B, checking original A, manifest ownership, undo reset and reload. All checks PASS. Before-fix reproduction showed salon navigation plus barbershop hero; after fix each displays its own content.

This prevents new cross-project contamination; it does not reconstruct content already saved incorrectly. Stitch visual fidelity and real-provider homologation remain independent pending work.

## New production still used stale server code
Production e06f8a73-c818-4237-8056-9f6a98f21a7d again persisted generated-0/1/2 with no color signals. Running backend child PID 83628 started at 15:04, before the real client edit at 15:24. The frontend had hot-reloaded but the backend had not. This explains why the adapter fix was absent from this new production; no provider regeneration was performed during diagnosis.

Stopped the identified old repo server and launched tsx watch server.ts. Updated npm run dev to use watch so subsequent backend edits reload. Latest standard-ai request siteai_bb63acfd-37b9-4528-abe0-2c1274f93c34 still recorded provider-http-503; provider availability is a separate unresolved gate. Historical artifacts remain unchanged.

## Numeric Stitch screen ID adapter correction
Production 0e263b31-19a0-4841-b0b5-d853c349478e had valid mobile candidate 822880ec8533493fbe40635049a55964. Snapshot conversion put this numeric-leading ID into a local family slug requiring an initial letter; Zod rejection was classified as ARTIFACT_INVALID. Fixed only the derived snapshot family ID with a stitch- prefix. Canonical candidate/screen/strategy IDs and artifacts remain unchanged.

Added a real shared-consumer regression using numeric screen IDs. 303 tests passed; lint (main, React plugin and producer TS) passed. Replayed the actual production read-only: PARTIAL, three alternatives, original strategy. Backed up its failed job in scratch and recovered it through canonical repository transition after real consumer parity PASS. Normal preparation then passed without allowPreTerminal. No extra Stitch calls. Desktop generation separately returned STITCH_SCREEN_IDENTITY_INVALID, so no PAIRED or fidelity claim is made. Provider LLM success remains unvalidated.
