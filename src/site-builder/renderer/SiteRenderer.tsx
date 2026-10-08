import { stitchAppearanceSchema, type StitchAppearance } from '../contracts/stitchAppearance';
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { GeneratedSiteBlueprint, LeadSiteContext } from "../types";
import { constrainBlueprint } from "../context";
import { normalizeForRender, resolveSection, variantStyles } from "../sections/registry";
import { baseStyles, foregroundFor } from "./baseStyles";
import { presentationStyles, resolvePresentation, surfacePalettes } from "./presentation";
import { resolvedDesignSchema, type ResolvedDesign } from '../contracts/research';
import { mediaManifestSchema, type MediaManifest } from '../contracts/media';
import { StitchServices, stitchServicesStyles } from '../sections/services/StitchServices';

export const mediaStyles = `
.hero-full-bleed.has-media{position:relative;overflow:hidden}
.hero-bg-media{position:absolute;inset:0;z-index:0;opacity:.22;pointer-events:none}
.hero-bg-media img{width:100%;height:100%;object-fit:cover}
.hero-full-bleed>:not(.hero-bg-media){position:relative;z-index:1}
.hero-split-media{width:100%;max-height:280px;overflow:hidden;border-radius:var(--radius,8px)}
.hero-split-media img{width:100%;height:100%;max-height:280px;object-fit:cover;border-radius:inherit}
.hero-minimal-media{width:100%;max-height:360px;overflow:hidden;border-radius:var(--radius,8px);margin-bottom:16px}
.hero-minimal-media img{width:100%;height:100%;max-height:360px;object-fit:cover;border-radius:inherit}
.about-media img{width:100%;border-radius:var(--radius,8px);object-fit:cover;max-height:320px}
`;

const stitchResponsiveCss = `
.stitch-desktop-layout{display:none}
@media(min-width:801px){.stitch-mobile-layout{display:none}.stitch-desktop-layout{display:block}}
`;
const stitchFinishStyles = `
.site-root[data-family] .site-navigation{padding-block:16px;border-bottom:2px solid var(--border)}
.site-root[data-family] .site-navigation .brand-name{font-family:var(--font-display);font-weight:800;letter-spacing:-.04em}
.site-root[data-family] .hero h1{max-width:11ch;text-wrap:balance}
.site-root[data-family] .hero-split-detail:has(.hero-split-media){position:relative;isolation:isolate;min-height:560px;color:#fff;background:var(--primary);overflow:hidden}
.site-root[data-family] .hero-split-detail:has(.hero-split-media)::after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,transparent 25%,#000b 100%)}
.site-root[data-family] .hero-split-detail:has(.hero-split-media) .hero-split-media{position:absolute;inset:0;z-index:0;max-height:none;width:100%;height:100%;border-radius:0}
.site-root[data-family] .hero-split-detail:has(.hero-split-media) .hero-split-media img{display:block;width:100%;height:100%;max-height:none;object-fit:cover;border-radius:0}
.site-root[data-family] .hero-split-detail:has(.hero-split-media)>p,.site-root[data-family] .hero-split-detail:has(.hero-split-media)>.cta{position:relative;z-index:2}
.site-root[data-family] .hero-full-bleed.has-media .hero-bg-media{opacity:.42}
.site-root[data-family] .about{border-bottom:1px solid var(--border)}
.site-root[data-family] .footer-editorial{border-top:2px solid var(--border)}
@media(max-width:800px){
  .site-root[data-family] .hero-split-detail:has(.hero-split-media){display:flex;flex-direction:column;align-items:stretch;gap:20px;min-height:0;padding:0 0 32px;color:var(--text);background:var(--surface)}
  .site-root[data-family] .hero-split-detail:has(.hero-split-media)::after{display:none}
  .site-root[data-family] .hero-split-detail:has(.hero-split-media) .hero-split-media{position:relative;inset:auto;flex:none;height:clamp(260px,72vw,420px)}
  .site-root[data-family] .hero-split-detail:has(.hero-split-media)>p{margin:0 6%;max-width:62ch}
  .site-root[data-family] .hero-split-detail:has(.hero-split-media)>.cta{margin-inline:6%;align-self:flex-start}
}
`;
export const siteCss = baseStyles + variantStyles + presentationStyles;

const SECTION_LABELS: Record<string, string> = {
  hero: 'Abertura',
  about: 'Sobre',
  services: 'Serviços',
  contact: 'Contato',
  location: 'Localização',
};

