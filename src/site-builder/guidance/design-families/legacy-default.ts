import type { GeneratedSiteBlueprint } from "../../types.js";
import { blueprintSchema } from "../../types.js";
import { designSpecificationSchema } from "../../contracts/index.js";
import { foregroundFor } from "../../renderer/baseStyles.js";

export const legacyDefaultFamily = { id: "legacy-default", version: 1 } as const;

// Non-mutating adaptation: persisted v1/v2 remain unchanged, no new schema version.
export function legacyDesignSpecification(input: unknown) {
  const blueprint = blueprintSchema.parse(input);
  const presentation = resolvePresentation(blueprint);
  const palette = surfacePalettes[presentation.theme];
  return designSpecificationSchema.parse({
    version: 1, family: legacyDefaultFamily,
    templateId: blueprint.templateId, visual: blueprint.visual, presentation,
    tokens: {
      color: {
        background: palette.background, surface: palette.surface, surfaceElevated: palette.raised,
        text: palette.text, textMuted: palette.muted, border: palette.border,
        primary: blueprint.brand.primaryColor, accent: blueprint.brand.accentColor,
        primaryForeground: foregroundFor(blueprint.brand.primaryColor),
        accentForeground: foregroundFor(blueprint.brand.accentColor),
      },
      typography: presentation.typography,
      spacing: { section: 80, sectionCompact: 56 }, radius: { card: 16, cta: 12 },
      motion: presentation.motion,
    },
  });
}

export function resolvePresentation(blueprint: GeneratedSiteBlueprint) {
  return (
    blueprint.presentation ?? {
      theme:
        blueprint.templateId === "premium-service" ||
        blueprint.templateId === "modern-local-business"
          ? ("dark" as const)
          : ("light" as const),
      typography: "modern" as const,
      motion: "subtle" as const,
    }
  );
}

export const surfacePalettes = {
  dark: {
    background: "#090f1e",
    surface: "#111c30",
    raised: "#1b2940",
    text: "#f4f7fc",
    muted: "#b9c6da",
    border: "#44536b",
  },
  light: {
    background: "#f1f5f9",
    surface: "#ffffff",
    raised: "#e5edf5",
    text: "#142236",
    muted: "#43536b",
    border: "#8a9bb0",
  },
} as const;

