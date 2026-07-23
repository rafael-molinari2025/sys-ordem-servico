/** Aceita o valor digitado (com ou sem máscara) e reaplica a máscara (XX) XXXXX-XXXX / (XX) XXXX-XXXX. */
export function maskTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  const ddd = digitos.slice(0, 2);
  const celular = digitos.length > 10;
  const meio = celular ? digitos.slice(2, 7) : digitos.slice(2, 6);
  const fim = celular ? digitos.slice(7, 11) : digitos.slice(6, 10);

  let saida = "";
  if (ddd) saida += `(${ddd}`;
  if (ddd.length === 2) saida += ") ";
  if (meio) saida += meio;
  if (fim) saida += `-${fim}`;
  return saida;
}

/** Aceita o valor digitado (com ou sem máscara) e reaplica a máscara XX.XXX.XXX/XXXX-XX. */
export function maskCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 14);

  let saida = digitos.slice(0, 2);
  if (digitos.length > 2) saida += `.${digitos.slice(2, 5)}`;
  if (digitos.length > 5) saida += `.${digitos.slice(5, 8)}`;
  if (digitos.length > 8) saida += `/${digitos.slice(8, 12)}`;
  if (digitos.length > 12) saida += `-${digitos.slice(12, 14)}`;
  return saida;
}