export function SiteRenderer({
  blueprint: input,
  context,
  design: designInput,
  mediaManifest: manifestInput,
  assetUrls,
  editorMode,
  demoMode = false,
}: {
  blueprint: GeneratedSiteBlueprint;
  context: LeadSiteContext;
  design?: ResolvedDesign;
  mediaManifest?: MediaManifest;
  assetUrls?: Record<string, string>;
  /** When true, adds data-editor-section-id attrs for click-to-select. Never set in export. */
  editorMode?: boolean;
  demoMode?: boolean;
}) {
  const design = designInput ? resolvedDesignSchema.parse(designInput) : undefined;
  const mediaManifest = manifestInput ? mediaManifestSchema.parse(manifestInput) : undefined;
  const tokens = design?.specification.tokens;
  const b = constrainBlueprint(normalizeForRender(input), context);
  if (demoMode) {
    b.sections.contact = input.sections.contact;
    b.sections.location = input.sections.location;
  }
  const props = { blueprint: b, context, mediaManifest, assetUrls, demoMode };
  const presentation = resolvePresentation(b);
  const palette = surfacePalettes[presentation.theme];
  const Navigation = resolveSection("navigation", b.visual.navigation);
  const Footer = resolveSection("footer", b.visual.footer);

  return (
    <div
      className={"site-root " + b.templateId}
      data-family={design?.specification.family.id}
      data-theme={presentation.theme}
      data-typography={presentation.typography}
      data-motion={presentation.motion}
      style={{
        "--background": palette.background,
        "--surface": palette.surface,
        "--raised": palette.raised,
        "--text": palette.text,
        "--muted": palette.muted,
        "--border": palette.border,
        "--primary": b.brand.primaryColor,
        "--accent": b.brand.accentColor,
        "--on-primary": foregroundFor(b.brand.primaryColor),
        "--on-accent": foregroundFor(b.brand.accentColor),
        ...(tokens
          ? {
              ...(presentation.theme === design?.specification.presentation.theme ? {
              '--background': tokens.color.background,
              '--surface': tokens.color.surface,
              '--raised': tokens.color.surfaceElevated,
              '--text': tokens.color.text,
              '--muted': tokens.color.textMuted,
              '--border': tokens.color.border,
              } : {}),
              '--radius': `${tokens.radius.card}px`,
              '--space-section': `${tokens.spacing.section}px`,
              '--compact-section': `${tokens.spacing.sectionCompact}px`,
              '--cta-radius': `${tokens.radius.cta}px`,
            }
          : {}),
      } as React.CSSProperties}
    >
      <a className="skip-link" href="#site-main">
        Pular para o conteúdo
      </a>
      <Navigation {...props} />
      <main id="site-main" tabIndex={-1}>
        {b.sectionOrder
          .filter((section) => b.sections[section])
          .map((section) => {
            const Component = resolveSection(section, b.visual[section]);
            const desktopHero = section === 'hero' ? design?.stitch?.appearance?.desktop?.heroLayout : undefined;
            const useDesktopHero = desktopHero && desktopHero !== b.visual.hero && b.visual.hero === design?.specification.visual.hero;
            const DesktopHero = useDesktopHero ? resolveSection('hero', desktopHero) : undefined;
            const editorAttrs = editorMode
              ? {
                  'data-editor-section-id': section,
                  'data-editor-section-label': SECTION_LABELS[section] ?? section,
                }
              : {};
            return (
              <section
                id={section}
                className={section}
                data-variant={b.visual[section]}
                key={section}
                {...editorAttrs}
              >
                {section === 'services' && design?.stitch ? <StitchServices {...props} /> : DesktopHero ? <>
                  <div className="stitch-mobile-layout"><Component {...props} /></div>
                  <div className="stitch-desktop-layout"><DesktopHero {...props} /></div>
                </> : <Component {...props} />}
              </section>
            );
          })}
      </main>
      <Footer {...props} />
    </div>
  );
}

export function renderSiteDocument(
  input: GeneratedSiteBlueprint,
  context: LeadSiteContext,
  design?: ResolvedDesign,
  mediaManifest?: MediaManifest,
  assetUrls?: Record<string, string>,
  editorMode?: boolean,
  demoMode = false,
) {
  const blueprint = normalizeForRender(input);
  const typographyOverridden = resolvePresentation(blueprint).typography !== design?.specification.presentation.typography;
  const appearanceCss = (appearance: StitchAppearance) => stitchAppearanceCss(typographyOverridden
    ? { ...appearance, headingFont: undefined, bodyFont: undefined } : appearance);
  return (
    "<!doctype html>" +
    renderToStaticMarkup(
      <html lang="pt-BR">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta name="description" content={blueprint.seo.description} />
          <title>{blueprint.seo.title}</title>
          <style>{siteCss}</style>
          {design?.stitch?.appearance?.desktop && <style>{stitchResponsiveCss}</style>}
          {!typographyOverridden && stitchFontUrl(design) && <link rel="stylesheet" href={stitchFontUrl(design)} />}
          {design && (
            <style>{`.site-root[data-family] .cta{border-radius:var(--cta-radius)}@media(max-width:800px){.site-root[data-family] .section-inner{padding-block:var(--compact-section)}}`}</style>
          )}
          {mediaManifest && <style>{mediaStyles}</style>}
          {design?.stitch && <style>{stitchServicesStyles}</style>}
          {design?.stitch && <style>{stitchFinishStyles}</style>}
          {design?.stitch?.appearance && <style>{appearanceCss(design.stitch.appearance.mobile) + (design.stitch.appearance.desktop ? `@media(min-width:801px){${appearanceCss(design.stitch.appearance.desktop)}}` : '')}</style>}
        </head>
        <body>
          <SiteRenderer
            blueprint={blueprint}
            context={context}
            design={design}
            mediaManifest={mediaManifest}
            assetUrls={assetUrls}
            editorMode={editorMode}
            demoMode={demoMode}
          />
        </body>
      </html>,
    )
  );
}

