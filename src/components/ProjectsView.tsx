import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Sparkles, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Layers, 
  Smartphone, 
  Monitor,
  Eye
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Project } from '../types';

export const ProjectsView: React.FC = () => {
  const { projects, addProject, setIsCreateSiteModalOpen } = useCrm();
  const [selectedProjectForPreview, setSelectedProjectForPreview] = useState<Project | null>(null);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Meus Projetos</h2>
          <p className="text-xs text-slate-300/80 mt-1">Gerencie sites, landing pages e catálogos entregues aos seus clientes</p>
        </div>

        <button
          onClick={() => setIsCreateSiteModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl shadow-lg shadow-indigo-500/25 border border-white/20 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ Criar Novo Site IA</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-4 sm:p-5 glass-panel rounded-2xl sm:rounded-3xl shadow-xl flex flex-col justify-between space-y-4 hover:shadow-2xl transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 truncate">
                  {project.category}
                </span>

                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg capitalize border shrink-0 ${
                  project.status === 'publicado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  project.status === 'em_desenvolvimento' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'glass-subtle text-slate-400 border-white/10'
                }`}>
                  {project.status === 'publicado' ? '● Publicado' :
                   project.status === 'em_desenvolvimento' ? '⚡ Em Criação' : 'Rascunho'}
                </span>
              </div>

              <h3 className="font-bold text-white text-base group-hover:text-sky-300 transition-colors line-clamp-2">
                {project.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 truncate">Cliente: <strong className="text-white">{project.clientName}</strong></p>

              <div className="mt-3 p-3 glass-card rounded-2xl border border-white/10 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Domínio</span>
                  <span className="font-mono text-sky-300 font-semibold text-[11px] truncate block" title={project.domain || 'subdominio.leadsite.app'}>
                    {project.domain || 'subdominio.leadsite.app'}
                  </span>
                </div>
                {project.monthlyRevenue && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Mensalidade</span>
                    <span className="font-bold text-emerald-300 text-xs whitespace-nowrap">R$ {project.monthlyRevenue}/mês</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedProjectForPreview(project)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white glass-card hover:bg-white/10 rounded-xl transition-colors border border-white/15"
              >
                <Eye className="w-3.5 h-3.5 text-sky-300" />
                <span>Visualizar Site</span>
              </button>

              <a
                href={project.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Project Mockup Preview Modal */}
      {selectedProjectForPreview && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/20 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedProjectForPreview.title}</h3>
                  <p className="text-[11px] text-slate-300">{selectedProjectForPreview.clientName} · {selectedProjectForPreview.domain}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProjectForPreview(null)}
                className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Simulated Live Website Container */}
            <div className="flex-1 overflow-y-auto bg-slate-950/80 p-6 text-slate-100">
              <div className="max-w-2xl mx-auto glass-panel rounded-3xl border border-white/15 p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-xs text-slate-300 ml-2 font-mono">{selectedProjectForPreview.domain}</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">Online</span>
                </div>

                <div className="text-center py-6 space-y-3">
                  <span className="text-xs font-bold text-sky-300 uppercase tracking-widest">
                    {selectedProjectForPreview.category} em Destaque
                  </span>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    {selectedProjectForPreview.clientName}
                  </h1>
                  <p className="text-sm text-slate-200 max-w-lg mx-auto">
                    Experiência premium, atendimento de excelência e agendamento online rápido direto pelo WhatsApp.
                  </p>
                  <div className="pt-4 flex items-center justify-center gap-3">
                    <button className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 border border-white/20">
                      Agendar Horário Online
                    </button>
                    <button className="px-5 py-2.5 glass-card hover:bg-white/10 text-slate-200 font-semibold text-xs rounded-xl border border-white/15">
                      Conhecer Serviços
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-center">
                  <div className="p-3.5 glass-card rounded-2xl border border-white/10">
                    <span className="text-xl font-bold text-amber-400">5.0 ★</span>
                    <span className="text-[11px] text-slate-300 block mt-0.5">+500 Clientes</span>
                  </div>
                  <div className="p-3.5 glass-card rounded-2xl border border-white/10">
                    <span className="text-xl font-bold text-emerald-300">100%</span>
                    <span className="text-[11px] text-slate-300 block mt-0.5">Satisfação</span>
                  </div>
                  <div className="p-3.5 glass-card rounded-2xl border border-white/10">
                    <span className="text-xl font-bold text-sky-300">24/7</span>
                    <span className="text-[11px] text-slate-300 block mt-0.5">Agendamento</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
