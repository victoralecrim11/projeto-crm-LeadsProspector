import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { SitePreview } from "../../src/site-builder/components/SitePreview";
import { visualSamples } from "../fixtures/visualSamples";

function Review() {
  const [selected, setSelected] = useState(0);
  const [visible, setVisible] = useState(true);
  const sample = visualSamples[selected];
  return <div style={{ fontFamily: "system-ui", maxWidth: 1600, margin: "auto", padding: 16 }}>
    <h1>Revisão visual P0</h1><p>Dados fictícios. Renderização real do componente de preview. Sem chamadas de IA.</p>
    <label>Nicho <select value={selected} onChange={(e) => setSelected(Number(e.target.value))}>{visualSamples.map((s, i) => <option key={s.id} value={i}>{s.context.business.category}</option>)}</select></label>{" "}
    <label><input type="checkbox" onChange={(e) => {
      if (e.target.checked) Element.prototype.requestFullscreen = () => Promise.reject(new Error("Fallback de teste"));
      else Element.prototype.requestFullscreen = nativeFullscreen;
    }} /> Testar fallback de tela cheia</label>{" "}
    <button onClick={() => setVisible(!visible)}>{visible ? "Desmontar preview" : "Montar preview"}</button>
    <p>{Object.entries(sample.blueprint.visual).map(([key, value]) => key + ": " + value).join(" · ")}</p>
    {visible && <SitePreview blueprint={sample.blueprint} context={sample.context} />}
  </div>;
}
const nativeFullscreen = Element.prototype.requestFullscreen;
createRoot(document.getElementById("root")!).render(<Review />);
