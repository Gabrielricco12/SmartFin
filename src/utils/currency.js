/**
 * Converte valor em centavos (BigInt ou Number) para string formatada em BRL.
 * Ex: 15000 -> "R$ 150,00"
 */
export function formatBRL(amountInCents) {
  if (amountInCents === null || amountInCents === undefined) return 'R$ 0,00';
  
  const amount = Number(amountInCents) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}