import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { ServicoDTO } from "shared";
import { apiErrorMessage } from "../../api/client";
import { atualizarServico, criarServico, listarServicos, removerServico } from "../../api/servicos.api";

const vazio = { nome: "", descricao: "", precoPadrao: 0 };
const inputClasses =
  "w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none";

export function ServicosListPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data: servicos, isLoading } = useQuery({ queryKey: ["servicos"], queryFn: () => listarServicos() });

  const salvar = useMutation({
    mutationFn: async () => {
      if (editandoId) return atualizarServico(editandoId, form);
      return criarServico(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      cancelarEdicao();
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível salvar o serviço")),
  });

  const remover = useMutation({
    mutationFn: (id: string) => removerServico(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servicos"] }),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível remover o serviço")),
  });

  function iniciarEdicao(servico: ServicoDTO) {
    setEditandoId(servico.id);
    setForm({ nome: servico.nome, descricao: servico.descricao ?? "", precoPadrao: servico.precoPadrao });
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Catálogo de Serviços</h1>
        <button
          onClick={() => (mostrarForm ? cancelarEdicao() : setMostrarForm(true))}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {mostrarForm ? "Cancelar" : "Novo Serviço"}
        </button>
      </div>

      {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-line bg-card p-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Nome *</label>
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClasses} />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-400">Preço padrão (R$) *</label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.precoPadrao}
              onChange={(e) => setForm({ ...form, precoPadrao: Number(e.target.value) })}
              className={inputClasses}
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-gray-400">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className={inputClasses}
              rows={2}
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

      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Preço padrão</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-600">
                  Carregando...
                </td>
              </tr>
            )}
            {servicos?.map((s) => (
              <tr key={s.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-gray-200">{s.nome}</td>
                <td className="px-4 py-3 text-gray-500">{s.descricao || "—"}</td>
                <td className="px-4 py-3">R$ {s.precoPadrao.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => iniciarEdicao(s)} className="mr-3 text-xs font-medium text-cyan-400 hover:text-cyan-300">
                    Editar
                  </button>
                  <button onClick={() => remover.mutate(s.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
