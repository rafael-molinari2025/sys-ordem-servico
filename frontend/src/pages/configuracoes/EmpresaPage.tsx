import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { apiErrorMessage } from "../../api/client";
import { atualizarEmpresa, obterEmpresa } from "../../api/empresa.api";
import { maskCnpj, maskTelefone } from "../../utils/masks";

const vazio = { nome: "", logoUrl: "", telefone: "", endereco: "", cnpj: "" };
const inputClasses =
  "w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none";
const TAMANHO_MAX_LOGO = 2 * 1024 * 1024; // 2MB — o arquivo vira base64 e é salvo direto no banco

function lerArquivoComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result as string);
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(arquivo);
  });
}

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

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErro("O logo precisa ser um arquivo de imagem.");
      return;
    }
    if (arquivo.size > TAMANHO_MAX_LOGO) {
      setErro("O logo precisa ter no máximo 2MB.");
      return;
    }
    setErro(null);
    const dataUrl = await lerArquivoComoDataUrl(arquivo);
    setForm((atual) => ({ ...atual, logoUrl: dataUrl }));
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-gray-100">Configurações</h1>
      <p className="mb-4 text-sm text-gray-500">Dados da empresa exibidos nos PDFs de orçamento e relatórios.</p>

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
            <label className="mb-1 block text-sm font-medium text-gray-400">Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-400 file:mr-3 file:rounded file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500"
            />
            {form.logoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img src={form.logoUrl} alt="Pré-visualização do logo" className="max-h-16 rounded border border-line bg-white p-1" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logoUrl: "" })}
                  className="text-xs font-medium text-red-400 hover:text-red-300"
                >
                  Remover logo
                </button>
              </div>
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
