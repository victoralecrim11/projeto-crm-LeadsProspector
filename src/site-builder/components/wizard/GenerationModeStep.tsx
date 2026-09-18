import React from 'react';
import { DraftFlowState } from './types';
import { ModelControls } from '../ModelControls';
import { CrmSettingsConfig as CrmSettings } from '../../../types';

interface GenerationModeStepProps {
  state: DraftFlowState;
  updateState: (partial: Partial<DraftFlowState>) => void;
  settings: CrmSettings;
}

export const GenerationModeStep: React.FC<GenerationModeStepProps> = ({ state, updateState, settings }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3" role="radiogroup" aria-label="Modo de geração">
        <label 
          className={`flex gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${state.generationMode === 'standard' ? 'bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-800/80'}`}
        >
          <input 
            type="radio" 
            name="generationMode" 
            value="standard" 
            checked={state.generationMode === 'standard'} 
            onChange={() => updateState({ generationMode: 'standard' })} 
            className="mt-1" 
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">✨ IA + Design Inteligente</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white">RECOMENDADO</span>
            </div>
            <span className="text-sm text-slate-300 mt-1">
              Cria um site completo com estrutura visual adaptada ao nicho, conteúdo por IA e mídia contextual. (Stitch On-Demand)
            </span>
          </div>
        </label>

        <label 
          className={`flex gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${state.generationMode === 'existing' ? 'bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-800/80'}`}
        >
          <input 
            type="radio" 
            name="generationMode" 
            value="existing" 
            checked={state.generationMode === 'existing'} 
            onChange={() => updateState({ generationMode: 'existing' })} 
            className="mt-1" 
          />
          <div className="flex flex-col">
            <span className="font-bold text-white">⚡ Gerador clássico</span>
            <span className="text-sm text-slate-300 mt-1">
              Mantém o fluxo tradicional do Site Builder com assistência de IA para conteúdo (Zero Stitch).
            </span>
          </div>
        </label>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <ModelControls
          settings={settings}
          value={state.selection}
          onChange={(selection) => updateState({ selection })}
          disabled={false}
        />
      </div>
    </div>
  );
};
