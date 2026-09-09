import React from "react";
import type { SectionProps } from "../shared";
export function LocationEditorial({ context }: SectionProps) {
  return <div className="location-editorial section-inner"><h2>Localização</h2><address>{context.contact.address}</address><p>{context.business.city}</p></div>;
}
export const locationStyles = `.location-editorial{background:#eef1ed}.location-editorial address{font-style:normal;font-size:clamp(22px,3vw,36px);max-width:900px;margin:24px 0}.location-editorial p{color:var(--muted)}`;
