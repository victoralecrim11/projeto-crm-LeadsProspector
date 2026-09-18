import React from 'react';

interface ProductionProgressStepProps {
  status: string;
  stage?: string;
}

export const ProductionProgressStep: React.FC<ProductionProgressStepProps> = ({ status, stage }) => {
  const getStatusDisplay = (s: string, stg?: string) => {
    // If we have a specific stage, use it first for more granular UI feedback
    if (stg) {
      switch (stg) {
        case 'MCP_HEALTHCHECK':
          return { label: 'Verificando serviço de design...', icon: '🔍', desc: 'Conectando ao provedor de design visual.' };
        case 'PROJECT_CREATING':
          return { label: 'Preparando projeto de design...', icon: '📁', desc: 'Criando estrutura inicial.' };
        case 'MOBILE_GENERATING':
          return { label: 'Criando direção visual mobile...', icon: '📱', desc: 'Gerando layout base para dispositivos móveis.' };
        case 'MOBILE_RANKING':
          return { label: 'Selecionando a melhor direção visual...', icon: '🏆', desc: 'Avaliando candidatos e escolhendo o melhor design.' };
        case 'DESKTOP_GENERATING':
          return { label: 'Adaptando o design para desktop...', icon: '💻', desc: 'Expandindo estrutura para telas grandes.' };
        case 'COHERENCE_VALIDATING':
          return { label: 'Validando a consistência responsiva...', icon: '✅', desc: 'Garantindo alinhamento visual entre telas.' };
      }
    }
    
    // Fallback to coarse status
    switch (s) {
      case 'PENDING':
        return { label: 'Preparando design...', icon: '⏳', desc: 'Iniciando produção baseada no nicho.' };
      case 'MOBILE_GENERATING':
        return { label: 'Criando direção visual...', icon: '📱', desc: 'Gerando layout base para dispositivos móveis.' };
      case 'DESKTOP_GENERATING':
        return { label: 'Adaptando design responsivo...', icon: '💻', desc: 'Expandindo estrutura para telas grandes.' };
      case 'PAIRED':
        return { label: 'Design visual concluído.', icon: '🎨', desc: 'Estrutura finalizada, montando o projeto final.' };
      case 'GENERATING_CONTENT':
        return { label: 'Analisando referências e criando site...', icon: '📝', desc: 'O motor de IA está estruturando o conteúdo do site.' };
      case 'SAVING_PROJECT':
        return { label: 'Finalizando projeto...', icon: '💾', desc: 'Montando o blueprint final e salvando o rascunho.' };
      default:
        return { label: 'Processando...', icon: '⚡', desc: 'Aguarde um momento.' };
    }
  };

  const display = getStatusDisplay(status, stage);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
      <div className="relative flex items-center justify-center w-20 h-20 bg-indigo-900/30 border border-indigo-500/50 rounded-2xl animate-pulse">
        <span className="text-4xl" aria-hidden="true">{display.icon}</span>
      </div>
      
      <div className="space-y-2" aria-live="polite">
        <h3 className="text-xl font-bold text-white">{display.label}</h3>
        <p className="text-slate-300 max-w-sm mx-auto">{display.desc}</p>
      </div>

      <div className="w-full max-w-xs mt-6">
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 w-full animate-progress origin-left"></div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); transform-origin: left; }
          50% { transform: scaleX(1); transform-origin: left; }
          50.1% { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
