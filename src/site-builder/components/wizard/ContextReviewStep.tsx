import React from 'react';
import { DraftFlowState } from './types';
import { Lead } from '../../../types';
import { getLeadCategory } from '../../leadSource';

interface ContextReviewStepProps {
  state: DraftFlowState;
  updateState: (partial: Partial<DraftFlowState>) => void;
  lead: Lead;
}

export const ContextReviewStep: React.FC<ContextReviewStepProps> = ({ state, updateState, lead }) => {
  const canonicalNiche = getLeadCategory(lead);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-900/20 border border-indigo-700/50 rounded-xl mb-6">
        <h3 className="font-bold text-indigo-300 mb-1 text-sm uppercase tracking-wide">Contexto Base</h3>
        <p className="text-slate-200">
          O design e o conteúdo serão otimizados para o nicho de <strong className="text-white">{canonicalNiche}</strong>.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block font-medium">Finalidade do Site</span>
        <select
          className="block w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          value={state.prefs.siteType}
          onChange={(e) => updateState({ prefs: { ...state.prefs, siteType: e.target.value as any } })}
        >
          <option value="landing-page">Landing Page (Foco em conversão única)</option>
          <option value="institutional">Site Institucional (Múltiplas seções/serviços)</option>
        </select>
      </label>
    </div>
  );
};
