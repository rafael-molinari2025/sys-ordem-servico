# Manual de Utilização

> Este manual também está disponível dentro do próprio sistema, no menu **Ajuda**.

## 1. Primeiro acesso

Usuários de teste criados pelo script de seed:

- **Administrador**: `admin@empresa.com` / `admin123`
- **Atendente**: `atendente@empresa.com` / `atendente123`

Troque essas senhas assim que possível no menu **Usuários** (disponível apenas para Administradores) — veja a seção 9.

## 2. Cadastro de Clientes

Menu **Clientes** — cadastre nome, telefone (o mesmo usado no WhatsApp, no formato `55DDDNÚMERO`, ex: `5511999999999`), documento (opcional), e-mail e observações. Use o campo de busca para localizar por nome, telefone ou documento.

## 3. Estoque de Peças

Menu **Estoque** — cadastre peças com nome, SKU (código único), preço de custo (visível apenas para Administradores), preço de venda e estoque mínimo. Peças abaixo do estoque mínimo aparecem destacadas em amarelo e também no Painel inicial.

Para dar entrada/saída/ajuste manual de estoque (ex: compra de fornecedor, perda, correção de contagem), use o botão **Movimentar** na linha da peça — todo o histórico fica registrado e pode ser consultado depois.

## 4. Catálogo de Serviços

Menu **Serviços** — cadastre os tipos de serviço oferecidos com um preço padrão, que poderá ser ajustado individualmente em cada Ordem de Serviço.

## 5. Ordem de Serviço (OS) — passo a passo

1. Menu **Ordens de Serviço → Nova OS**: escolha o cliente e descreva o item/equipamento atendido (campo livre — funciona para veículo, celular, notebook, ar-condicionado, ou qualquer outro segmento), com marca/modelo/nº de série opcionais.
2. Na tela da OS criada (status inicial **Orçamento**), adicione as **peças** usadas (o estoque é descontado automaticamente na hora, e devolvido automaticamente se você remover o item depois) e os **serviços** realizados (o valor padrão do catálogo vem pré-preenchido, mas pode ser ajustado nessa OS específica).
3. O **Total** é calculado automaticamente (peças + serviços − desconto). O desconto pode ser editado enquanto a OS estiver em um status editável.
4. Use o seletor **Mudar status** para avançar a OS pelo fluxo: Orçamento → Aguardando Aprovação → Aprovado/Recusado → Em Andamento → Concluído → Entregue (ou Cancelado, disponível a qualquer momento antes da entrega). O sistema só permite avançar para os próximos status válidos — não é possível pular etapas.
5. **Importante**: assim que a OS entra em "Aguardando Aprovação", os formulários de adicionar/remover peça e serviço somem — a lista fica travada até o cliente decidir (ou até um Admin/Atendente reverter manualmente, se necessário).

## 6. Gerando e enviando o orçamento (PDF)

Na tela da OS, o botão **Baixar PDF do orçamento** gera e abre o PDF na hora — ele já inclui o link de aprovação do cliente (veja a seção 7). Envie esse PDF manualmente pelo WhatsApp do seu próprio celular (ou por e-mail, se preferir); depois, use o seletor **Mudar status** na tela da OS para avançar para "Aguardando Aprovação".

O sistema não envia mensagens automaticamente — o envio automático por WhatsApp foi removido por depender de uma automação não-oficial do WhatsApp Web sujeita a bloqueios e quedas de conexão frequentes. Baixar e enviar manualmente é o fluxo padrão e sempre funciona.

## 7. Como o cliente aprova ou recusa o orçamento

O link enviado ao cliente abre uma página simples (sem necessidade de login) mostrando o resumo do orçamento — peças, serviços e total — com dois botões: **Aprovar** e **Recusar**. Ao clicar, é pedida uma confirmação para evitar toque acidental no celular.

Assim que o cliente decide, o status da OS já atualiza automaticamente no sistema (para "Aprovado" ou "Recusado") — não é preciso fazer nada manualmente. Se o cliente reabrir o mesmo link depois, ele só vê a confirmação da decisão já tomada (não é possível decidir duas vezes). Links têm validade de 15 dias.

## 8. Relatórios

Menu **Relatórios** — quatro relatórios em PDF, cada um com seus próprios filtros:

- **Ordens de Serviço**: lista de OS filtrável por período, status e/ou cliente, com o valor total de cada uma.
- **Estoque**: níveis atuais de todas as peças (com destaque para as abaixo do mínimo) e, se você informar um período, o histórico de movimentações nesse intervalo.
- **Histórico do Cliente**: todas as OS já feitas para um cliente específico — útil quando ele liga de novo.
- **Financeiro** (apenas Administrador): receita de peças e serviços num período, contando só OS que o cliente já aprovou (orçamentos recusados ou cancelados não entram na conta).

Em todos, basta preencher os filtros desejados (todos são opcionais, exceto o cliente no Histórico do Cliente) e clicar em **Baixar PDF** — o relatório abre em uma nova aba.

## 9. Gestão de usuários

Menu **Usuários** (apenas Administrador) — cadastre novos funcionários com nome, e-mail, senha e perfil (Administrador ou Atendente). Para editar um usuário existente, deixe o campo de senha em branco para mantê-la sem alterações. Usuários não são excluídos de verdade (para preservar o histórico de quem fez o quê) — o botão **Inativar** apenas bloqueia o login; não é possível inativar o próprio usuário logado.

## 10. Perfis de usuário

- **Administrador**: acesso completo, incluindo custos de peças, relatório financeiro e gestão de usuários.
- **Atendente**: uso operacional do dia a dia (clientes, estoque sem visão de custo, ordens de serviço, orçamentos, relatórios exceto o financeiro), sem acesso a informações financeiras sensíveis.
