/**
 * Editor-specific types for E.2 Advanced Visual Editor UX.
 * These are transient UI types — never persisted to SiteUserOverrides or history.
 */

export type PreviewViewport = "Mobile" | "Tablet" | "Desktop";

/**
 * The editor selection target.
 * { scope: 'site' }  → global Design do Site / Identidade Visual
 * { scope: 'section', sectionId }  → a specific blueprint section
 *
 * Using an explicit discriminated union ensures that section-specific
 * logic (reorder, visibility, variant, content) can NEVER accidentally
 * receive the site-scope target as a fake sectionId string.
 */
export type EditorTarget =
  | { scope: "site" }
  | { scope: "section"; sectionId: string };
