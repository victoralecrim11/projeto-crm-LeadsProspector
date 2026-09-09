import React from "react";
import { confirmedContactLinks } from "../../contactLinks";
import type { SectionProps } from "../shared";
function ContactLinks({ context }: SectionProps) {
  return <address className="contact-links">
    {confirmedContactLinks(context).map((link) => <a key={link.kind} href={link.href}>{link.label}</a>)}
  </address>;
}
export function ContactMinimal(props: SectionProps) {
  return <div className="contact-minimal section-inner"><h2>Contato</h2><ContactLinks {...props} /></div>;
}
export function ContactSplit(props: SectionProps) {
  return <div className="contact-split section-inner"><div><span className="eyebrow">Contato</span><h2>{props.context.business.name}</h2></div><ContactLinks {...props} /></div>;
}
export const contactStyles = `.contact-links{font-style:normal;display:flex;flex-direction:column;align-items:flex-start;gap:12px}.contact-links a{display:inline-flex;align-items:center;min-height:44px;text-underline-offset:5px}.contact-minimal h2{margin-bottom:24px}.contact-split{display:grid;grid-template-columns:1fr 1fr;gap:56px;border-top:1px solid var(--border)}.contact-split h2{margin-top:20px;font-family:Georgia,serif;font-weight:400;font-size:clamp(32px,4vw,56px)}@media(max-width:700px){.contact-split{grid-template-columns:1fr;gap:24px}}`;
