import React from 'react';
import type { GenerationMetadata } from '../types';

export function GenerationFallbackNotice({ generation }: { generation?: GenerationMetadata }) {
  if (!generation?.fallbackUsed) return null;
  return <p role="status" className="rounded-xl p-3 bg-amber-950 text-amber-200 mb-3">A geração por IA não foi concluída. Este projeto usa uma versão básica de contingência; a fidelidade ao design Stitch ainda não foi validada.</p>;
}

export function StitchAdaptationNotice({ design }: { design?: import('../contracts/research').ResolvedDesign }) {
  if (!design?.stitch) return null;
  const missingEvidence = !design.stitch.appearance;
  const responsiveStatus = design.stitch.stitchStatus;
  return <p role="status" className="rounded-xl p-3 bg-slate-800 text-slate-200 mb-3">{missingEvidence
    ? 'Este projeto usa uma referência Stitch com detalhes visuais limitados. A reprodução do design ainda precisa de revisão.'
    : 'Design Stitch adaptado aos componentes do site. Revise composição, tipografia e imagens antes de publicar.'}
    {responsiveStatus === 'PARTIAL'
      ? design.stitch.viewportAnchors?.desktop
        ? ' A referência desktop foi recuperada, mas não passou no pareamento responsivo; o layout usa a versão mobile como base.'
        : ' A referência desktop não ficou disponível; o layout foi adaptado da versão mobile.'
      : !design.stitch.viewportAnchors?.desktop && ' A referência desktop não está disponível; o layout foi adaptado da versão mobile.'}</p>;
}
