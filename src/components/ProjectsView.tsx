import React from "react";
import { useNavigate } from "react-router-dom";
import { useCrm } from "../hooks/useCrm";
export const ProjectsView: React.FC = () => {
  const { projects, setIsCreateSiteModalOpen } = useCrm();
  const navigate = useNavigate();
  const labels: Record<string, string> = {
    generating: "Gerando",
    generated: "Gerado · revisão pendente",
    editing: "Em edição",
    ready: "Revisado",
    exported: "Exportado",
    error: "Falha na geração",
    draft: "Rascunho",
  };
  return (
    <div className="site-workspace space-y-5">
      <div className="flex justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Meus Projetos</h2>
        <button
          className="bg-indigo-600 rounded-xl p-3"
          onClick={() => setIsCreateSiteModalOpen(true)}
        >
          Criar Novo Site IA
        </button>
      </div>
      {!projects.length && (
        <p>Nenhum projeto salvo. Gere um site para um lead para começar.</p>
      )}
      <div className="site-project-grid">
        {projects.map((p) => (
          <article key={p.id} className="glass-panel p-5 rounded-2xl space-y-3">
            <span className="text-sky-300 text-xs">{p.category}</span>
            <h3 className="font-bold">{p.title}</h3>
            <p>{p.clientName}</p>
            <p className="text-sm">
              {labels[p.generationStatus || "draft"] || "Projeto legado"}
            </p>
            <p className="text-xs text-slate-300">
              {p.aiGeneration?.model || "Sem geração de IA registrada"}
            </p>
            {p.generationError && (
              <p className="text-rose-300">{p.generationError}</p>
            )}
            <button
              className="bg-indigo-600 rounded-lg p-3"
              onClick={() =>
                navigate("/editor?project=" + encodeURIComponent(p.id))
              }
            >
              {p.siteBlueprint ? "Visualizar e editar site" : "Abrir projeto"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
};
