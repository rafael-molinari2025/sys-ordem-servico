import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { STATUS_OS_LABEL, StatusOS } from "shared";
import { listarOrdens } from "../../api/ordens.api";
import { StatusBadge } from "../../components/StatusBadge";

export function OrdensListPage() {
  const [status, setStatus] = useState<StatusOS | "">("");

  const { data: ordens, isLoading } = useQuery({
    queryKey: ["ordens", status],
    queryFn: () => listarOrdens(status ? { status } : undefined),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Ordens de Serviço</h1>
        <Link to="/ordens/nova" className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Nova OS
        </Link>
      </div>

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusOS | "")}
          className="rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 focus:border-cyan-400 focus:outline-none"
        >
          <option value="">Todos os status</option>
          {Object.values(StatusOS).map((s) => (
            <option key={s} value={s}>
              {STATUS_OS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">OS</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Abertura</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-600">
                  Carregando...
                </td>
              </tr>
            )}
            {ordens?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-600">
                  Nenhuma ordem de serviço encontrada.
                </td>
              </tr>
            )}
            {ordens?.map((o) => (
              <tr key={o.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link to={`/ordens/${o.id}`} className="font-medium text-cyan-400 hover:text-cyan-300">
                    #{o.numero}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.cliente.nome}</td>
                <td className="px-4 py-3">{o.itemDescricao}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">R$ {o.totais.total.toFixed(2)}</td>
                <td className="px-4 py-3">{new Date(o.dataAbertura).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
