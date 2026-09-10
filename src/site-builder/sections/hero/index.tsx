import React from "react";
import { Cta, Eyebrow, findSectionMedia, type SectionProps } from "../shared";
export function FullBleedHero(props: SectionProps) {
  const media = findSectionMedia(props, "hero");
  if (media) {
    return <div className="hero-full-bleed has-media">
      <div className="hero-bg-media"><img src={media.url} alt={media.decorative ? "" : media.alt} loading="lazy" decoding="async" /></div>
      <Eyebrow {...props} />
      <h1>{props.blueprint.hero.headline}</h1>
      <div className="hero-full-bleed-bottom"><p>{props.blueprint.hero.subtitle}</p><Cta {...props} /></div>
    </div>;
  }
  return <div className="hero-full-bleed">
    <Eyebrow {...props} />
    <h1>{props.blueprint.hero.headline}</h1>
    <div className="hero-full-bleed-bottom"><p>{props.blueprint.hero.subtitle}</p><Cta {...props} /></div>
  </div>;
}
export function SplitHero(props: SectionProps) {
  const media = findSectionMedia(props, "hero");
  return <div className="hero-split">
    <div className="hero-split-title"><Eyebrow {...props} /><h1>{props.blueprint.hero.headline}</h1></div>
    <div className="hero-split-detail">{media ? <div className="hero-split-media"><img src={media.url} alt={media.decorative ? "" : media.alt} loading="lazy" decoding="async" width={media.width} height={media.height} /></div> : <span className="hero-monogram" aria-hidden="true">{Array.from(props.context.business.name)[0]}</span>}
      <p>{props.blueprint.hero.subtitle}</p><Cta {...props} /></div>
  </div>;
}
export function MinimalHero(props: SectionProps) {
  const media = findSectionMedia(props, "hero");
  return <div className="hero-minimal"><div className="hero-minimal-label"><Eyebrow {...props} /></div>
    <div className="hero-minimal-story">{media && <div className="hero-minimal-media"><img src={media.url} alt={media.decorative ? "" : media.alt} loading="lazy" decoding="async" width={media.width} height={media.height} /></div>}<h1>{props.blueprint.hero.headline}</h1><p>{props.blueprint.hero.subtitle}</p><Cta {...props} /></div>
  </div>;
}
export const heroStyles = `
.hero-full-bleed{background:var(--primary);color:var(--on-primary);padding:clamp(48px,8vw,120px) var(--gutter);min-height:650px;display:flex;flex-direction:column;justify-content:space-between;gap:36px}
.hero-full-bleed h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(48px,8vw,112px);max-width:1100px;line-height:1.02;letter-spacing:-.055em}
.hero-full-bleed-bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:48px}.hero-full-bleed-bottom p{max-width:620px;font-size:20px}
.hero-split{display:grid;grid-template-columns:1.2fr 1fr;min-height:590px}.hero-split-title{background:var(--primary);color:var(--on-primary);padding:72px max(32px,6vw);display:flex;flex-direction:column;justify-content:space-between;gap:56px}
.hero-split h1{font-family:Impact,'Arial Narrow',sans-serif;text-transform:uppercase;font-size:clamp(40px,5.6vw,82px);letter-spacing:-.025em;line-height:1.06}
.hero-split-detail{padding:56px max(32px,5vw);background:var(--accent);color:var(--on-accent);display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:24px}.hero-monogram{font-family:Georgia,serif;font-size:clamp(96px,15vw,220px);line-height:1;align-self:center;border-bottom:1px solid currentColor;width:100%;text-align:center}
.hero-minimal{padding:80px var(--gutter) 100px;display:grid;grid-template-columns:1fr 3fr;gap:48px;border-bottom:1px solid var(--border)}.hero-minimal-label{padding-top:12px}.hero-minimal h1{font-size:clamp(38px,5vw,70px);font-weight:500;max-width:860px}.hero-minimal-story{display:flex;flex-direction:column;align-items:flex-start;gap:24px}.hero-minimal p{max-width:600px}
@media(max-width:800px){.hero-split{grid-template-columns:1fr}.hero-split-title{padding:48px 6%;gap:32px}.hero-split-detail{padding:36px 6%;display:grid;grid-template-columns:100px 1fr;gap:24px}.hero-monogram{font-size:100px;grid-row:span 2}.hero-split-detail .cta{justify-self:start}.hero-minimal{grid-template-columns:1fr;gap:24px;padding:48px 6%}.hero-full-bleed{min-height:540px;padding:48px 6%;gap:40px}.hero-full-bleed-bottom{flex-direction:column;align-items:flex-start;gap:24px}}
@media(max-width:480px){.hero-split-detail{display:flex}.hero-monogram{display:none}.hero-full-bleed h1{font-size:clamp(40px,12vw,58px)}.hero-full-bleed-bottom p{font-size:17px}}
`;
