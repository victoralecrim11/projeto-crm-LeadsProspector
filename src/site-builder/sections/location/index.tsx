import React from "react";
import type { SectionProps } from "../shared";
export function LocationEditorial({ context }: SectionProps) {
  const hasAddress = Boolean(context.contact.address.trim());
  return <div className="location-editorial section-inner">
    <span className="eyebrow">Onde encontrar</span>
    <h2>Localização</h2>
    <div className="location-details">
      <p className="location-city">{context.business.city}</p>
      {hasAddress
        ? <address>{context.contact.address}</address>
        : <p className="location-pending">Endereço em confirmação.</p>}
    </div>
  </div>;
}
export const locationStyles = `.location-editorial{background:var(--raised);border-top:1px solid var(--border)}.location-editorial h2{margin-top:12px}.location-details{margin-top:28px;padding:24px;border:1px solid var(--border);border-radius:var(--radius,8px);background:var(--surface);max-width:48rem}.location-city{font-size:clamp(20px,2.5vw,30px);font-weight:700}.location-editorial address{font-style:normal;font-size:clamp(17px,2vw,22px);margin-top:10px}.location-pending{color:var(--muted);margin-top:10px}`;
