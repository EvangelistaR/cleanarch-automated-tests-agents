import { ErroNegocio } from "./ErroNegocio";

export class NumeroConta {
  readonly numero: string;

  constructor(numero: string) {
    if (!/^[0-9]{6}$/.test(numero)) {
      throw new ErroNegocio("CONTA_INVALIDA", "Número de conta deve possuir exatamente seis dígitos");
    }
    this.numero = numero;
  }
}
