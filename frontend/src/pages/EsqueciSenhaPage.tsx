import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { apiErrorMessage } from "../api/client";
import { solicitarRedefinicao } from "../api/senha.api";

export function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await solicitarRedefinicao(email);
      setEnviado(true);
    } catch (err) {
      setErro(apiErrorMessage(err, "Não foi possível processar sua solicitação"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-card p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_3px_rgba(34,211,238,0.6)]" />
          <h1 className="text-center text-xl font-bold text-gray-100">Esqueci minha senha</h1>
        </div>

        {enviado ? (
          <div className="text-center">
            <p className="mb-6 text-sm text-gray-400">
              Se o e-mail existir e tiver um telefone cadastrado, você vai receber um link de redefinição pelo WhatsApp em
              instantes.
            </p>
            <Link to="/login" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mb-4 text-sm text-gray-400">
              Informe o e-mail da sua conta. Vamos enviar um link de redefinição pelo WhatsApp cadastrado.
            </p>
            {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}
            <label className="mb-1 block text-sm font-medium text-gray-400">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-6 w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none"
              placeholder="seu@email.com"
            />
            <button
              type="submit"
              disabled={enviando}
              className="mb-4 w-full rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Enviar link"}
            </button>
            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
