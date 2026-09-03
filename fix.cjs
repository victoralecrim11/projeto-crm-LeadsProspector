const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

css = css.replace(/\.glass-panel\s*{([^}]+)}/g, `.glass-panel {
  position: relative;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 1;
}
.glass-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: -1;
}`);

fs.writeFileSync('src/index.css', css);
