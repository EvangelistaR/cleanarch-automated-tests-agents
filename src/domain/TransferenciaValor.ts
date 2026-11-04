import { Conta } from "./Conta";
import { ErroNegocio } from "./ErroNegocio";
import { Recibo } from "./Recibo";

export class TransferenciaValor {
  constructor(private readonly gerarCodigo: () => string = Recibo.gerarCodigoAleatorio) {}

  transferir(origem: Conta, destino: Conta, valorEmCentavos: number): Recibo {
    if (origem.numero === destino.numero) {
      throw new ErroNegocio("A conta de origem e a de destino devem ser diferentes.");
    }
    const recibo = new Recibo(this.gerarCodigo());

    origem.sacar(valorEmCentavos);
    try {
      destino.depositar(valorEmCentavos);
    } catch (erro) {
      origem.depositar(valorEmCentavos);
      throw erro;
    }
    return recibo;
  }
}
