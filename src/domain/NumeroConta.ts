import { ErroNegocio } from "./ErroNegocio";

export class NumeroConta {
  public readonly numero: string;

  constructor(numero: string) {
    if (!/^[0-9]{6}$/.test(numero)) {
      throw new ErroNegocio("O número da conta deve possuir exatamente seis dígitos numéricos.");
    }
    this.numero = numero;
  }
}
