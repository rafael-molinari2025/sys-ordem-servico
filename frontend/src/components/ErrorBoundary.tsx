import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  temErro: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { temErro: false };

  static getDerivedStateFromError(): State {
    return { temErro: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro não tratado na interface:", error, info.componentStack);
  }

  render() {
    if (this.state.temErro) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-app px-4">
          <div className="max-w-md rounded-lg border border-line bg-card p-6 text-center shadow-sm">
            <h1 className="mb-2 text-lg font-bold text-gray-100">Algo deu errado</h1>
            <p className="mb-4 text-sm text-gray-500">
              Ocorreu um erro inesperado nesta tela. Tente recarregar a página; se o problema continuar, entre em
              contato com o suporte.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
