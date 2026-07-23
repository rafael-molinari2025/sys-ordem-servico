import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function limpar() {
  // Ordem respeita dependências de FK — permite rodar o seed várias vezes em dev sem erro.
  await prisma.orcamentoAutorizacao.deleteMany();
  await prisma.statusHistorico.deleteMany();
  await prisma.movimentacaoEstoque.deleteMany();
  await prisma.ordemServicoItem.deleteMany();
  await prisma.ordemServicoServico.deleteMany();
  await prisma.ordemServico.deleteMany();
  await prisma.peca.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();
}

async function main() {
  await limpar();

  const senhaAdmin = "admin123";
  const senhaAtendente = "atendente123";

  const admin = await prisma.usuario.create({
    data: {
      nome: "Administrador",
      email: "admin@empresa.com",
      senhaHash: await bcrypt.hash(senhaAdmin, 10),
      perfil: "ADMIN",
    },
  });

  await prisma.usuario.create({
    data: {
      nome: "Atendente",
      email: "atendente@empresa.com",
      senhaHash: await bcrypt.hash(senhaAtendente, 10),
      perfil: "ATENDENTE",
    },
  });

  const clientes = await Promise.all(
    [
      { nome: "Carlos Souza", telefone: "5511987654321" },
      { nome: "Maria Oliveira", telefone: "5511976543210" },
      { nome: "João Pereira", telefone: "5511965432109" },
      { nome: "Ana Costa", telefone: "5511954321098" },
      { nome: "Pedro Lima", telefone: "5511943210987" },
      { nome: "Juliana Alves", telefone: "5511932109876" },
    ].map((c) => prisma.cliente.create({ data: c }))
  );

  // Peças de segmentos variados — demonstra que o sistema não é preso a um único nicho.
  const pecasSeed = [
    { nome: "Tela LCD 15.6\"", sku: "TEL-156", quantidade: 8, precoCusto: 320, precoVenda: 480, estoqueMinimo: 3 },
    { nome: "Óleo de motor 1L", sku: "OLE-1L", quantidade: 20, precoCusto: 18, precoVenda: 32, estoqueMinimo: 5 },
    { nome: "Placa-mãe genérica", sku: "PLC-GEN", quantidade: 2, precoCusto: 250, precoVenda: 400, estoqueMinimo: 3 },
    { nome: "Filtro de ar", sku: "FLT-AR", quantidade: 15, precoCusto: 12, precoVenda: 25, estoqueMinimo: 5 },
    { nome: "Bateria 9V", sku: "BAT-9V", quantidade: 30, precoCusto: 4, precoVenda: 10, estoqueMinimo: 10 },
    { nome: "Correia dentada", sku: "COR-DEN", quantidade: 6, precoCusto: 45, precoVenda: 90, estoqueMinimo: 2 },
    { nome: "Ventoinha notebook", sku: "VEN-NB", quantidade: 1, precoCusto: 30, precoVenda: 60, estoqueMinimo: 3 },
    { nome: "Capacitor eletrolítico", sku: "CAP-ELE", quantidade: 50, precoCusto: 1, precoVenda: 3, estoqueMinimo: 10 },
    { nome: "Compressor ar-condicionado", sku: "CMP-AC", quantidade: 3, precoCusto: 480, precoVenda: 750, estoqueMinimo: 1 },
    { nome: "Vela de ignição", sku: "VEL-IGN", quantidade: 40, precoCusto: 8, precoVenda: 18, estoqueMinimo: 8 },
  ];
  const pecas = await Promise.all(pecasSeed.map((p) => prisma.peca.create({ data: p })));

  const servicosSeed = [
    { nome: "Diagnóstico técnico", descricao: "Avaliação inicial do problema", precoPadrao: 50 },
    { nome: "Troca de peça", descricao: "Mão de obra para substituição de componente", precoPadrao: 80 },
    { nome: "Limpeza/manutenção preventiva", descricao: "Limpeza geral e verificação", precoPadrao: 60 },
    { nome: "Instalação", descricao: "Instalação de equipamento/peça", precoPadrao: 100 },
    { nome: "Formatação/reinstalação de sistema", descricao: "Reinstalação de software/sistema operacional", precoPadrao: 70 },
    { nome: "Revisão geral", descricao: "Checklist completo de funcionamento", precoPadrao: 90 },
  ];
  const servicos = await Promise.all(servicosSeed.map((s) => prisma.servico.create({ data: s })));

  // OS 1 — Orçamento simples, ainda não enviado
  await prisma.ordemServico.create({
    data: {
      clienteId: clientes[0].id,
      itemDescricao: "Notebook Dell Inspiron",
      itemMarca: "Dell",
      itemModelo: "Inspiron 15",
      status: "ORCAMENTO",
      responsavelId: admin.id,
      itens: { create: [{ pecaId: pecas[6].id, quantidade: 1, precoUnitario: pecas[6].precoVenda }] },
      servicosRealizados: { create: [{ servicoId: servicos[0].id, valor: servicos[0].precoPadrao }] },
      historicoStatus: { create: [{ statusNovo: "ORCAMENTO", usuarioId: admin.id }] },
    },
  });

  // OS 2 — Aguardando aprovação, com token de autorização válido (imprime no console para teste manual)
  const os2 = await prisma.ordemServico.create({
    data: {
      clienteId: clientes[1].id,
      itemDescricao: "Ar-condicionado Split 9000 BTUs",
      itemMarca: "Consul",
      status: "AGUARDANDO_APROVACAO",
      responsavelId: admin.id,
      itens: { create: [{ pecaId: pecas[8].id, quantidade: 1, precoUnitario: pecas[8].precoVenda }] },
      servicosRealizados: {
        create: [
          { servicoId: servicos[0].id, valor: servicos[0].precoPadrao },
          { servicoId: servicos[3].id, valor: servicos[3].precoPadrao },
        ],
      },
      historicoStatus: {
        create: [
          { statusNovo: "ORCAMENTO", usuarioId: admin.id },
          { statusAnterior: "ORCAMENTO", statusNovo: "AGUARDANDO_APROVACAO", usuarioId: admin.id },
        ],
      },
    },
  });

  const tokenTeste = "teste-token-os2-aprovacao";
  await prisma.orcamentoAutorizacao.create({
    data: {
      ordemServicoId: os2.id,
      token: tokenTeste,
      expiraEm: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  // OS 3 — Em andamento (peça já consumida do estoque, com movimentação registrada)
  const os3 = await prisma.ordemServico.create({
    data: {
      clienteId: clientes[2].id,
      itemDescricao: "Carro Fiat Uno 2015",
      itemMarca: "Fiat",
      itemModelo: "Uno",
      status: "EM_ANDAMENTO",
      responsavelId: admin.id,
      itens: { create: [{ pecaId: pecas[1].id, quantidade: 2, precoUnitario: pecas[1].precoVenda }] },
      servicosRealizados: { create: [{ servicoId: servicos[1].id, valor: servicos[1].precoPadrao }] },
      historicoStatus: {
        create: [
          { statusNovo: "ORCAMENTO", usuarioId: admin.id },
          { statusAnterior: "ORCAMENTO", statusNovo: "AGUARDANDO_APROVACAO", usuarioId: admin.id },
          { statusAnterior: "AGUARDANDO_APROVACAO", statusNovo: "APROVADO", usuarioId: admin.id },
          { statusAnterior: "APROVADO", statusNovo: "EM_ANDAMENTO", usuarioId: admin.id },
        ],
      },
    },
  });
  await prisma.movimentacaoEstoque.create({
    data: {
      pecaId: pecas[1].id,
      tipo: "SAIDA",
      quantidade: 2,
      saldoApos: pecas[1].quantidade - 2,
      motivo: `Uso na OS #${os3.numero}`,
      ordemServicoId: os3.id,
      usuarioId: admin.id,
    },
  });
  await prisma.peca.update({ where: { id: pecas[1].id }, data: { quantidade: pecas[1].quantidade - 2 } });

  // OS 4 — Concluída e entregue
  await prisma.ordemServico.create({
    data: {
      clienteId: clientes[3].id,
      itemDescricao: "Celular Samsung Galaxy",
      itemMarca: "Samsung",
      status: "ENTREGUE",
      responsavelId: admin.id,
      dataConclusao: new Date(),
      dataEntrega: new Date(),
      servicosRealizados: { create: [{ servicoId: servicos[4].id, valor: servicos[4].precoPadrao }] },
      historicoStatus: {
        create: [
          { statusNovo: "ORCAMENTO", usuarioId: admin.id },
          { statusAnterior: "ORCAMENTO", statusNovo: "AGUARDANDO_APROVACAO", usuarioId: admin.id },
          { statusAnterior: "AGUARDANDO_APROVACAO", statusNovo: "APROVADO", usuarioId: admin.id },
          { statusAnterior: "APROVADO", statusNovo: "EM_ANDAMENTO", usuarioId: admin.id },
          { statusAnterior: "EM_ANDAMENTO", statusNovo: "CONCLUIDO", usuarioId: admin.id },
          { statusAnterior: "CONCLUIDO", statusNovo: "ENTREGUE", usuarioId: admin.id },
        ],
      },
    },
  });

  console.log("Seed concluído.");
  console.log(`Login Admin:     admin@empresa.com / ${senhaAdmin}`);
  console.log(`Login Atendente: atendente@empresa.com / ${senhaAtendente}`);
  console.log(`Token de autorização de teste (OS #${os2.numero}): ${tokenTeste}`);
  console.log(`Link de autorização (após Fase 3 estar pronta): {FRONTEND_URL}/autorizacao/${tokenTeste}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
