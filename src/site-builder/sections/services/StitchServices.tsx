import React from 'react';
import type { SectionProps } from '../shared';

/** Curated component catalogue output for a Stitch-led services section. */
export function StitchServices({ blueprint }: SectionProps) {
  const isEditorial = blueprint.visual.services === 'editorial-list';
  return <div className={`stitch-services section-inner ${isEditorial ? 'stitch-services-list' : 'stitch-services-cards'}`}>
    <div className="services-heading">
      <span className="services-kicker">Portfólio de serviços</span>
      <h2>Serviços</h2>
    </div>
    <div className="service-columns">
      {blueprint.services.map((service, index) => <article key={`${service.title}-${index}`}>
        <span className="service-card-index" aria-hidden="true">#{String(index + 1).padStart(2, '0')}</span>
        <h3>{service.title}</h3>
        {service.price && <p className="service-price">{service.price}{service.priceKind === 'example' && <small>Valor ilustrativo</small>}</p>}
        <p className="service-description">{service.description}</p>
        {service.source === 'ai_suggestion' && <p className="suggestion">Sugestão da IA — revisar antes de publicar</p>}
      </article>)}
    </div>
  </div>;
}

export const stitchServicesStyles = `
.site-root .stitch-services .services-heading{display:flex;flex-direction:column;align-items:flex-start;gap:4px;border-bottom:1px solid var(--border);padding-bottom:20px;margin-bottom:32px}
.site-root .stitch-services .services-kicker{color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.site-root .stitch-services .service-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.site-root .stitch-services-list .service-columns{grid-template-columns:1fr}
.site-root .stitch-services .service-columns article{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto 1fr auto;align-content:start;gap:14px 12px;min-width:0;min-height:250px;padding:28px;background:var(--raised);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 24px #00000008}
.site-root .stitch-services-list .service-columns article{min-height:0}
.site-root .stitch-services .service-card-index{grid-column:1/-1;color:var(--muted);font-size:12px;font-weight:800;letter-spacing:.12em}
.site-root .stitch-services .service-columns h3{grid-column:1;align-self:start;margin:0;font-size:clamp(19px,1.8vw,24px)}
.site-root .stitch-services .service-columns .service-price{grid-column:2;grid-row:2;align-self:start;display:flex;flex-direction:column;align-items:flex-end;gap:2px;color:var(--text);font-size:18px;font-weight:800;white-space:nowrap}
.site-root .stitch-services .service-price small{font-size:10px;font-weight:600;letter-spacing:.02em;white-space:normal;text-align:right;color:var(--muted)}
.site-root .stitch-services .service-columns .service-description{grid-column:1/-1;color:var(--muted);font-size:15px;line-height:1.55}
.site-root .stitch-services .service-columns .suggestion{grid-column:1/-1;justify-self:start;margin:0;font-size:11px}
@media(max-width:1000px){.site-root .stitch-services-cards .service-columns{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.site-root .stitch-services .service-columns{grid-template-columns:1fr}.site-root .stitch-services .service-columns article{min-height:0;padding:22px}.site-root .stitch-services .services-heading{margin-bottom:24px}}
`;
