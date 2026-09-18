import React from 'react';
import { WizardStep } from './types';

interface StepperIndicatorProps {
  currentStep: WizardStep;
}

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'lead', label: '1. Negócio' },
  { id: 'context', label: '2. Contexto' },
  { id: 'mode', label: '3. Como Gerar' },
  { id: 'review', label: '4. Revisão' }
];

export const StepperIndicator: React.FC<StepperIndicatorProps> = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <nav aria-label="Progresso da geração" className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        let statusClass = 'text-slate-500';
        let bgClass = 'bg-slate-800';
        
        if (isCompleted) {
          statusClass = 'text-indigo-400 font-bold';
          bgClass = 'bg-indigo-900/50 border border-indigo-700/50';
        } else if (isCurrent) {
          statusClass = 'text-white font-bold';
          bgClass = 'bg-indigo-600';
        }

        return (
          <div key={step.id} className="flex items-center min-w-max" aria-current={isCurrent ? 'step' : undefined}>
            <div className={`flex items-center justify-center px-3 py-1.5 rounded-full text-xs transition-colors ${bgClass} ${statusClass}`}>
              {step.label}
            </div>
            {index < STEPS.length - 1 && (
              <div className={`h-[1px] w-8 mx-2 lg:w-16 ${isCompleted ? 'bg-indigo-700/50' : 'bg-slate-700'}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </nav>
  );
};
