export class AppError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Registro não encontrado") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito de estado") {
    super(message, 409);
  }
}

export class EstoqueInsuficienteError extends ConflictError {
  constructor(nomePeca: string, disponivel: number) {
    super(`Estoque insuficiente para "${nomePeca}" — disponível: ${disponivel}`);
  }
}

export class TransicaoInvalidaError extends ConflictError {
  constructor(de: string, para: string) {
    super(`Não é possível mudar o status de "${de}" para "${para}"`);
  }
}

export class WhatsAppNaoConectadoError extends AppError {
  constructor() {
    super(
      "WhatsApp não está conectado. Peça para o administrador escanear o QR novamente em Configurações, ou baixe o PDF e envie manualmente.",
      503
    );
  }
}
