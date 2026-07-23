import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { apiErrorMessage } from "../../api/client";
import { atualizarEmpresa, obterEmpresa } from "../../api/empresa.api";
import { maskCnpj, maskTelefone } from "../../utils/masks";
import { ConfiguracoesTabs } from "./ConfiguracoesTabs";

const vazio = { nome: "", logoUrl: "", telefone: "", endereco: "", cnpj: "" };
const inputClasses =
  "w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none";

export function EmpresaPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const { data: empresa, isLoading } = useQuery({ queryKey: ["empresa"], queryFn: obterEmpresa });

  useEffect(() => {
    if (empresa) {
      setForm({
        nome: empresa.nome,
        logoUrl: empresa.logoUrl ?? "",
        telefone: maskTelefone(empresa.telefone ?? ""),
        endereco: empresa.endereco ?? "",
        cnpj: maskCnpj(empresa.cnpj ?? ""),
      });
    }
  }, [empresa]);

  const salvar = useMutation({
    mutationFn: () => atualizarEmpresa(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa"] });
      setErro(null);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível salvar os dados da empresa")),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSucesso(false);
    salvar.mutate();
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-gray-100">Configurações</h1>
      <p className="mb-4 text-sm text-gray-500">Dados da empresa exibidos nos PDFs de orçamento e relatórios.</p>

      <ConfiguracoesTabs />

      {isLoading ? (
        <p className="text-sm text-gray-600">Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-card p-5">
          {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}
          {sucesso && (
            <div className="mb-4 rounded border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              Dados salvos com sucesso.
            </div>
          )}

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-400">Nome da empresa *</label>
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClasses} />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-400">URL do logo</label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://..."
              className={inputClasses}
            />
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Pré-visualização do logo" className="mt-2 max-h-16 rounded border border-line bg-white p-1" />
            )}
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-400">Telefone</label>
            <input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: maskTelefone(e.target.value) })}
              placeholder="(11) 99999-9999"
              className={inputClasses}
            />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-400">Endereço</label>
            <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className={inputClasses} />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-400">CNPJ</label>
            <input
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: maskCnpj(e.target.value) })}
              placeholder="00.000.000/0000-00"
              className={inputClasses}
            />
          </div>

          <button
            type="submit"
            disabled={salvar.isPending}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {salvar.isPending ? "Salvando..." : "Salvar"}
          </button>
        </form>
      )}
    </div>
  );
}
