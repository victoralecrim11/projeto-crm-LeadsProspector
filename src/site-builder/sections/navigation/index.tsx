import React from "react";
import { sectionNames, type SectionProps } from "../shared";

export function InlineNavigation({ blueprint: b, context }: SectionProps) {
  const sections = b.sectionOrder.filter((section) => b.sections[section]);
  const links = sections.map((section) => (
    <a key={section} href={"#" + section}>{sectionNames[section]}</a>
  ));

  return (
    <header className="site-navigation">
      <a className="brand-name" href="#site-main">{context.business.name}</a>
      <nav className="site-navigation-desktop" aria-label="Seções do site">{links}</nav>
      <details className="site-navigation-mobile">
        <summary aria-label="Menu de navegação">
          <span className="site-navigation-menu-icon" aria-hidden="true"><i /><i /><i /></span>
          <span>Menu</span>
        </summary>
        <nav aria-label="Seções do site">{links}</nav>
      </details>
    </header>
  );
}

export const navigationStyles = `
.site-navigation{position:relative;z-index:5;padding:20px var(--gutter);display:flex;justify-content:space-between;gap:24px;align-items:center;border-bottom:1px solid var(--border);background:var(--background)}
.site-navigation a{display:inline-flex;align-items:center;min-height:44px;text-decoration:none}
.site-navigation .brand-name{font-size:20px;font-weight:700;max-width:480px;min-width:0}
.site-navigation nav{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:14px}
.site-navigation-mobile{display:none}
@media(max-width:800px){
  .site-navigation{padding:12px 6%;gap:12px}
  .site-navigation .brand-name{flex:1;overflow-wrap:anywhere;line-height:1.2}
  .site-navigation-desktop{display:none!important}
  .site-navigation-mobile{display:block;flex:none}
  .site-navigation-mobile summary{display:flex;align-items:center;justify-content:center;gap:8px;min-width:44px;min-height:44px;padding:8px;cursor:pointer;list-style:none;font-size:14px;font-weight:700}
  .site-navigation-mobile summary::-webkit-details-marker{display:none}
  .site-navigation-mobile summary:focus-visible{outline:3px solid currentColor;outline-offset:3px}
  .site-navigation-menu-icon{display:flex;flex-direction:column;justify-content:center;gap:4px;width:20px;height:20px}
  .site-navigation-menu-icon i{display:block;width:20px;height:2px;background:currentColor;transition:transform .2s,opacity .2s}
  .site-navigation-mobile[open] .site-navigation-menu-icon i:first-child{transform:translateY(6px) rotate(45deg)}
  .site-navigation-mobile[open] .site-navigation-menu-icon i:nth-child(2){opacity:0}
  .site-navigation-mobile[open] .site-navigation-menu-icon i:last-child{transform:translateY(-6px) rotate(-45deg)}
  .site-navigation-mobile:not([open]) nav{display:none}
  .site-navigation-mobile nav{position:absolute;top:100%;left:0;right:0;display:flex;flex-direction:column;flex-wrap:nowrap;gap:0;padding:8px 6% 16px;background:var(--background);border-bottom:1px solid var(--border);box-shadow:0 12px 20px #0002}
  .site-navigation-mobile nav a{display:flex;width:100%;padding:8px 12px}
}`;
