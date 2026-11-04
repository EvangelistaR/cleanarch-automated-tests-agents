import { setWorldConstructor, World } from '@cucumber/cucumber';
import { criarPostTransferencias } from '../../src/api/transferencias/handler';
import { criarOperacaoTransferencia } from '../../src/application/transferencias/operacao';
import { Conta } from '../../src/domain/Conta';

const URL_TRANSFERENCIAS = 'http://localhost/api/transferencias';

// Uma instância por cenário: novo Map, novas contas e nova factory (sem estado compartilhado).
export class TransferenciasWorld extends World {
  readonly contas = new Map<string, Conta>();
  private readonly POST = criarPostTransferencias(
    criarOperacaoTransferencia(this.contas, () => '123456'),
  );
  resposta?: Response;
  corpoResposta?: Record<string, unknown>;

  criarConta(numero: string, saldo: number): void {
    this.contas.set(numero, new Conta(numero, saldo));
  }

  conta(numero: string): Conta {
    const conta = this.contas.get(numero);
    if (conta === undefined) throw new Error(`Conta ${numero} não preparada no cenário`);
    return conta;
  }

  async enviarCorpoBruto(corpo: string): Promise<void> {
    this.resposta = await this.POST(
      new Request(URL_TRANSFERENCIAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: corpo,
      }),
    );
    // Response.json() só pode ser lido uma vez: guarda o resultado.
    this.corpoResposta = (await this.resposta.json()) as Record<string, unknown>;
  }

  async transferir(contaOrigem: string, contaDestino: string, valor: number): Promise<void> {
    await this.enviarCorpoBruto(JSON.stringify({ contaOrigem, contaDestino, valor }));
  }
}

setWorldConstructor(TransferenciasWorld);
