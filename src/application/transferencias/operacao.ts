import type { OperacaoTransferencia } from '../../api/transferencias/handler';
import type { Conta } from '../../domain/Conta';
import { ErroNegocio } from '../../domain/ErroNegocio';
import { Recibo } from '../../domain/Recibo';
import { TransferenciaValor } from '../../domain/TransferenciaValor';

export function criarOperacaoTransferencia(
  contas: ReadonlyMap<string, Conta>,
  gerarCodigo: () => string = Recibo.gerarCodigoAleatorio,
): OperacaoTransferencia {
  const transferencia = new TransferenciaValor(gerarCodigo);

  return {
    executar({ contaOrigem, contaDestino, valor }) {
      const origem = contas.get(contaOrigem);
      const destino = contas.get(contaDestino);
      if (origem === undefined || destino === undefined) {
        throw new ErroNegocio('CONTA_NAO_ENCONTRADA', 'Conta de origem ou destino não cadastrada');
      }
      const recibo = transferencia.transferir(origem, destino, valor);
      return { comprovante: recibo.codigo };
    },
  };
}
