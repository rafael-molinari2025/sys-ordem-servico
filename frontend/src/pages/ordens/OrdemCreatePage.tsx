import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarClientes } from "../../api/clientes.api";
import { apiErrorMessage } from "../../api/client";
import { criarOrdem } from "../../api/ordens.api";

const inputClasses =
  "w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none";

export function OrdemCreatePage() {
  const navigate = useNavigate();
  const { data: clientes } = useQuery({ queryKey: ["clientes"], queryFn: () => listarClientes() });

  const [form, setForm] = useState({
    clienteId: "",
    itemDescricao: "",
    itemMarca: "",
    itemModelo: "",
    itemNumeroSerie: "",
    observacoes: "",
    dataPrevisao: "",
  });
  const [erro, setErro] = useState<string | null>(null);

  const criar = useMutation({
    mutationFn: () => criarOrdem(form),
    onSuccess: (ordem) => navigate(`/ordens/${ordem.id}`),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível criar a ordem de serviço")),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    criar.mutate();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-100">Nova Ordem de Serviço</h1>

      <form onSubmit={handleSubmit} className="grid max-w-2xl grid-cols-1 gap-3 rounded-lg border border-line bg-card p-5 md:grid-cols-2">
        {erro && <div className="col-span-full rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-400">Cliente *</label>
          <select
            required
            value={form.clienteId}
            onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
            className={inputClasses}
          >
            <option value="">Selecione um cliente...</option>
            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {c.telefone}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-400">Item / Equipamento *</label>
          <input
            required
            value={form.itemDescricao}
            onChange={(e) => setForm({ ...form, itemDescricao: e.target.value })}
            placeholder="Ex.: Notebook Dell, Carro Fiat Uno, Ar-condicionado Split..."
            className={inputClasses}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">Marca</label>
          <input value={form.itemMarca} onChange={(e) => setForm({ ...form, itemMarca: e.target.value })} className={inputClasses} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">Modelo</label>
          <input value={form.itemModelo} onChange={(e) => setForm({ ...form, itemModelo: e.target.value })} className={inputClasses} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">Nº de série</label>
          <input
            value={form.itemNumeroSerie}
            onChange={(e) => setForm({ ...form, itemNumeroSerie: e.target.value })}
            className={inputClasses}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">Previsão de conclusão</label>
          <input
            type="date"
            value={form.dataPrevisao}
            onChange={(e) => setForm({ ...form, dataPrevisao: e.target.value })}
            className={inputClasses}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-400">Observações</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            rows={3}
            className={inputClasses}
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={criar.isPending}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {criar.isPending ? "Criando..." : "Criar Ordem de Serviço"}
          </button>
        </div>
      </form>
    </div>
  );
}
