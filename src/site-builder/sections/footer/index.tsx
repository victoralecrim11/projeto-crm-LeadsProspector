import React from "react";
import type { SectionProps } from "../shared";
export function MinimalFooter({ context }: SectionProps) {
  return <footer className="footer-minimal"><p>{context.business.name} · {context.business.city}</p></footer>;
}
export function EditorialFooter({ context }: SectionProps) {
  return <footer className="footer-editorial"><p className="footer-wordmark">{context.business.name}</p><div><span>{context.business.category}</span><span>{context.business.city}</span><a href="#site-main">Voltar ao início ↑</a></div></footer>;
}
export const footerStyles = `.footer-minimal{padding:32px var(--gutter);border-top:1px solid var(--border)}.footer-editorial{background:var(--primary);color:var(--on-primary);padding:64px var(--gutter) 32px}.footer-wordmark{font:400 clamp(40px,7vw,96px)/1.1 Georgia,serif;letter-spacing:-.045em;margin-bottom:48px}.footer-editorial>div{border-top:1px solid currentColor;padding-top:24px;display:flex;gap:24px;justify-content:space-between;align-items:center;flex-wrap:wrap}.footer-editorial a{display:inline-flex;min-height:44px;align-items:center}@media(max-width:600px){.footer-editorial{padding:40px 6% 24px}.footer-editorial>div{flex-direction:column;align-items:flex-start;gap:12px}}`;
