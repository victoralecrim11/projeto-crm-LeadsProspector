import React from "react";
import { confirmedContactLinks } from "../../contactLinks";
import { sectionNames, type SectionProps } from "../shared";

function Footer({ blueprint, context, variant, demoMode }: SectionProps & { variant: "minimal" | "editorial" }) {
  const contacts = confirmedContactLinks(context);
  const primary = contacts.find((link) => link.kind === "whatsapp")
    ?? contacts.find((link) => link.kind === "phone")
    ?? contacts.find((link) => link.kind === "email");
  const primaryLabel = primary?.kind === "whatsapp"
    ? "Conversar no WhatsApp"
    : primary?.kind === "phone"
      ? "Ligar agora"
      : "Enviar e-mail";
  const links = (["about", "services", "location", "contact"] as const)
    .filter((section) => blueprint.sections[section]);

  return (
    <footer className={`footer-${variant}`}>
      <div className="footer-shell">
        <div className="footer-main">
          <div className="footer-identity">
            <p className="footer-kicker">{context.business.category} · {context.business.city}</p>
            <p className="footer-wordmark">{context.business.name}</p>
            <p className="footer-message">
              {demoMode
                ? "Demonstração visual. Informações comerciais sujeitas à confirmação."
                : blueprint.seo.description}
            </p>
          </div>
          {links.length > 0 && (
            <nav className="footer-navigation" aria-label="Navegação do rodapé">
              <p className="footer-column-title">Explore</p>
              {links.map((section) => <a key={section} href={`#${section}`}>{sectionNames[section]}</a>)}
            </nav>
          )}
          <div className="footer-contact">
            <p className="footer-column-title">Atendimento</p>
            {primary
              ? <a className="footer-cta" href={primary.href}>{primaryLabel}<span aria-hidden="true"> ↗</span></a>
              : demoMode
                ? <p className="footer-contact-pending">Canais em confirmação.</p>
                : null}
            {contacts.filter((link) => link !== primary).map((link) =>
              <a key={link.kind} className="footer-secondary-link" href={link.href}>{link.label}</a>)}
          </div>
        </div>
        <div className="footer-bottom">
          <span>{demoMode ? "Projeto de demonstração" : context.business.name}</span>
          <a className="footer-back" href="#site-main">Voltar ao início ↑</a>
        </div>
      </div>
    </footer>
  );
}

export function MinimalFooter(props: SectionProps) {
  return <Footer {...props} variant="minimal" />;
}

export function EditorialFooter(props: SectionProps) {
  return <Footer {...props} variant="editorial" />;
}

export const footerStyles = `
.footer-minimal,.footer-editorial{padding:clamp(48px,6vw,88px) var(--gutter) 24px;border-top:1px solid var(--border)}
.footer-minimal{background:var(--surface);color:var(--text)}
.footer-editorial{background:var(--primary);color:var(--on-primary)}
.footer-shell{max-width:1200px;margin:0 auto}
.footer-main{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(140px,.65fr) minmax(210px,.85fr);gap:clamp(28px,4vw,72px);padding-bottom:clamp(48px,6vw,76px)}
.footer-kicker,.footer-column-title{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;opacity:.72}
.footer-wordmark{font:600 clamp(36px,4.5vw,68px)/1.04 var(--font-display,Georgia,serif);letter-spacing:-.05em;margin:18px 0 22px;overflow-wrap:anywhere}
.footer-minimal .footer-wordmark{font-size:clamp(34px,4vw,56px)}
.footer-message{font-size:clamp(15px,1.3vw,18px);max-width:38ch;line-height:1.55;opacity:.78}
.footer-navigation,.footer-contact{display:flex;flex-direction:column;align-items:flex-start;gap:14px}
.footer-column-title{margin-bottom:9px}
.footer-navigation a,.footer-secondary-link{display:inline-flex;min-height:28px;align-items:center;text-decoration:none;line-height:1.4}
.footer-navigation a:hover,.footer-secondary-link:hover{text-decoration:underline;text-underline-offset:5px}
.footer-cta{display:inline-flex;align-items:center;justify-content:space-between;gap:24px;min-height:52px;max-width:100%;padding:12px 20px;background:var(--accent);color:var(--on-accent);font-weight:700;text-decoration:none;border-radius:var(--cta-radius,8px)}
.footer-contact-pending{font-size:15px;line-height:1.5;opacity:.78}
.footer-bottom{border-top:1px solid currentColor;padding-top:18px;display:flex;align-items:center;justify-content:space-between;gap:20px;font-size:12px;letter-spacing:.02em;opacity:.78}
.footer-bottom a{display:inline-flex;align-items:center;min-height:36px;text-underline-offset:5px}
@media(max-width:800px){.footer-main{grid-template-columns:minmax(0,1fr) minmax(130px,.7fr)}.footer-identity{grid-column:1/-1}}
@media(max-width:600px){.footer-minimal,.footer-editorial{padding:44px 6% 24px}.footer-main{grid-template-columns:1fr;gap:32px}.footer-identity{grid-column:auto}.footer-cta{width:100%}.footer-bottom{align-items:flex-start;flex-direction:column;gap:4px}}
`;
