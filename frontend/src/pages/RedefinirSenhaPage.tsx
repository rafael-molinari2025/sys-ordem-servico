import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiErrorMessage } from "../api/client";
import { redefinirSenha, validarTokenRedefinicao } from "../api/senha.api";

export function RedefinirSenhaPage() {
  const { token } = useParams<{ token: string }>();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["redefinir-senha", token],
    queryFn: () => validarTokenRedefinicao(token!),
    enabled: !!token,
    retry: false,
  });

  const redefinir = useMutation({
    mutationFn: () => redefinirSenha(token!, novaSenha),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível redefinir a senha")),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (novaSenha !== confirmacao) {
      setErro("As senhas não coincidem");
      return;
    }
    redefinir.mutate();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-card p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_3px_rgba(34,211,238,0.6)]" />
          <h1 className="text-center text-xl font-bold text-gray-100">Redefinir senha</h1>
        </div>

        {isLoading && <p className="text-center text-sm text-gray-600">Verificando link...</p>}

        {!isLoading && (isError || !data?.valido) && (
          <div className="text-center">
            <p className="mb-6 text-sm text-gray-400">Este link é inválido ou já expirou. Solicite um novo.</p>
            <Link to="/esqueci-senha" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
              Solicitar novo link
            </Link>
          </div>
        )}

        {!isLoading && data?.valido && !redefinir.isSuccess && (
          <form onSubmit={handleSubmit}>
            {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}
            <label className="mb-1 block text-sm font-medium text-gray-400">Nova senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="mb-4 w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none"
              placeholder="••••••••"
            />
            <label className="mb-1 block text-sm font-medium text-gray-400">Confirme a nova senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className="mb-6 w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none"
              placeholder="••••••••"
            />
            <button
              type="submit"
              disabled={redefinir.isPending}
              className="w-full rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {redefinir.isPending ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}

        {redefinir.isSuccess && (
          <div className="text-center">
            <p className="mb-6 text-sm text-emerald-400">Senha redefinida com sucesso!</p>
            <Link to="/login" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
              Ir para o login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
