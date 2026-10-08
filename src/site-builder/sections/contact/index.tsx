import React from "react";
import { confirmedContactLinks } from "../../contactLinks";
import type { SectionProps } from "../shared";
function ContactLinks({ context }: SectionProps) {
  const links = confirmedContactLinks(context);
  return links.length ? <address className="contact-links">
    {links.map((link) => <a key={link.kind} href={link.href}>{link.label}</a>)}
  </address> : <p className="contact-pending">Canais de atendimento em confirmação.</p>;
}
export function ContactMinimal(props: SectionProps) {
  return <div className="contact-minimal section-inner"><span className="eyebrow">Vamos conversar</span><h2>Contato</h2><ContactLinks {...props} /></div>;
}
export function ContactSplit(props: SectionProps) {
  return <div className="contact-split section-inner"><div><span className="eyebrow">Vamos conversar</span><h2>Contato</h2></div><ContactLinks {...props} /></div>;
}
export const contactStyles = `.contact-links{font-style:normal;display:flex;flex-direction:column;align-items:flex-start;gap:12px}.contact-links a{display:inline-flex;align-items:center;min-height:44px;text-underline-offset:5px}.contact-minimal h2{margin:12px 0 24px}.contact-pending{padding:20px 24px;border:1px solid var(--border);border-radius:var(--radius,8px);color:var(--muted);max-width:36rem}.contact-split{display:grid;grid-template-columns:1fr 1fr;gap:56px;border-top:1px solid var(--border)}.contact-split h2{margin-top:20px;font-family:var(--font-display,Georgia,serif);font-weight:600;font-size:clamp(32px,4vw,56px)}@media(max-width:700px){.contact-split{grid-template-columns:1fr;gap:24px}}`;
