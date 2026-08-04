import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, FormEvent, useState } from "react";
import { PecaDTO, PerfilUsuario, TipoMovimentacao } from "shared";
import { apiErrorMessage } from "../../api/client";
import { atualizarPeca, criarMovimentacao, criarPeca, listarPecas, removerPeca } from "../../api/estoque.api";
import { useAuth } from "../../auth/AuthContext";

const vazio = {
  nome: "",
  sku: "",
  quantidade: 0,
  sobEncomenda: false,
  precoCusto: 0,
  precoVenda: 0,
  estoqueMinimo: 0,
  fornecedor: "",
};
const inputClasses =
  "w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none";
const inputSmClasses =
  "rounded border border-line bg-app px-2 py-1.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none";

export function PecasListPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === PerfilUsuario.ADMIN;
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [movimentandoId, setMovimentandoId] = useState<string | null>(null);
  const [movForm, setMovForm] = useState({ tipo: TipoMovimentacao.ENTRADA, quantidade: 1, motivo: "" });
  const [erro, setErro] = useState<string | null>(null);

  const { data: pecas, isLoading } = useQuery({ queryKey: ["pecas", busca], queryFn: () => listarPecas(busca || undefined) });

  const salvar = useMutation({
    mutationFn: async () => {
      if (editandoId) return atualizarPeca(editandoId, form);
      return criarPeca(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pecas"] });
      cancelarEdicao();
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível salvar a peça")),
  });

  const remover = useMutation({
    mutationFn: (id: string) => removerPeca(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pecas"] }),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível remover a peça")),
  });

  const movimentar = useMutation({
    mutationFn: (pecaId: string) => criarMovimentacao(pecaId, movForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pecas"] });
      setMovimentandoId(null);
      setMovForm({ tipo: TipoMovimentacao.ENTRADA, quantidade: 1, motivo: "" });
      setErro(null);
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível registrar a movimentação")),
  });

  function iniciarEdicao(peca: PecaDTO) {
    setEditandoId(peca.id);
    setForm({
      nome: peca.nome,
      sku: peca.sku,
      quantidade: peca.quantidade,
      sobEncomenda: peca.sobEncomenda,
      precoCusto: peca.precoCusto ?? 0,
      precoVenda: peca.precoVenda,
      estoqueMinimo: peca.estoqueMinimo,
      fornecedor: peca.fornecedor ?? "",
    });
    setMostrarForm(true);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(vazio);
    setMostrarForm(false);
    setErro(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    salvar.mutate();
  }

  function handleMovSubmit(e: FormEvent, pecaId: string) {
    e.preventDefault();
    movimentar.mutate(pecaId);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Estoque de Peças</h1>
        <button
          onClick={() => (mostrarForm ? cancelarEdicao() : setMostrarForm(true))}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {mostrarForm ? "Cancelar" : "Nova Peça"}
        </button>
      </div>

      {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-line bg-card p-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Nome *</label>
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClasses} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">SKU *</label>
            <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputClasses} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Quantidade inicial</label>
            <input
              type="number"
              min={0}
              value={form.quantidade}
              onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })}
              className={`${inputClasses} disabled:opacity-40`}
              disabled={!!editandoId || form.sobEncomenda}
              title={
                form.sobEncomenda
                  ? "Peças sob encomenda não têm controle de estoque"
                  : editandoId
                    ? "Use 'Movimentar' para alterar a quantidade"
                    : undefined
              }
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={form.sobEncomenda}
                onChange={(e) => setForm({ ...form, sobEncomenda: e.target.checked, quantidade: e.target.checked ? 0 : form.quantidade })}
              />
              Sob encomenda (sem controle de estoque)
            </label>
          </div>
          {isAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-400">Preço de custo (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.precoCusto}
                onChange={(e) => setForm({ ...form, precoCusto: Number(e.target.value) })}
                className={inputClasses}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Preço de venda (R$) *</label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.precoVenda}
              onChange={(e) => setForm({ ...form, precoVenda: Number(e.target.value) })}
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Estoque mínimo</label>
            <input
              type="number"
              min={0}
              value={form.estoqueMinimo}
              onChange={(e) => setForm({ ...form, estoqueMinimo: Number(e.target.value) })}
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Fornecedor</label>
            <input
              value={form.fornecedor}
              onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={salvar.isPending}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {salvar.isPending ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou SKU..."
          className={`max-w-sm ${inputClasses}`}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Quantidade</th>
              {isAdmin && <th className="px-4 py-3">Custo</th>}
              <th className="px-4 py-3">Venda</th>
              <th className="px-4 py-3"></th>
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
            {pecas?.map((p) => (
              <Fragment key={p.id}>
                <tr className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-gray-200">{p.nome}</td>
                  <td className="px-4 py-3">{p.sku}</td>
                  <td className="px-4 py-3">
                    {p.sobEncomenda ? (
                      <span className="rounded px-2 py-0.5 text-xs font-semibold bg-cyan-500/15 text-cyan-300">Sob encomenda</span>
                    ) : (
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          p.quantidade <= p.estoqueMinimo ? "bg-amber-500/15 text-amber-300" : "bg-gray-500/15 text-gray-300"
                        }`}
                      >
                        {p.quantidade}
                      </span>
                    )}
                  </td>
                  {isAdmin && <td className="px-4 py-3">R$ {p.precoCusto?.toFixed(2)}</td>}
                  <td className="px-4 py-3">R$ {p.precoVenda.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {!p.sobEncomenda && (
                      <button
                        onClick={() => setMovimentandoId(movimentandoId === p.id ? null : p.id)}
                        className="mr-3 text-xs font-medium text-cyan-400 hover:text-cyan-300"
                      >
                        Movimentar
                      </button>
                    )}
                    <button onClick={() => iniciarEdicao(p)} className="mr-3 text-xs font-medium text-cyan-400 hover:text-cyan-300">
                      Editar
                    </button>
                    <button onClick={() => remover.mutate(p.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                      Remover
                    </button>
                  </td>
                </tr>
                {movimentandoId === p.id && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="bg-white/5 px-4 py-3">
                      <form onSubmit={(e) => handleMovSubmit(e, p.id)} className="flex flex-wrap items-end gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-400">Tipo</label>
                          <select
                            value={movForm.tipo}
                            onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value as TipoMovimentacao })}
                            className={inputSmClasses}
                          >
                            <option value={TipoMovimentacao.ENTRADA}>Entrada</option>
                            <option value={TipoMovimentacao.SAIDA}>Saída</option>
                            <option value={TipoMovimentacao.AJUSTE}>Ajuste (variação)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-400">Quantidade</label>
                          <input
                            type="number"
                            value={movForm.quantidade}
                            onChange={(e) => setMovForm({ ...movForm, quantidade: Number(e.target.value) })}
                            className={`w-24 ${inputSmClasses}`}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-gray-400">Motivo</label>
                          <input
                            value={movForm.motivo}
                            onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
                            placeholder="Ex.: Compra fornecedor X"
                            className={`w-full ${inputSmClasses}`}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={movimentar.isPending}
                          className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
