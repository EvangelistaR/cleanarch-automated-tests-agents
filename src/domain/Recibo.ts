import { ErroNegocio } from "./ErroNegocio";

export class Recibo {
  public readonly codigo: string;

  constructor(codigo: string) {
    if (!/^[0-9]{6}$/.test(codigo)) {
      throw new ErroNegocio("O código do recibo deve possuir exatamente seis dígitos numéricos.");
    }
    this.codigo = codigo;
  }

  static gerarCodigoAleatorio(): string {
    return Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");
  }
}
