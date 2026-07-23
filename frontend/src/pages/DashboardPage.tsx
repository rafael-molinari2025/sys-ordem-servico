import { useQuery } from "@tanstack/react-query";
import { listarBaixoEstoque } from "../api/estoque.api";
import { useAuth } from "../auth/AuthContext";

export function DashboardPage() {
  const { usuario } = useAuth();
  const { data: baixoEstoque } = useQuery({ queryKey: ["pecas", "baixo-estoque"], queryFn: listarBaixoEstoque });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-100">Olá, {usuario?.nome}</h1>
      <p className="mb-6 text-sm text-gray-500">Painel geral do sistema.</p>

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="mb-3 font-semibold text-gray-200">Peças com estoque baixo</h2>
        {!baixoEstoque || baixoEstoque.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhuma peça abaixo do estoque mínimo.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {baixoEstoque.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-gray-200">{p.nome}</span>
                <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
                  {p.quantidade} / mín. {p.estoqueMinimo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
