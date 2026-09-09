import React from "react";
import { sectionNames, type SectionProps } from "../shared";
export function InlineNavigation({ blueprint: b, context }: SectionProps) {
  return <header className="site-navigation"><a className="brand-name" href="#site-main">{context.business.name}</a><nav aria-label="Seções">{b.sectionOrder.filter((s) => b.sections[s]).map((s) => <a key={s} href={"#" + s}>{sectionNames[s]}</a>)}</nav></header>;
}
export const navigationStyles = `.site-navigation{padding:20px var(--gutter);display:flex;justify-content:space-between;gap:24px;align-items:center;flex-wrap:wrap;border-bottom:1px solid var(--border)}.site-navigation a{display:inline-flex;align-items:center;min-height:44px;text-decoration:none}.brand-name{font-size:20px;font-weight:700;max-width:480px}.site-navigation nav{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:14px}@media(max-width:600px){.site-navigation{padding:16px 6%;gap:8px}.site-navigation nav{gap:4px 16px}}`;
