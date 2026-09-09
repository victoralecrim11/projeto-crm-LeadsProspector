import React from "react";
import type { SectionProps } from "../shared";
export function EditorialSplit({ blueprint: b }: SectionProps) {
  return <div className="about-editorial section-inner"><div className="about-heading"><span className="eyebrow">Sobre</span><h2>{b.about.title}</h2></div><div className="about-prose"><p>{b.about.description}</p></div></div>;
}
export function CenteredStory({ blueprint: b }: SectionProps) {
  return <article className="about-centered section-inner"><h2>{b.about.title}</h2><div className="story-rule" aria-hidden="true" /><p>{b.about.description}</p></article>;
}
export const aboutStyles = `
.about-editorial{display:grid;grid-template-columns:1fr 1.5fr;gap:80px}.about-heading h2{font-family:Georgia,serif;font-size:clamp(32px,4vw,56px);font-weight:400;margin-top:24px}.about-prose{border-left:1px solid var(--border);padding:16px 0 16px 48px;font-size:20px}.about-prose p{max-width:640px}.about-centered{text-align:center;max-width:780px;margin:auto;padding-inline:24px}.about-centered p{margin:auto;max-width:620px}.story-rule{width:60px;height:3px;background:var(--primary);margin:28px auto}
@media(max-width:800px){.about-editorial{grid-template-columns:1fr;gap:24px}.about-prose{border-left:0;border-top:1px solid var(--border);padding:24px 0 0;font-size:18px}}
`;
