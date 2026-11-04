import { Conta } from '../domain/Conta';

// Estado demonstrativo compartilhado (mesmo processo apenas; não é persistência).
// globalThis preserva a identidade da instância mesmo com recarga de módulos do Next.
const globalComContas = globalThis as typeof globalThis & {
  __contasDemonstracao?: Map<string, Conta>;
};

export const contasDemonstracao: Map<string, Conta> =
  (globalComContas.__contasDemonstracao ??= new Map<string, Conta>());
