import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { GeneratedSiteBlueprint, LeadSiteContext } from "../types";
import { constrainBlueprint, phoneDigits, whatsappDigits } from "../context";

export const siteCss = `
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:system-ui,sans-serif;color:#142333;background:#fafafa;line-height:1.65;overflow-wrap:anywhere}
a{color:inherit}a:focus-visible{outline:3px solid var(--accent);outline-offset:5px}header,footer{padding:24px max(6%,calc((100% - 1100px)/2));background:#fff}header{display:flex;gap:20px;justify-content:space-between;flex-wrap:wrap;border-bottom:1px solid #dbe3e9}nav{display:flex;gap:18px;flex-wrap:wrap}nav a{text-decoration:none;font-size:14px}main section{padding:64px max(6%,calc((100% - 1100px)/2))}h1{font-size:clamp(32px,5vw,66px);line-height:1.12;letter-spacing:-.045em;max-width:900px}h2{font-size:30px;line-height:1.2}h3{line-height:1.3}p{max-width:760px;white-space:pre-line}.hero{background:var(--primary);color:white;min-height:440px;display:flex;flex-direction:column;justify-content:center}.eyebrow{text-transform:uppercase;font-size:12px;letter-spacing:.16em}.cta{display:inline-block;align-self:flex-start;padding:14px 24px;background:#fff;color:#142333;border-radius:8px;text-decoration:none;font-weight:700;border:2px solid var(--accent)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:24px}.card{padding:24px;border:1px solid #dbe3e9;border-top:4px solid var(--accent);border-radius:12px;background:white}.suggestion{font-size:12px;color:#713f12;background:#fef3c7;padding:6px;border-radius:6px}.contact a{display:block;margin:12px 0}.premium-service .hero{background:#101828;border-bottom:8px solid var(--accent)}.premium-service h1{font-family:Georgia,serif;font-weight:400}.minimal-professional .hero{background:#fff;color:#142333;border-bottom:1px solid #dbe3e9;min-height:340px}.minimal-professional .card{border-radius:0}.appointment-focused .hero{border-radius:0 0 60px 0}.appointment-focused .cta{font-size:20px}.modern-local-business .hero{background:linear-gradient(125deg,var(--primary),#142333)}section:nth-child(even){background:#f1f5f9}footer{border-top:1px solid #dbe3e9}@media(max-width:600px){header{padding:18px 6%}main section{padding:36px 6%}.hero{min-height:360px}nav{gap:12px}h2{font-size:25px}.cta{width:100%;text-align:center}}
`;
const names = {
  hero: "Início",
  about: "Sobre",
  services: "Serviços",
  contact: "Contato",
  location: "Localização",
};
export function SiteRenderer({
  blueprint: input,
  context,
}: {
  blueprint: GeneratedSiteBlueprint;
  context: LeadSiteContext;
}) {
  const b = constrainBlueprint(input, context);
  const phone = phoneDigits(context.contact.phone);
  const whatsapp = whatsappDigits(context.contact.whatsapp);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.contact.email)
    ? context.contact.email
    : "";
  const href =
    b.hero.ctaType === "whatsapp" && whatsapp
      ? "https://wa.me/" + whatsapp
      : b.hero.ctaType === "phone" && phone
        ? "tel:+" + phone
        : b.hero.ctaType === "contact" && b.sections.contact
          ? "#contact"
          : "";
  const pieces: Record<string, React.ReactNode> = {
    hero: (
      <>
        <span className="eyebrow">
          {context.business.category} · {context.business.city}
        </span>
        <h1>{b.hero.headline}</h1>
        <p>{b.hero.subtitle}</p>
        {href && (
          <a className="cta" href={href}>
            {b.hero.ctaText || "Entrar em contato"}
          </a>
        )}
      </>
    ),
    about: (
      <>
        <h2>{b.about.title}</h2>
        <p>{b.about.description}</p>
      </>
    ),
    services: (
      <>
        <h2>Serviços</h2>
        <div className="grid">
          {b.services.map((s, i) => (
            <article className="card" key={i}>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              {s.source === "ai_suggestion" ? (
                <p className="suggestion">
                  Sugestão da IA — revisar antes de publicar
                </p>
              ) : (
                s.price && <p>{s.price}</p>
              )}
            </article>
          ))}
        </div>
      </>
    ),
    contact: (
      <div className="contact">
        <h2>Contato</h2>
        {phone && <a href={"tel:+" + phone}>{context.contact.phone}</a>}
        {whatsapp && (
          <a href={"https://wa.me/" + whatsapp}>Conversar no WhatsApp</a>
        )}
        {email && <a href={"mailto:" + email}>{email}</a>}
      </div>
    ),
    location: (
      <>
        <h2>Localização</h2>
        <address>{context.contact.address}</address>
        <p>{context.business.city}</p>
      </>
    ),
  };
  return (
    <div
      className={b.templateId}
      style={
        {
          "--primary": b.brand.primaryColor,
          "--accent": b.brand.accentColor,
        } as React.CSSProperties
      }
    >
      <header>
        <strong>{context.business.name}</strong>
        <nav aria-label="Seções">
          {b.sectionOrder
            .filter((s) => b.sections[s])
            .map((s) => (
              <a key={s} href={"#" + s}>
                {names[s]}
              </a>
            ))}
        </nav>
      </header>
      <main>
        {b.sectionOrder
          .filter((s) => b.sections[s])
          .map((s) => (
            <section id={s} className={s} key={s}>
              {pieces[s]}
            </section>
          ))}
      </main>
      <footer>
        {context.business.name} · {context.business.city}
      </footer>
    </div>
  );
}
export function renderSiteDocument(
  blueprint: GeneratedSiteBlueprint,
  context: LeadSiteContext,
) {
  return (
    "<!doctype html>" +
    renderToStaticMarkup(
      <html lang="pt-BR">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta name="description" content={blueprint.seo.description} />
          <title>{blueprint.seo.title}</title>
          <style>{siteCss}</style>
        </head>
        <body>
          <SiteRenderer blueprint={blueprint} context={context} />
        </body>
      </html>,
    )
  );
}
