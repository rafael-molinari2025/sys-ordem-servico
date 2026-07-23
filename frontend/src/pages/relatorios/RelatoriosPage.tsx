import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { PerfilUsuario, STATUS_OS_LABEL, StatusOS } from "shared";
import { apiErrorMessage } from "../../api/client";
import { listarClientes } from "../../api/clientes.api";
import {
  baixarRelatorioCliente,
  baixarRelatorioEstoque,
  baixarRelatorioFinanceiro,
  baixarRelatorioOS,
} from "../../api/relatorios.api";
import { useAuth } from "../../auth/AuthContext";

const inputSmClasses =
  "rounded border border-line bg-app px-2 py-1.5 text-sm text-gray-200 focus:border-cyan-400 focus:outline-none";

function CardRelatorio({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <h2 className="font-semibold text-gray-200">{titulo}</h2>
      <p className="mb-3 text-xs text-gray-500">{descricao}</p>
      {children}
    </div>
  );
}

export function RelatoriosPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === PerfilUsuario.ADMIN;
  const { data: clientes } = useQuery({ queryKey: ["clientes"], queryFn: () => listarClientes() });

  const [erro, setErro] = useState<string | null>(null);

  const [osFiltros, setOsFiltros] = useState({ inicio: "", fim: "", status: "" as StatusOS | "", clienteId: "" });
  const [financeiroFiltros, setFinanceiroFiltros] = useState({ inicio: "", fim: "" });
  const [estoqueFiltros, setEstoqueFiltros] = useState({ inicio: "", fim: "" });
  const [clienteSelecionado, setClienteSelecionado] = useState("");

  const relatorioOS = useMutation({
    mutationFn: () =>
      baixarRelatorioOS({
        inicio: osFiltros.inicio || undefined,
        fim: osFiltros.fim || undefined,
        status: osFiltros.status || undefined,
        clienteId: osFiltros.clienteId || undefined,
      }),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível gerar o relatório")),
  });

  const relatorioFinanceiro = useMutation({
    mutationFn: () =>
      baixarRelatorioFinanceiro({ inicio: financeiroFiltros.inicio || undefined, fim: financeiroFiltros.fim || undefined }),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível gerar o relatório")),
  });

  const relatorioEstoque = useMutation({
    mutationFn: () =>
      baixarRelatorioEstoque({ inicio: estoqueFiltros.inicio || undefined, fim: estoqueFiltros.fim || undefined }),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível gerar o relatório")),
  });

  const relatorioCliente = useMutation({
    mutationFn: () => baixarRelatorioCliente(clienteSelecionado),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível gerar o relatório")),
  });

  function handleSubmit(e: FormEvent, mutate: () => void) {
    e.preventDefault();
    setErro(null);
    mutate();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-100">Relatórios</h1>

      {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardRelatorio titulo="Ordens de Serviço" descricao="Lista de OS filtrada por período, status e/ou cliente.">
          <form onSubmit={(e) => handleSubmit(e, relatorioOS.mutate)} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">De</label>
              <input
                type="date"
                value={osFiltros.inicio}
                onChange={(e) => setOsFiltros({ ...osFiltros, inicio: e.target.value })}
                className={inputSmClasses}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Até</label>
              <input
                type="date"
                value={osFiltros.fim}
                onChange={(e) => setOsFiltros({ ...osFiltros, fim: e.target.value })}
                className={inputSmClasses}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Status</label>
              <select
                value={osFiltros.status}
                onChange={(e) => setOsFiltros({ ...osFiltros, status: e.target.value as StatusOS | "" })}
                className={inputSmClasses}
              >
                <option value="">Todos</option>
                {Object.values(StatusOS).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_OS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="mb-1 block text-xs font-medium text-gray-400">Cliente</label>
              <select
                value={osFiltros.clienteId}
                onChange={(e) => setOsFiltros({ ...osFiltros, clienteId: e.target.value })}
                className={`w-full ${inputSmClasses}`}
              >
                <option value="">Todos</option>
                {clientes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={relatorioOS.isPending}
              className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {relatorioOS.isPending ? "Gerando..." : "Baixar PDF"}
            </button>
          </form>
        </CardRelatorio>

        <CardRelatorio titulo="Estoque" descricao="Níveis atuais, alerta de estoque mínimo e movimentações no período (opcional).">
          <form onSubmit={(e) => handleSubmit(e, relatorioEstoque.mutate)} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Movimentações de</label>
              <input
                type="date"
                value={estoqueFiltros.inicio}
                onChange={(e) => setEstoqueFiltros({ ...estoqueFiltros, inicio: e.target.value })}
                className={inputSmClasses}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Até</label>
              <input
                type="date"
                value={estoqueFiltros.fim}
                onChange={(e) => setEstoqueFiltros({ ...estoqueFiltros, fim: e.target.value })}
                className={inputSmClasses}
              />
            </div>
            <button
              type="submit"
              disabled={relatorioEstoque.isPending}
              className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {relatorioEstoque.isPending ? "Gerando..." : "Baixar PDF"}
            </button>
          </form>
        </CardRelatorio>

        <CardRelatorio titulo="Histórico do Cliente" descricao="Todas as OS de um cliente específico, útil quando ele retorna.">
          <form onSubmit={(e) => handleSubmit(e, relatorioCliente.mutate)} className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-gray-400">Cliente</label>
              <select
                required
                value={clienteSelecionado}
                onChange={(e) => setClienteSelecionado(e.target.value)}
                className={`w-full ${inputSmClasses}`}
              >
                <option value="">Selecione...</option>
                {clientes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={relatorioCliente.isPending || !clienteSelecionado}
              className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {relatorioCliente.isPending ? "Gerando..." : "Baixar PDF"}
            </button>
          </form>
        </CardRelatorio>

        {isAdmin && (
          <CardRelatorio titulo="Financeiro" descricao="Receita de peças e serviços no período (apenas OS aprovadas pelo cliente).">
            <form onSubmit={(e) => handleSubmit(e, relatorioFinanceiro.mutate)} className="flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">De</label>
                <input
                  type="date"
                  value={financeiroFiltros.inicio}
                  onChange={(e) => setFinanceiroFiltros({ ...financeiroFiltros, inicio: e.target.value })}
                  className={inputSmClasses}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Até</label>
                <input
                  type="date"
                  value={financeiroFiltros.fim}
                  onChange={(e) => setFinanceiroFiltros({ ...financeiroFiltros, fim: e.target.value })}
                  className={inputSmClasses}
                />
              </div>
              <button
                type="submit"
                disabled={relatorioFinanceiro.isPending}
                className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {relatorioFinanceiro.isPending ? "Gerando..." : "Baixar PDF"}
              </button>
            </form>
          </CardRelatorio>
        )}
      </div>
    </div>
  );
}
