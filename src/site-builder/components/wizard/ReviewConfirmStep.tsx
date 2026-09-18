import React from 'react';
import { DraftFlowState } from './types';
import { Lead } from '../../../types';
import { getLeadCategory } from '../../leadSource';

interface ReviewConfirmStepProps {
  state: DraftFlowState;
  lead: Lead;
}

export const ReviewConfirmStep: React.FC<ReviewConfirmStepProps> = ({ state, lead }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <h3 className="font-bold text-white flex items-center gap-2">
            <span>Resumo da Configuração</span>
          </h3>
        </div>
        
        <dl className="divide-y divide-slate-700/50">
          <div className="p-4 grid grid-cols-3 gap-4">
            <dt className="text-slate-400 font-medium">Lead</dt>
            <dd className="text-white col-span-2 font-medium">{lead.name}</dd>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            <dt className="text-slate-400 font-medium">Nicho Canônico</dt>
            <dd className="text-white col-span-2">{getLeadCategory(lead) || 'Ambíguo'}</dd>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            <dt className="text-slate-400 font-medium">Tipo do Site</dt>
            <dd className="text-white col-span-2">
              {state.prefs.siteType === 'landing-page' ? 'Landing Page' : 'Site Institucional'}
            </dd>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            <dt className="text-slate-400 font-medium">Modo de Geração</dt>
            <dd className="text-white col-span-2">
              {state.generationMode === 'standard' ? 'IA + Design Inteligente (Stitch)' : 'Gerador Clássico'}
            </dd>
          </div>
          {state.selection.mode === 'explicit' && state.selection.modelId && (
            <div className="p-4 grid grid-cols-3 gap-4">
              <dt className="text-slate-400 font-medium">Modelo de IA</dt>
              <dd className="text-white col-span-2">{state.selection.modelId}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="p-4 bg-indigo-900/20 border border-indigo-700/50 rounded-xl text-sm text-indigo-200">
        <p>
          Tudo certo? Ao confirmar, o sistema iniciará a produção do site. 
          {state.generationMode === 'standard' && ' O design será adaptado no servidor utilizando o motor Stitch.'}
        </p>
      </div>
    </div>
  );
};
