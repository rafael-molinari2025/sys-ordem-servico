import { Decimal } from "@prisma/client/runtime/library";

type DecimalInput = Decimal | number | string;

/** Converte Decimal/Prisma para number com 2 casas — usar apenas na borda de saída (JSON), nunca em cálculos internos. */
export function toMoneyNumber(value: DecimalInput): number {
  const decimal = value instanceof Decimal ? value : new Decimal(value);
  return decimal.toDecimalPlaces(2).toNumber();
}

/** Soma uma lista de valores monetários com precisão decimal exata. */
export function sumMoney(values: DecimalInput[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(v instanceof Decimal ? v : new Decimal(v)), new Decimal(0));
}
