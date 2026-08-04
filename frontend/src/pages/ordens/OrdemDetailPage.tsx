import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { STATUS_OS_LABEL, StatusOS, TRANSICOES_STATUS_OS } from "shared";
import { apiErrorMessage } from "../../api/client";
import { PageErrorFallback } from "../../components/PageErrorFallback";
import { listarPecas } from "../../api/estoque.api";
import {
  adicionarItem,
  adicionarServico,
  atualizarOrdem,
  buscarOrdem,
  mudarStatusOrdem,
  removerItem,
  removerServico,
} from "../../api/ordens.api";
import { baixarPdfOrcamento, enviarOrcamentoPorWhatsApp } from "../../api/orcamentos.api";
import { listarServicos } from "../../api/servicos.api";
import { StatusBadge } from "../../components/StatusBadge";

const STATUS_EDITAVEIS = [StatusOS.ORCAMENTO, StatusOS.APROVADO, StatusOS.EM_ANDAMENTO];
const inputSmClasses =
  "rounded border border-line bg-app px-2 py-1.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none";

export function OrdemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [itemForm, setItemForm] = useState({ pecaId: "", quantidade: 1 });
  const [servicoForm, setServicoForm] = useState({ servicoId: "", valor: "" });

  const {
    data: ordem,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["ordens", id],
    queryFn: () => buscarOrdem(id!),
    enabled: !!id,
  });
  const { data: pecas } = useQuery({ queryKey: ["pecas"], queryFn: () => listarPecas() });
  const { data: servicos } = useQuery({ queryKey: ["servicos"], queryFn: () => listarServicos() });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["ordens"] });
    queryClient.invalidateQueries({ queryKey: ["pecas"] });
  }

  const mudarStatus = useMutation({
    mutationFn: (status: StatusOS) => mudarStatusOrdem(id!, status),
    onSuccess: () => {
      invalidar();
      setNovoStatus("");
      setErro(null);
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível mudar o status")),
  });

  const salvarDesconto = useMutation({
    mutationFn: (valor: number) => atualizarOrdem(id!, { desconto: valor }),
    onSuccess: () => {
      invalidar();
      setErro(null);
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível salvar o desconto")),
  });

  const addItem = useMutation({
    mutationFn: () => adicionarItem(id!, { pecaId: itemForm.pecaId, quantidade: Number(itemForm.quantidade) }),
    onSuccess: () => {
      invalidar();
      setItemForm({ pecaId: "", quantidade: 1 });
      setErro(null);
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível adicionar a peça")),
  });

  const delItem = useMutation({
    mutationFn: (itemId: string) => removerItem(id!, itemId),
    onSuccess: () => invalidar(),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível remover a peça")),
  });

  const addServico = useMutation({
    mutationFn: () =>
      adicionarServico(id!, {
        servicoId: servicoForm.servicoId,
        valor: servicoForm.valor ? Number(servicoForm.valor) : undefined,
      }),
    onSuccess: () => {
      invalidar();
      setServicoForm({ servicoId: "", valor: "" });
      setErro(null);
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível adicionar o serviço")),
  });

  const delServico = useMutation({
    mutationFn: (servicoItemId: string) => removerServico(id!, servicoItemId),
    onSuccess: () => invalidar(),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível remover o serviço")),
  });

  const baixarPdf = useMutation({
    mutationFn: () => baixarPdfOrcamento(id!),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível gerar o PDF")),
  });

  const enviarWhatsApp = useMutation({
    mutationFn: () => enviarOrcamentoPorWhatsApp(id!),
    onSuccess: () => {
      invalidar();
      setErro(null);
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível enviar por WhatsApp")),
  });

  if (isLoading) {
    return <div className="text-gray-600">Carregando...</div>;
  }

  if (isError || !ordem) {
    return <PageErrorFallback mensagem="Não foi possível carregar esta ordem de serviço." onRetry={() => refetch()} />;
  }

  const podeEditar = STATUS_EDITAVEIS.includes(ordem.status);
  const proximosStatus = TRANSICOES_STATUS_OS[ordem.status];

  function handleStatusSubmit(e: FormEvent) {
    e.preventDefault();
    if (!novoStatus) return;
    if (!window.confirm(`Confirma mudar o status para "${STATUS_OS_LABEL[novoStatus as StatusOS]}"?`)) return;
    mudarStatus.mutate(novoStatus as StatusOS);
  }

  function handleItemSubmit(e: FormEvent) {
    e.preventDefault();
    if (!itemForm.pecaId) return;
    addItem.mutate();
  }

  function handleServicoSubmit(e: FormEvent) {
    e.preventDefault();
    if (!servicoForm.servicoId) return;
    addServico.mutate();
  }

  return (
    <div>
      <button onClick={() => navigate("/ordens")} className="mb-4 text-sm text-gray-500 hover:text-gray-300">
        ← Voltar para Ordens de Serviço
      </button>

      {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-lg border border-line bg-card p-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-100">OS #{ordem.numero}</h1>
            <StatusBadge status={ordem.status} />
          </div>
          <p className="mt-1 text-sm text-gray-400">
            <span className="font-medium">{ordem.cliente.nome}</span> — {ordem.cliente.telefone}
          </p>
          <p className="text-sm text-gray-400">
            {ordem.itemDescricao}
            {ordem.itemMarca && ` · ${ordem.itemMarca}`}
            {ordem.itemModelo && ` ${ordem.itemModelo}`}
            {ordem.itemNumeroSerie && ` · nº série ${ordem.itemNumeroSerie}`}
          </p>
          {ordem.responsavelNome && <p className="text-xs text-gray-600">Responsável: {ordem.responsavelNome}</p>}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => baixarPdf.mutate()}
              disabled={baixarPdf.isPending}
              className="rounded border border-line px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/5 disabled:opacity-50"
            >
              {baixarPdf.isPending ? "Gerando..." : "Baixar PDF do orçamento"}
            </button>
            <button
              onClick={() => enviarWhatsApp.mutate()}
              disabled={enviarWhatsApp.isPending}
              className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {enviarWhatsApp.isPending ? "Enviando..." : "Enviar orçamento por WhatsApp"}
            </button>
          </div>
        </div>

        {proximosStatus.length > 0 && (
          <form onSubmit={handleStatusSubmit} className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Mudar status</label>
              <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)} className={inputSmClasses}>
                <option value="">Selecione...</option>
                {proximosStatus.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_OS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!novoStatus || mudarStatus.isPending}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Confirmar
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="mb-3 font-semibold text-gray-200">Peças utilizadas</h2>
          <table className="mb-3 w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="py-1">Peça</th>
                <th className="py-1">Qtd</th>
                <th className="py-1">Preço</th>
                <th className="py-1">Subtotal</th>
                <th className="py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ordem.itens.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-gray-600">
                    Nenhuma peça adicionada.
                  </td>
                </tr>
              )}
              {ordem.itens.map((item) => (
                <tr key={item.id}>
                  <td className="py-2">{item.pecaNome}</td>
                  <td className="py-2">{item.quantidade}</td>
                  <td className="py-2">R$ {item.precoUnitario.toFixed(2)}</td>
                  <td className="py-2">R$ {(item.quantidade * item.precoUnitario).toFixed(2)}</td>
                  <td className="py-2 text-right">
                    {podeEditar && (
                      <button onClick={() => delItem.mutate(item.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {podeEditar && (
            <form onSubmit={handleItemSubmit} className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-400">Peça</label>
                <select
                  value={itemForm.pecaId}
                  onChange={(e) => setItemForm({ ...itemForm, pecaId: e.target.value })}
                  className={`w-full ${inputSmClasses}`}
                >
                  <option value="">Selecione...</option>
                  {pecas?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.sobEncomenda ? "sob encomenda" : `estoque: ${p.quantidade}`})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Qtd</label>
                <input
                  type="number"
                  min={1}
                  value={itemForm.quantidade}
                  onChange={(e) => setItemForm({ ...itemForm, quantidade: Number(e.target.value) })}
                  className={`w-20 ${inputSmClasses}`}
                />
              </div>
              <button
                type="submit"
                disabled={addItem.isPending}
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Adicionar
              </button>
            </form>
          )}
        </div>

        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="mb-3 font-semibold text-gray-200">Serviços realizados</h2>
          <table className="mb-3 w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="py-1">Serviço</th>
                <th className="py-1">Valor</th>
                <th className="py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ordem.servicosRealizados.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-center text-gray-600">
                    Nenhum serviço adicionado.
                  </td>
                </tr>
              )}
              {ordem.servicosRealizados.map((s) => (
                <tr key={s.id}>
                  <td className="py-2">{s.servicoNome}</td>
                  <td className="py-2">R$ {s.valor.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    {podeEditar && (
                      <button onClick={() => delServico.mutate(s.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {podeEditar && (
            <form onSubmit={handleServicoSubmit} className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-400">Serviço</label>
                <select
                  value={servicoForm.servicoId}
                  onChange={(e) => setServicoForm({ ...servicoForm, servicoId: e.target.value })}
                  className={`w-full ${inputSmClasses}`}
                >
                  <option value="">Selecione...</option>
                  {servicos?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} (R$ {s.precoPadrao.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Valor (opcional)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={servicoForm.valor}
                  onChange={(e) => setServicoForm({ ...servicoForm, valor: e.target.value })}
                  placeholder="Preço padrão"
                  className={`w-28 ${inputSmClasses}`}
                />
              </div>
              <button
                type="submit"
                disabled={addServico.isPending}
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Adicionar
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs rounded-lg border border-line bg-card p-5 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Peças</span>
            <span>R$ {ordem.totais.totalPecas.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Serviços</span>
            <span>R$ {ordem.totais.totalServicos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Subtotal</span>
            <span>R$ {ordem.totais.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-500">Desconto</span>
            {podeEditar ? (
              <input
                type="number"
                min={0}
                step="0.01"
                defaultValue={ordem.totais.desconto}
                onBlur={(e) => {
                  const valor = Number(e.target.value);
                  if (valor !== ordem.totais.desconto) salvarDesconto.mutate(valor);
                }}
                className={`w-24 text-right ${inputSmClasses}`}
              />
            ) : (
              <span>R$ {ordem.totais.desconto.toFixed(2)}</span>
            )}
          </div>
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold text-gray-100">
            <span>Total</span>
            <span>R$ {ordem.totais.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
