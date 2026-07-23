export enum PerfilUsuario {
  ADMIN = "ADMIN",
  ATENDENTE = "ATENDENTE",
}

export enum StatusOS {
  ORCAMENTO = "ORCAMENTO",
  AGUARDANDO_APROVACAO = "AGUARDANDO_APROVACAO",
  APROVADO = "APROVADO",
  RECUSADO = "RECUSADO",
  EM_ANDAMENTO = "EM_ANDAMENTO",
  CONCLUIDO = "CONCLUIDO",
  ENTREGUE = "ENTREGUE",
  CANCELADO = "CANCELADO",
}

export enum TipoMovimentacao {
  ENTRADA = "ENTRADA",
  SAIDA = "SAIDA",
  AJUSTE = "AJUSTE",
}

export enum DecisaoOrcamento {
  APROVADO = "APROVADO",
  RECUSADO = "RECUSADO",
}

/** Transições de status permitidas para a Ordem de Serviço. Fonte única usada por back e front. */
export const TRANSICOES_STATUS_OS: Record<StatusOS, StatusOS[]> = {
  [StatusOS.ORCAMENTO]: [StatusOS.AGUARDANDO_APROVACAO, StatusOS.CANCELADO],
  [StatusOS.AGUARDANDO_APROVACAO]: [StatusOS.APROVADO, StatusOS.RECUSADO, StatusOS.CANCELADO],
  [StatusOS.APROVADO]: [StatusOS.EM_ANDAMENTO, StatusOS.CANCELADO],
  [StatusOS.EM_ANDAMENTO]: [StatusOS.CONCLUIDO, StatusOS.CANCELADO],
  [StatusOS.CONCLUIDO]: [StatusOS.ENTREGUE],
  [StatusOS.ENTREGUE]: [],
  [StatusOS.RECUSADO]: [],
  [StatusOS.CANCELADO]: [],
};

export const STATUS_OS_LABEL: Record<StatusOS, string> = {
  [StatusOS.ORCAMENTO]: "Orçamento",
  [StatusOS.AGUARDANDO_APROVACAO]: "Aguardando Aprovação",
  [StatusOS.APROVADO]: "Aprovado",
  [StatusOS.RECUSADO]: "Recusado",
  [StatusOS.EM_ANDAMENTO]: "Em Andamento",
  [StatusOS.CONCLUIDO]: "Concluído",
  [StatusOS.ENTREGUE]: "Entregue",
  [StatusOS.CANCELADO]: "Cancelado",
};
