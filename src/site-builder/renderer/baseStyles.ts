// Static system font stacks keep offline exports self-contained and avoid font CLS.
export const baseStyles = `
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fbfaf7;color:#202621;font-family:Arial,Helvetica,sans-serif;line-height:1.65;overflow-wrap:anywhere}
.site-root{--gutter:max(6%,calc((100% - 1200px)/2));--border:#c9cec7;--muted:#505950;min-height:100vh}
h1,h2,h3,p{margin:0}h1,h2,h3{line-height:1.15}h1{letter-spacing:-.045em}h2{font-size:clamp(28px,3vw,40px);letter-spacing:-.025em}h3{font-size:24px}a{color:inherit}a:focus-visible{outline:3px solid currentColor;outline-offset:5px}main{outline:none}section{scroll-margin-top:24px}.section-inner{padding:88px var(--gutter)}.eyebrow{text-transform:uppercase;font-size:12px;letter-spacing:.16em;font-weight:600}.cta{display:inline-flex;gap:16px;align-items:center;justify-content:center;min-height:48px;flex-shrink:0;padding:14px 24px;background:#fff;color:#202621;border:1px solid #202621;text-decoration:none;font-weight:700}.skip-link{position:absolute;left:16px;top:-100px;z-index:10;padding:12px;background:#fff;color:#202621}.skip-link:focus{top:16px}
@media(max-width:600px){.section-inner{padding:48px 6%}.cta{max-width:100%;font-size:16px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important}}
`;
export function foregroundFor(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)!.map((value) => {
    const s = parseInt(value, 16) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "#000000" : "#ffffff";
}
