import { PerfilUsuario, StatusOS, TipoMovimentacao, DecisaoOrcamento } from "./enums";

export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  perfil: PerfilUsuario;
  ativo: boolean;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: UsuarioDTO;
}

export interface EsqueciSenhaRequest {
  email: string;
}

export interface RedefinirSenhaRequest {
  novaSenha: string;
}

export interface ValidarTokenRedefinicaoDTO {
  valido: boolean;
}

export interface ClienteDTO {
  id: string;
  nome: string;
  telefone: string;
  documento?: string | null;
  email?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  criadoEm: string;
}

export interface PecaDTO {
  id: string;
  nome: string;
  sku: string;
  quantidade: number;
  precoCusto?: number | null; // ausente para perfil ATENDENTE
  precoVenda: number;
  estoqueMinimo: number;
  fornecedor?: string | null;
  ativo: boolean;
}

export interface MovimentacaoEstoqueDTO {
  id: string;
  pecaId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  saldoApos: number;
  motivo?: string | null;
  ordemServicoId?: string | null;
  usuarioNome?: string | null;
  criadoEm: string;
}

export interface ServicoDTO {
  id: string;
  nome: string;
  descricao?: string | null;
  precoPadrao: number;
  ativo: boolean;
}

export interface OrdemServicoItemDTO {
  id: string;
  pecaId: string;
  pecaNome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface OrdemServicoServicoDTO {
  id: string;
  servicoId: string;
  servicoNome: string;
  valor: number;
  observacao?: string | null;
}

export interface TotaisOSDTO {
  totalPecas: number;
  totalServicos: number;
  subtotal: number;
  desconto: number;
  total: number;
}

export interface OrdemServicoDTO {
  id: string;
  numero: number;
  cliente: { id: string; nome: string; telefone: string };
  itemDescricao: string;
  itemMarca?: string | null;
  itemModelo?: string | null;
  itemNumeroSerie?: string | null;
  status: StatusOS;
  responsavelNome?: string | null;
  desconto: number;
  observacoes?: string | null;
  dataAbertura: string;
  dataPrevisao?: string | null;
  dataConclusao?: string | null;
  dataEntrega?: string | null;
  itens: OrdemServicoItemDTO[];
  servicosRealizados: OrdemServicoServicoDTO[];
  totais: TotaisOSDTO;
}

export interface AutorizacaoPublicaDTO {
  numero: number;
  clienteNome: string;
  itemDescricao: string;
  itens: { descricao: string; quantidade: number; valorUnitario: number }[];
  servicos: { descricao: string; valor: number }[];
  totais: TotaisOSDTO;
  status: StatusOS;
  decisao?: DecisaoOrcamento | null;
  decididoEm?: string | null;
  expirado: boolean;
}

export type WhatsappStatus = "DISCONNECTED" | "QR_PENDING" | "CONNECTED" | "AUTH_FAILED";

export interface EmpresaDTO {
  nome: string;
  logoUrl?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  cnpj?: string | null;
}

export interface ApiErrorBody {
  error: string;
  detalhe?: string;
}
