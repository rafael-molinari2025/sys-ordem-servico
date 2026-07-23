interface Props {
  mensagem?: string;
  onRetry: () => void;
}

/** Estado de erro para telas que dependem de um único fetch inicial (ex.: detalhe por id). */
export function PageErrorFallback({ mensagem = "Não foi possível carregar os dados.", onRetry }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
      <p className="text-sm text-red-300">{mensagem}</p>
      <button
        onClick={onRetry}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Tentar novamente
      </button>
    </div>
  );
}