// Shared finishing rules preserve each variant's DOM while aligning type and rhythm.
export const presentationStyles = `
.site-root{background:var(--background);color:var(--text);font-family:var(--font-body);--font-body:'Segoe UI',system-ui,-apple-system,Arial,sans-serif;--font-display:var(--font-body);--radius:16px;--space-section:80px;--ease:cubic-bezier(.22,1,.36,1)}
.site-root[data-typography=editorial]{--font-display:Georgia,'Times New Roman',serif}
.site-root h1,.site-root h2,.site-root h3,.site-root .footer-wordmark{font-family:var(--font-display);font-weight:700;letter-spacing:-.035em;text-wrap:balance}
.site-root h1{line-height:1.1}.site-root h2{line-height:1.2}.site-root p{line-height:1.7}.site-root .eyebrow{font-size:12px;letter-spacing:.12em}
.site-root .section-inner{padding-top:var(--space-section);padding-bottom:var(--space-section)}
.site-navigation{background:var(--background);border-color:var(--border)}.site-navigation nav a{color:var(--muted);padding:4px 8px;border-radius:8px}.site-navigation .brand-name{font-weight:750;letter-spacing:-.03em}
.site-root .hero-full-bleed{min-height:580px;padding-top:80px;padding-bottom:80px;gap:40px}.site-root .hero-full-bleed h1{font-size:clamp(42px,6vw,88px);max-width:1000px}
.site-root .hero-full-bleed-bottom{align-items:center}.site-root .hero-full-bleed-bottom p{font-size:18px;max-width:620px}
.site-root .hero-split{min-height:560px}.site-root .hero-split-title{padding:64px max(32px,6vw);justify-content:center;gap:32px}
.site-root .hero-split h1{font-size:clamp(40px,5vw,72px);text-transform:none;letter-spacing:-.04em}
.site-root .hero-split-detail{background:var(--surface);color:var(--text);border-left:1px solid var(--border);padding:48px max(32px,5vw)}
.site-root .hero-monogram{font-family:var(--font-display);font-weight:650;font-size:clamp(88px,10vw,144px);text-align:left;border-color:var(--border);padding-bottom:24px;color:var(--text)}
.site-root .hero-minimal{background:var(--surface);padding-top:72px;padding-bottom:80px;gap:40px}.site-root .hero-minimal h1{font-size:clamp(38px,4.5vw,64px);font-weight:700}.hero-minimal-story>p{color:var(--muted)}
.site-root .about{background:var(--background)}.site-root .about-heading h2{font-size:clamp(30px,3.5vw,44px)}.site-root .about-prose{font-size:18px;color:var(--muted)}.site-root .about-centered>p{color:var(--muted)}
.site-root .story-rule{background:var(--muted);border-radius:4px}
.site-root .services{background:var(--surface);border-block:1px solid var(--border)}.site-root .services-editorial h3{font-size:24px;font-weight:650}.site-root .services article>p:not(.suggestion){color:var(--muted)}
.site-root .service-columns{gap:24px}.site-root .service-columns article{background:var(--raised);padding:28px;border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 24px #00000008}.site-root .service-columns h3{font-size:23px}
.site-root .contact{background:var(--background)}.site-root .contact-split{border:0}.site-root .contact-split h2{font-size:clamp(30px,3.5vw,44px)}.site-root .contact-links{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px}.site-root .contact-minimal .contact-links{max-width:640px}
.site-root .location-editorial{background:var(--raised);color:var(--text)}
.site-root .footer-minimal{background:var(--surface);color:var(--muted)}.site-root .footer-editorial{background:var(--surface);color:var(--text);border-top:1px solid var(--border)}.site-root .footer-wordmark{font-size:clamp(36px,5vw,64px)}.site-root .footer-editorial>div{border-color:var(--border);color:var(--muted)}
.site-root .cta{background:var(--accent);color:var(--on-accent);border:2px solid currentColor;border-radius:12px;padding:14px 24px;box-shadow:0 8px 24px #00000012;line-height:1.5;font-weight:700}
.site-root a:focus-visible{outline:3px solid currentColor;outline-offset:5px}.site-root .skip-link:focus{z-index:20}
@media(hover:hover){.site-root .cta:hover{box-shadow:0 12px 28px #00000026}.site-navigation nav a:hover{background:var(--raised);color:var(--text)}.site-root .contact-links a:hover{text-decoration-thickness:2px}}
@keyframes site-enter{from{opacity:.35;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@media(prefers-reduced-motion:no-preference){
  .site-root[data-motion=subtle] .hero h1{animation:site-enter 560ms var(--ease) both}
  .site-root[data-motion=subtle] .hero-full-bleed-bottom,.site-root[data-motion=subtle] .hero-split-detail,.site-root[data-motion=subtle] .hero-minimal-story>.cta{animation:site-enter 640ms var(--ease) 80ms both}
  .site-root[data-motion=subtle] .cta{transition:transform 180ms var(--ease),box-shadow 180ms ease}
}
@media(hover:hover) and (prefers-reduced-motion:no-preference){.site-root[data-motion=subtle] .cta:hover{transform:translateY(-2px)}.site-root[data-motion=subtle] .cta:active{transform:translateY(0)}}
html:has(.site-root[data-motion=none]){scroll-behavior:auto}
@media(max-width:800px){.site-root{--space-section:56px}.site-root .hero-split-title{padding:48px 6%}.site-root .hero-split-detail{padding:32px 6%;border-left:0;border-top:1px solid var(--border)}.site-root .hero-monogram{font-size:88px}.site-root .hero-minimal{padding:48px 6%;gap:24px}.site-root .hero-full-bleed{min-height:480px;padding:48px 6%}.site-root .hero-full-bleed-bottom{align-items:flex-start}.site-root .service-columns{gap:16px}}
@media(max-width:480px){.site-root .hero-full-bleed h1{font-size:clamp(36px,10vw,46px)}.site-root .hero-split h1{font-size:40px}.site-root .service-columns article{padding:24px}.site-root .contact-links{padding:20px}.site-root .cta{font-size:16px;max-width:100%;flex-shrink:1}.site-root .hero-full-bleed-bottom p{font-size:17px}}
@media(prefers-reduced-motion:reduce){.site-root *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
`;
