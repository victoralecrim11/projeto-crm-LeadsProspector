import React from 'react';
import { DraftFlowState } from './types';
import { Lead } from '../../../types';
import { resolveLeadCanonicalNiche, getLeadCategory } from '../../leadSource';
import { BUSINESS_CATEGORIES } from '../../../domain/businessTaxonomy';

interface LeadSelectionStepProps {
  state: DraftFlowState;
  updateState: (updates: Partial<DraftFlowState>) => void;
  leads: Lead[];
}

export const LeadSelectionStep: React.FC<LeadSelectionStepProps> = ({ state, updateState, leads }) => {
  const selectedCategory = state.categoryId || 'all';
  const { leadId } = state;
  const currentLead = leads.find(l => l.id === leadId);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value === 'all' ? null : e.target.value;
    const updates: Partial<DraftFlowState> = { categoryId: newCat };
    
    if (newCat) {
      if (currentLead && resolveLeadCanonicalNiche(currentLead) !== newCat) {
        updates.leadId = null;
      }
    }
    updateState(updates);
  };

  const handleLeadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateState({ leadId: e.target.value || null });
  };

  const currentLeadCanonical = currentLead ? resolveLeadCanonicalNiche(currentLead) : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-white">Selecione o Lead</h3>
        <p className="text-sm text-slate-400">Escolha o cliente para o qual deseja gerar a página.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-300 block mb-2">Filtro de Categoria</span>
          <select
            className="block w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 transition-all"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="all">Todas as Categorias</option>
            {BUSINESS_CATEGORIES.map(cat => {
              const count = leads.filter(l => resolveLeadCanonicalNiche(l) === cat.id).length;
              return (
                <option key={cat.id} value={cat.id} disabled={count === 0}>
                  {cat.label} ({count})
                </option>
              );
            })}
          </select>
        </label>
        
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-300 block mb-2">Lead Selecionado</span>
          <select
            className="block w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 transition-all"
            value={leadId || ''}
            onChange={handleLeadChange}
            aria-invalid={!leadId}
          >
            <option value="">Selecione um cliente...</option>
            {leads
              .filter(l => selectedCategory === 'all' || resolveLeadCanonicalNiche(l) === selectedCategory)
              .map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.city ? `· ${l.city}` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {currentLead && (
        <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-2">
          <h3 className="font-bold text-white mb-3">Resumo do Lead</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Nome</span>
            <span className="text-slate-200">{currentLead.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Nicho Canônico</span>
            <span className="text-slate-200 font-medium">{currentLeadCanonical || 'Ambíguo'}</span>
          </div>
          {currentLead.city && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Localização</span>
              <span className="text-slate-200">{currentLead.city}</span>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
