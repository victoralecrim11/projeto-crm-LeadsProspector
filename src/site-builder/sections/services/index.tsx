import React from "react";
import { ServiceContent, type SectionProps } from "../shared";
export function EditorialList({ blueprint: b }: SectionProps) {
  return <div className="services-editorial section-inner"><h2>Serviços</h2><ol>{b.services.map((service, index) =>
    <li key={index}><span className="service-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><article><ServiceContent service={service} /></article></li>)}</ol></div>;
}
export function HorizontalCards({ blueprint: b }: SectionProps) {
  return <div className="services-horizontal section-inner"><div className="services-heading"><h2>Serviços</h2></div><div className="service-columns">{b.services.map((service, index) =>
    <article key={index}><ServiceContent service={service} /></article>)}</div></div>;
}
export const servicesStyles = `
.services-editorial{display:grid;grid-template-columns:1fr 2.5fr;gap:56px}.services-editorial ol{list-style:none;margin:0;padding:0}.services-editorial li{display:grid;grid-template-columns:56px 1fr;gap:24px;border-top:1px solid var(--border);padding:28px 0}.services-editorial li:last-child{border-bottom:1px solid var(--border)}.service-index{font-family:Georgia,serif;font-size:26px;color:var(--muted)}.services-editorial h3{font-family:Georgia,serif;font-weight:400;font-size:28px}.services-editorial article p{max-width:620px;margin-top:12px}
.services-heading{margin-bottom:36px}.service-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0}.service-columns article{padding:28px;border-top:3px solid var(--primary);border-right:1px solid var(--border)}.service-columns article:last-child{border-right:0}.service-columns h3{font-size:24px;margin-bottom:16px}.service-price{font-weight:700}.suggestion{display:inline-block;font-size:13px;color:#713f12;background:#fef3c7;padding:6px 10px;margin-top:16px}
@media(max-width:1000px){.service-columns{grid-template-columns:repeat(2,minmax(0,1fr))}.services-editorial{grid-template-columns:1fr;gap:24px}}@media(max-width:600px){.service-columns{grid-template-columns:1fr}.service-columns article{padding:24px 0;border-right:0}.services-editorial li{grid-template-columns:32px 1fr;gap:16px}}
`;
