import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiErrorMessage } from "../api/client";

export function LoginPage() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) {
    const destino = (location.state as { from?: string })?.from ?? "/";
    return <Navigate to={destino} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email, senha);
      navigate("/", { replace: true });
    } catch (err) {
      setErro(apiErrorMessage(err, "E-mail ou senha inválidos"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-line bg-card p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_3px_rgba(34,211,238,0.6)]" />
          <h1 className="text-center text-xl font-bold text-gray-100">Ordem de Serviço</h1>
        </div>
        {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}
        <label className="mb-1 block text-sm font-medium text-gray-400">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none"
          placeholder="seu@email.com"
        />
        <label className="mb-1 block text-sm font-medium text-gray-400">Senha</label>
        <input
          type="password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="mb-6 w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none"
          placeholder="••••••••"
        />
        <button
          type="submit"
          disabled={enviando}
          className="mb-4 w-full rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
        <div className="text-center">
          <Link to="/esqueci-senha" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
            Esqueci minha senha
          </Link>
        </div>
      </form>
    </div>
  );
}
