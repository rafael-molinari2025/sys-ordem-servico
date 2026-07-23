import { EmpresaDTO } from "shared";

/** Layout HTML compartilhado por todos os documentos PDF (orçamentos e relatórios). */
export function wrapInLayout(titulo: string, bodyHtml: string, empresa: EmpresaDTO): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${titulo}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    color: #1e293b;
    margin: 0;
    font-size: 13px;
  }
  .cabecalho {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #1e293b;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .cabecalho .empresa { display: flex; align-items: center; gap: 10px; }
  .cabecalho img { max-height: 48px; }
  .cabecalho h1 { font-size: 18px; margin: 0; }
  .cabecalho .titulo-doc { text-align: right; }
  .cabecalho .titulo-doc h2 { margin: 0; font-size: 16px; }
  .cabecalho .titulo-doc span { color: #64748b; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { text-align: left; padding: 6px 8px; font-size: 12px; }
  thead th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; color: #64748b; }
  tbody tr { border-bottom: 1px solid #e2e8f0; }
  .secao { margin-bottom: 20px; }
  .secao h3 { font-size: 13px; text-transform: uppercase; color: #64748b; margin: 0 0 8px; }
  .totais { width: 260px; margin-left: auto; }
  .totais div { display: flex; justify-content: space-between; padding: 3px 0; }
  .totais .total { font-weight: bold; font-size: 15px; border-top: 1px solid #1e293b; margin-top: 6px; padding-top: 6px; }
  .rodape { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; }
  .info-cliente p { margin: 2px 0; }
</style>
</head>
<body>
  <div class="cabecalho">
    <div class="empresa">
      ${empresa.logoUrl ? `<img src="${empresa.logoUrl}" alt="Logo" />` : ""}
      <h1>${empresa.nome}</h1>
    </div>
    <div class="titulo-doc">${titulo}</div>
  </div>
  ${bodyHtml}
  <div class="rodape">Documento gerado automaticamente pelo sistema de Ordem de Serviço.</div>
</body>
</html>`;
}
