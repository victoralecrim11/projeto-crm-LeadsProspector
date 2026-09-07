import React, { useMemo, useState } from "react";
import type { GeneratedSiteBlueprint, LeadSiteContext } from "../types";
import { renderSiteDocument } from "../renderer/SiteRenderer";
export function SitePreview({
  blueprint,
  context,
}: {
  blueprint: GeneratedSiteBlueprint;
  context: LeadSiteContext;
}) {
  const [mobile, setMobile] = useState(false);
  const html = useMemo(() => {
    try {
      return renderSiteDocument(blueprint, context);
    } catch {
      return null;
    }
  }, [blueprint, context]);
  if (!html)
    return (
      <p role="status" className="p-4 text-amber-300">
        Complete os campos obrigatórios para atualizar a prévia.
      </p>
    );
  return (
    <div className="space-y-3 min-w-0">
      <div className="site-preview-tabs flex gap-2">
        <button
          className="px-4 py-2 rounded-lg bg-slate-700 text-white"
          aria-pressed={!mobile}
          onClick={() => setMobile(false)}
        >
          Desktop
        </button>
        <button
          className="px-4 py-2 rounded-lg bg-slate-700 text-white"
          aria-pressed={mobile}
          onClick={() => setMobile(true)}
        >
          Mobile
        </button>
      </div>
      <iframe
        title="Prévia do site"
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        srcDoc={html}
        className="site-preview-frame block mx-auto rounded-xl border border-slate-600 bg-white"
        style={{
          width: mobile ? "min(100%, 390px)" : "100%",
          height: "min(72vh, 800px)",
          minHeight: 360,
        }}
      />
    </div>
  );
}
