import React from "react";
import { confirmedContactLinks } from "../../contactLinks";
import { sectionNames, type SectionProps } from "../shared";

function Footer({ blueprint, context, variant }: SectionProps & { variant: 'minimal' | 'editorial' }) {
  const contact = confirmedContactLinks(context);
  const primary = contact.find(link => link.kind === 'whatsapp')
    ?? contact.find(link => link.kind === 'phone')
    ?? contact.find(link => link.kind === 'email');
  const action = primary
    ? { href: primary.href, label: primary.kind === 'whatsapp' ? 'Conversar no WhatsApp' : primary.kind === 'phone' ? 'Ligar agora' : 'Enviar e-mail' }
    : blueprint.sections.services
      ? { href: '#services', label: 'Conhecer os serviços' }
      : undefined;
  const links = (['about', 'services', 'location', 'contact'] as const)
    .filter(section => blueprint.sections[section]);

  return (
    <footer className={`footer-${variant}`}>
      <div className="footer-shell">
        <div className="footer-main">
          <div className="footer-identity">
            <p className="footer-kicker">{context.business.category} · {context.business.city}</p>
            <p className="footer-wordmark">{context.business.name}</p>
            <p className="footer-message">{action ? 'Pronto para dar o próximo passo?' : 'Explore nosso site e conheça nosso trabalho.'}</p>
          </div>
          {action && <div className="footer-action">
            <p className="footer-action-title">Comece por aqui</p>
            <a className="footer-cta" href={action.href}>{action.label}<span aria-hidden="true"> ↗</span></a>
            {primary && contact.filter(link => link !== primary).map(link =>
              <a key={link.kind} className="footer-secondary-link" href={link.href}>{link.label}</a>)}
          </div>}
        </div>
        <div className="footer-bottom">
          {links.length > 0 && <nav aria-label="Navegação do rodapé">
            {links.map(section => <a key={section} href={`#${section}`}>{sectionNames[section]}</a>)}
          </nav>}
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
.footer-minimal,.footer-editorial{padding:clamp(40px,6vw,80px) var(--gutter) 24px;border-top:1px solid var(--border)}
.footer-minimal{background:var(--surface);color:var(--text)}
.footer-editorial{background:var(--primary);color:var(--on-primary)}
.footer-shell{max-width:1200px;margin:0 auto}
.footer-main{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(240px,1fr);gap:clamp(32px,6vw,88px);align-items:end;padding-bottom:clamp(40px,6vw,72px)}
.footer-kicker{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.8}
.footer-wordmark{font:600 clamp(36px,5vw,72px)/1.08 Georgia,serif;letter-spacing:-.045em;margin:16px 0 20px;overflow-wrap:anywhere}
.footer-minimal .footer-wordmark{font-size:clamp(32px,4vw,56px)}
.footer-message{font-size:clamp(16px,1.8vw,20px);max-width:38ch;opacity:.85}
.footer-action{display:flex;flex-direction:column;align-items:flex-start;gap:14px}
.footer-action-title{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.8}
.footer-cta{display:inline-flex;align-items:center;justify-content:space-between;gap:24px;min-height:52px;max-width:100%;padding:12px 20px;background:var(--accent);color:var(--on-accent);font-weight:700;text-decoration:none;border-radius:var(--cta-radius,8px)}
.footer-secondary-link,.footer-bottom a{text-underline-offset:5px}
.footer-bottom{border-top:1px solid currentColor;padding-top:22px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;font-size:14px}
.footer-bottom nav{display:flex;gap:12px 24px;flex-wrap:wrap}
.footer-bottom a{display:inline-flex;align-items:center;min-height:36px}
@media(max-width:700px){.footer-minimal,.footer-editorial{padding:44px 6% 24px}.footer-main{grid-template-columns:1fr;gap:32px}.footer-action,.footer-cta{width:100%}.footer-bottom{align-items:flex-start;flex-direction:column}.footer-bottom nav{gap:8px 20px}}
`;
