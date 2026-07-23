import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { DecisaoOrcamento } from "shared";
import { apiErrorMessage } from "../../api/client";
import { buscarAutorizacao, decidirAutorizacao } from "../../api/autorizacao.api";

export function OrcamentoAutorizacaoPage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["autorizacao", token],
    queryFn: () => buscarAutorizacao(token!),
    enabled: !!token,
    retry: false,
  });

  const decidir = useMutation({
    mutationFn: (decisao: DecisaoOrcamento) => decidirAutorizacao(token!, decisao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autorizacao", token] });
      setErro(null);
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível registrar sua decisão")),
  });

  function handleDecisao(decisao: DecisaoOrcamento) {
    const texto = decisao === DecisaoOrcamento.APROVADO ? "aprovar" : "recusar";
    if (!window.confirm(`Tem certeza que deseja ${texto} este orçamento?`)) return;
    decidir.mutate(decisao);
  }

  if (isLoading) {
    return <div className="rounded-lg border border-line bg-card p-8 text-center text-gray-600 shadow-lg">Carregando orçamento...</div>;
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-line bg-card p-8 text-center shadow-lg">
        <h1 className="mb-2 text-lg font-bold text-gray-100">Link inválido</h1>
        <p className="text-sm text-gray-500">Este link de autorização não existe ou não é mais válido.</p>
      </div>
    );
  }

  if (data.expirado) {
    return (
      <div className="rounded-lg border border-line bg-card p-8 text-center shadow-lg">
        <h1 className="mb-2 text-lg font-bold text-gray-100">Link expirado</h1>
        <p className="text-sm text-gray-500">Este link de autorização expirou. Entre em contato para receber um novo orçamento.</p>
      </div>
    );
  }

  if (data.decisao) {
    const aprovado = data.decisao === DecisaoOrcamento.APROVADO;
    return (
      <div className="rounded-lg border border-line bg-card p-8 text-center shadow-lg">
        <h1 className={`mb-2 text-lg font-bold ${aprovado ? "text-emerald-400" : "text-red-400"}`}>
          {aprovado ? "Orçamento aprovado!" : "Orçamento recusado"}
        </h1>
        <p className="text-sm text-gray-500">
          {aprovado ? "Obrigado! Entraremos em contato para dar andamento ao serviço." : "Você recusou este orçamento."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-card p-6 shadow-lg">
      <h1 className="mb-1 text-lg font-bold text-gray-100">Orçamento — OS #{data.numero}</h1>
      <p className="mb-4 text-sm text-gray-500">
        {data.clienteNome} — {data.itemDescricao}
      </p>

      {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}

      {data.itens.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-1 text-xs font-semibold uppercase text-gray-600">Peças</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {data.itens.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-1">{i.descricao}</td>
                  <td className="py-1 text-right">{i.quantidade}x</td>
                  <td className="py-1 text-right">R$ {i.valorUnitario.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.servicos.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-1 text-xs font-semibold uppercase text-gray-600">Serviços</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {data.servicos.map((s, idx) => (
                <tr key={idx}>
                  <td className="py-1">{s.descricao}</td>
                  <td className="py-1 text-right">R$ {s.valor.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-6 flex justify-between border-t border-line pt-3 text-base font-bold text-gray-100">
        <span>Total</span>
        <span>R$ {data.totais.total.toFixed(2)}</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleDecisao(DecisaoOrcamento.RECUSADO)}
          disabled={decidir.isPending}
          className="flex-1 rounded border border-red-500/30 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          Recusar
        </button>
        <button
          onClick={() => handleDecisao(DecisaoOrcamento.APROVADO)}
          disabled={decidir.isPending}
          className="flex-1 rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Aprovar
        </button>
      </div>
    </div>
  );
}
