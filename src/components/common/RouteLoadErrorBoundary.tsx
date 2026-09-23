import React from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { clearLazyRouteRecoveryState, isRecoverableLazyRouteError } from './lazyRoute';

interface RouteLoadErrorBoundaryProps {
  children: React.ReactNode;
}
interface RouteLoadErrorBoundaryState {
  error: unknown | null;
}

export class RouteLoadErrorBoundary extends React.Component<
  RouteLoadErrorBoundaryProps,
  RouteLoadErrorBoundaryState
> {
  state: RouteLoadErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): RouteLoadErrorBoundaryState {
    return { error };
  }

  private reload = () => {
    clearLazyRouteRecoveryState();
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const staleModule = isRecoverableLazyRouteError(this.state.error);

    return (
      <section
        className="mx-auto flex min-h-[420px] max-w-2xl flex-col items-center justify-center rounded-3xl border border-slate-700/80 bg-slate-900/80 px-6 py-12 text-center shadow-2xl"
        role="alert"
      >
        <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
          <TriangleAlert aria-hidden="true" size={28} />
        </span>
        <h1 className="text-2xl font-bold text-white">
          {staleModule ? 'A aplicação foi atualizada' : 'Não foi possível abrir esta tela'}
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
          {staleModule
            ? 'Atualize a página para carregar a versão mais recente.'
            : 'Recarregue a aplicação. Se o problema continuar, tente novamente em alguns instantes.'}
        </p>
        <button
          type="button"
          onClick={this.reload}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          <RefreshCw aria-hidden="true" size={18} />
          Atualizar aplicação
        </button>
      </section>
    );
  }
}
