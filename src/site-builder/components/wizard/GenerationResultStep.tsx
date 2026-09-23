import React from 'react';

interface GenerationResultStepProps {
  phase: 'completed' | 'failed';
  error?: string;
  fallbackUsed?: boolean;
  partialDesign?: boolean;
  mediaPending?: boolean;
  projectId?: string;
  onOpenEditor: () => void;
  onRetry: () => void;
  onReviewConfig: () => void;
}

export const GenerationResultStep: React.FC<GenerationResultStepProps> = ({
  phase,
  error,
  fallbackUsed = false,
  partialDesign = false,
  mediaPending = false,
  onOpenEditor,
  onRetry,
  onReviewConfig
}) => {
  const isSuccess = phase === 'completed';

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
      <div className={`flex items-center justify-center w-20 h-20 rounded-full ${isSuccess ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/50' : 'bg-rose-900/30 text-rose-400 border border-rose-500/50'}`}>
        <span className="text-4xl" aria-hidden="true">{isSuccess ? (fallbackUsed ? '!' : '✓') : '✕'}</span>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">
          {isSuccess ? (fallbackUsed ? 'Rascunho salvo sem IA' : 'Site criado para revisão') : 'Falha ao gerar o site'}
        </h3>
        <p className="text-slate-300 max-w-sm mx-auto">
          {isSuccess
            ? (fallbackUsed ? 'A geração por IA não foi concluída. Salvamos uma versão básica para revisão; ela não comprova a reprodução do design Stitch.' : 'O projeto foi criado, salvo no CRM e está pronto para revisão no Editor Visual avançado.')
            : error || 'Ocorreu um erro inesperado durante a produção do site.'}
        </p>
      </div>

      {isSuccess && partialDesign && <p className="text-amber-300 max-w-sm">A versão desktop do design não ficou disponível. O site usa a referência mobile adaptada; revise os dois tamanhos.</p>}
      {isSuccess && mediaPending && <p className="text-amber-300 max-w-sm">Abra o Editor Visual para buscar as imagens automaticamente. Revise e aprove cada imagem antes de exportar.</p>}
      <div className="flex flex-col w-full max-w-xs gap-3 mt-6">
        {isSuccess ? (
          <button
            onClick={onOpenEditor}
            className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
          >
            ✨ Abrir Editor Visual
          </button>
        ) : (
          <>
            <button
              onClick={onRetry}
              className="w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={onReviewConfig}
              className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              Revisar Configurações
            </button>
          </>
        )}
      </div>
    </div>
  );
};
