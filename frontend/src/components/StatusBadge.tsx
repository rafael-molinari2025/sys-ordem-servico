import { STATUS_OS_LABEL, StatusOS } from "shared";

const CORES: Record<StatusOS, string> = {
  [StatusOS.ORCAMENTO]: "bg-gray-500/15 text-gray-300",
  [StatusOS.AGUARDANDO_APROVACAO]: "bg-amber-500/15 text-amber-300",
  [StatusOS.APROVADO]: "bg-emerald-500/15 text-emerald-300",
  [StatusOS.RECUSADO]: "bg-red-500/15 text-red-300",
  [StatusOS.EM_ANDAMENTO]: "bg-blue-500/15 text-blue-300",
  [StatusOS.CONCLUIDO]: "bg-teal-500/15 text-teal-300",
  [StatusOS.ENTREGUE]: "bg-violet-500/15 text-violet-300",
  [StatusOS.CANCELADO]: "bg-red-500/10 text-red-400",
};

export function StatusBadge({ status }: { status: StatusOS }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${CORES[status]}`}>{STATUS_OS_LABEL[status]}</span>;
}
