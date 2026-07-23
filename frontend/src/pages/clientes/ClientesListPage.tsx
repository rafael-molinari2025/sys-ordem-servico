import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { ClienteDTO } from "shared";
import { apiErrorMessage } from "../../api/client";
import { atualizarCliente, criarCliente, listarClientes, removerCliente } from "../../api/clientes.api";

const vazio = { nome: "", telefone: "", documento: "", email: "", endereco: "", observacoes: "" };
const inputClasses =
  "w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none";

export function ClientesListPage() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<typeof vazio>(vazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const { data: clientes, isLoading } = useQuery({
    queryKey: ["clientes", busca],
    queryFn: () => listarClientes(busca || undefined),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (editandoId) return atualizarCliente(editandoId, form);
      return criarCliente(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setForm(vazio);
      setEditandoId(null);
      setMostrarForm(false);
      setErro(null);
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível salvar o cliente")),
  });

  const remover = useMutation({
    mutationFn: (id: string) => removerCliente(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível remover o cliente")),
  });

  function iniciarEdicao(cliente: ClienteDTO) {
    setEditandoId(cliente.id);
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone,
      documento: cliente.documento ?? "",
      email: cliente.email ?? "",
      endereco: cliente.endereco ?? "",
      observacoes: cliente.observacoes ?? "",
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Clientes</h1>
        <button
          onClick={() => (mostrarForm ? cancelarEdicao() : setMostrarForm(true))}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {mostrarForm ? "Cancelar" : "Novo Cliente"}
        </button>
      </div>

      {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-line bg-card p-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Nome *</label>
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClasses} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Telefone (WhatsApp) *</label>
            <input
              required
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="5511999999999"
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Documento (CPF/CNPJ)</label>
            <input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} className={inputClasses} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-400">Endereço</label>
            <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className={inputClasses} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-400">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className={inputClasses}
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
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
          placeholder="Buscar por nome, telefone ou documento..."
          className={`max-w-sm ${inputClasses}`}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-600">
                  Carregando...
                </td>
              </tr>
            )}
            {clientes?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-600">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
            {clientes?.map((c) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-gray-200">{c.nome}</td>
                <td className="px-4 py-3">{c.telefone}</td>
                <td className="px-4 py-3">{c.documento || "—"}</td>
                <td className="px-4 py-3">{c.email || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => iniciarEdicao(c)} className="mr-3 text-xs font-medium text-cyan-400 hover:text-cyan-300">
                    Editar
                  </button>
                  <button onClick={() => remover.mutate(c.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
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
