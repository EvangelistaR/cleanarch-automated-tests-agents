import { ErroNegocio } from "./ErroNegocio";
import { NumeroConta } from "./NumeroConta";

export class Conta {
  public readonly numero: string;
  private _saldo: number;

  constructor(numero: string, saldoInicialEmCentavos: number) {
    this.numero = new NumeroConta(numero).numero;
    if (!Number.isSafeInteger(saldoInicialEmCentavos) || saldoInicialEmCentavos < 0) {
      throw new ErroNegocio("O saldo inicial deve ser um inteiro seguro maior ou igual a zero.");
    }
    this._saldo = saldoInicialEmCentavos;
  }

  get saldo(): number {
    return this._saldo;
  }

  sacar(valorEmCentavos: number): void {
    this.validarValorPositivo(valorEmCentavos);
    if (valorEmCentavos > this._saldo) {
      throw new ErroNegocio("Saldo insuficiente.");
    }
    this._saldo -= valorEmCentavos;
  }

  depositar(valorEmCentavos: number): void {
    this.validarValorPositivo(valorEmCentavos);
    if (valorEmCentavos > Number.MAX_SAFE_INTEGER - this._saldo) {
      throw new ErroNegocio("O depósito faria o saldo ultrapassar o limite seguro.");
    }
    this._saldo += valorEmCentavos;
  }

  private validarValorPositivo(valorEmCentavos: number): void {
    if (!Number.isSafeInteger(valorEmCentavos) || valorEmCentavos <= 0) {
      throw new ErroNegocio("O valor deve ser um inteiro seguro maior que zero.");
    }
  }
}
