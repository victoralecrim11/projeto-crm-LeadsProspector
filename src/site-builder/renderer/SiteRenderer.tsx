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
import { MediaCredits } from '../sections/shared';

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
.media-credits{padding:24px var(--gutter,32px);background:var(--surface,#f8fafc);color:var(--muted,#64748b);font-size:12px;border-top:1px solid var(--border,#e2e8f0)}
.media-credits-inner{max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.media-credits-title{font-weight:600}
.media-credits-list{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:16px}
.media-credits-item{display:flex;gap:6px;align-items:center}
.media-credits-link{color:inherit;text-decoration:underline}
`;

const stitchResponsiveCss = `
.stitch-desktop-layout{display:none}
@media(min-width:801px){.stitch-mobile-layout{display:none}.stitch-desktop-layout{display:block}}
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
}: {
  blueprint: GeneratedSiteBlueprint;
  context: LeadSiteContext;
  design?: ResolvedDesign;
  mediaManifest?: MediaManifest;
  assetUrls?: Record<string, string>;
  /** When true, adds data-editor-section-id attrs for click-to-select. Never set in export. */
  editorMode?: boolean;
}) {
  const design = designInput ? resolvedDesignSchema.parse(designInput) : undefined;
  const mediaManifest = manifestInput ? mediaManifestSchema.parse(manifestInput) : undefined;
  const tokens = design?.specification.tokens;
  const b = constrainBlueprint(normalizeForRender(input), context);
  const props = { blueprint: b, context, mediaManifest, assetUrls };
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
                {DesktopHero ? <>
                  <div className="stitch-mobile-layout"><Component {...props} /></div>
                  <div className="stitch-desktop-layout"><DesktopHero {...props} /></div>
                </> : <Component {...props} />}
              </section>
            );
          })}
      </main>
      <Footer {...props} />
      {mediaManifest && <MediaCredits manifest={mediaManifest} />}
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
) {
  const blueprint = constrainBlueprint(normalizeForRender(input), context);
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
    + (a.sectionSpace !== undefined ? `.site-root[data-family] .section-inner{padding-block:${a.sectionSpace}px}` : '');
}
