import { useQuery } from "@tanstack/react-query";
import { getWhatsAppStatus } from "../../api/whatsapp.api";
import { ConfiguracoesTabs } from "./ConfiguracoesTabs";

const LABEL: Record<string, string> = {
  CONNECTED: "Conectado",
  QR_PENDING: "Aguardando leitura do QR Code",
  DISCONNECTED: "Desconectado",
  AUTH_FAILED: "Falha de autenticação",
};

const COR: Record<string, string> = {
  CONNECTED: "bg-emerald-500/15 text-emerald-300",
  QR_PENDING: "bg-amber-500/15 text-amber-300",
  DISCONNECTED: "bg-gray-500/15 text-gray-300",
  AUTH_FAILED: "bg-red-500/15 text-red-300",
};

export function WhatsappStatusPage() {
  const { data } = useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: getWhatsAppStatus,
    refetchInterval: 4000,
  });

  const status = data?.status ?? "DISCONNECTED";

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-gray-100">Configurações</h1>
      <p className="mb-4 text-sm text-gray-500">
        Conexão usada para enviar orçamentos automaticamente por WhatsApp (via whatsapp-web.js, não é a API oficial da
        Meta — veja o manual para detalhes sobre risco de bloqueio do número).
      </p>

      <ConfiguracoesTabs />

      <div className="rounded-lg border border-line bg-card p-6 text-center">
        <span className={`mb-4 inline-block rounded px-3 py-1 text-sm font-semibold ${COR[status]}`}>{LABEL[status]}</span>

        {status === "QR_PENDING" && data?.qr && (
          <div>
            <p className="mb-3 text-sm text-gray-400">
              Abra o WhatsApp no celular da empresa → Configurações → Aparelhos conectados → Conectar um aparelho, e
              escaneie o código abaixo.
            </p>
            <img src={data.qr} alt="QR Code do WhatsApp" className="mx-auto w-56 rounded border border-line" />
          </div>
        )}

        {status === "CONNECTED" && <p className="text-sm text-gray-500">Pronto para enviar orçamentos por WhatsApp.</p>}

        {status === "DISCONNECTED" && (
          <p className="text-sm text-gray-500">Aguardando o servidor gerar um novo QR Code. Atualize em alguns segundos.</p>
        )}

        {status === "AUTH_FAILED" && (
          <p className="text-sm text-red-400">
            A sessão falhou. Pode ser necessário remover a pasta de sessão salva no servidor e reiniciar o backend para
            gerar um novo QR Code.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300">
        <strong>Importante:</strong> mesmo com o WhatsApp desconectado, o orçamento em PDF sempre pode ser baixado
        manualmente na tela da Ordem de Serviço e enviado pelo próprio celular do atendente.
      </div>
    </div>
  );
}