function stitchFontUrl(design?: ResolvedDesign) {
  const appearance = design?.stitch?.appearance;
  if (!appearance) return undefined;
  const fonts = [appearance.mobile, appearance.desktop].filter(Boolean).flatMap(a => {
    const safe = stitchAppearanceSchema.parse(a);
    return [safe.headingFont, safe.bodyFont].filter((f): f is string => Boolean(f));
  });
  return fonts.length ? 'https://fonts.googleapis.com/css2?' + [...new Set(fonts)].map(f => 'family=' + encodeURIComponent(f) + ':wght@400;500;600;700').join('&') + '&display=swap' : undefined;
}
export function stitchAppearanceCss(input: StitchAppearance) {
  const a = stitchAppearanceSchema.parse(input);
  const properties = [a.headingFont ? `--font-display:'${a.headingFont}',serif` : '', a.bodyFont ? `--font-body:'${a.bodyFont}',sans-serif` : ''].filter(Boolean).join(';');
  return `.site-root[data-family]{${properties}}`
    + (a.radius !== undefined ? `.site-root[data-family] .cta,.site-root[data-family] article{border-radius:${a.radius}px}` : '')
    + (a.heroSize ? `.site-root[data-family] .hero h1{font-size:clamp(24px,${a.heroSize}px,${a.heroSize}px)}` : '')
    + (a.sectionSpace !== undefined ? `.site-root[data-family] .section-inner{padding-block:${a.sectionSpace}px}` : '')
    + (a.serviceCardStyle === 'technical' ? `
.site-root[data-family] .hero h1{text-transform:uppercase;letter-spacing:-.055em}
.site-root[data-family] .services-heading{border-bottom:2px solid var(--text)}
.site-root[data-family] .services-heading h2{text-transform:uppercase;font-size:clamp(34px,4vw,58px);font-weight:900;line-height:1}
.site-root[data-family] .service-columns article{background:var(--surface);border:2px solid var(--text);border-radius:0;box-shadow:6px 6px 0 var(--text);min-height:320px}
.site-root[data-family] .service-card-index{color:var(--primary)}
.site-root[data-family] .services article>.service-price{background:var(--accent);color:var(--on-accent);padding:4px 8px;font-size:16px;border:1px solid var(--text)}
.site-root[data-family] .services article>.service-price small{color:var(--on-accent);font-size:9px}
.site-root[data-family] .stitch-services .service-columns .service-description{border-top:1px solid var(--text);padding-top:18px;color:var(--text)}
.site-root[data-family] .service-columns article:last-child:nth-child(n+3){background:var(--primary);color:var(--on-primary);box-shadow:6px 6px 0 var(--accent)}
.site-root[data-family] .service-columns article:last-child:nth-child(n+3) .service-description{border-color:var(--on-primary);color:var(--on-primary)}
.site-root[data-family] .service-columns article:last-child:nth-child(n+3) .service-card-index{color:var(--accent)}
@media(max-width:600px){.site-root[data-family] .service-columns article{min-height:0;box-shadow:4px 4px 0 var(--text)}}` : '')
    + (a.serviceCardStyle === 'soft' ? `
.site-root[data-family] .service-columns article{background:var(--raised);border:1px solid var(--border);border-radius:18px;box-shadow:none;min-height:0}
.site-root[data-family] .services-heading h2{text-transform:none;font-size:clamp(28px,3vw,40px);font-weight:700;line-height:1.2}
.site-root[data-family] .services article>.service-price{color:var(--primary)}
.site-root[data-family] .stitch-services .service-columns .service-description{border-top:0;padding-top:0;color:var(--muted)}
.site-root[data-family] .service-columns article:last-child:nth-child(n+3){background:var(--raised);color:var(--text);box-shadow:none}
.site-root[data-family] .service-columns article:last-child:nth-child(n+3) .service-card-index{color:var(--muted)}` : '');
}
