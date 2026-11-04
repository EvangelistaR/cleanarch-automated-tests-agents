export type CodigoErroNegocio =
  | "CONTA_INVALIDA"
  | "SALDO_INVALIDO"
  | "VALOR_INVALIDO"
  | "SALDO_INSUFICIENTE"
  | "MESMA_CONTA"
  | "CONTA_NAO_ENCONTRADA"
  | "CONTA_JA_EXISTE";

export class ErroNegocio extends Error {
  readonly codigo: CodigoErroNegocio;

  constructor(codigo: CodigoErroNegocio, mensagem: string) {
    super(mensagem);
    this.name = "ErroNegocio";
    this.codigo = codigo;
  }
}
