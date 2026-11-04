import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { TransferenciasWorld } from '../support/world';

Given(
  'que existe a conta {string} com saldo {float}',
  function (this: TransferenciasWorld, numero: string, saldo: number) {
    this.criarConta(numero, saldo);
  },
);

When(
  'solicito uma transferência de {float} da conta {string} para a conta {string}',
  async function (this: TransferenciasWorld, valor: number, origem: string, destino: string) {
    await this.transferir(origem, destino, valor);
  },
);

When(
  'envio o seguinte corpo bruto para a API de transferências:',
  async function (this: TransferenciasWorld, corpo: string) {
    await this.enviarCorpoBruto(corpo);
  },
);

Then('o status HTTP deve ser {int}', function (this: TransferenciasWorld, status: number) {
  assert.ok(this.resposta, 'nenhuma resposta recebida');
  assert.equal(this.resposta.status, status);
});

Then(
  'o saldo da conta {string} deve ser {float}',
  function (this: TransferenciasWorld, numero: string, saldo: number) {
    assert.equal(this.conta(numero).saldo, saldo);
  },
);

Then('a resposta deve conter um comprovante de seis dígitos', function (this: TransferenciasWorld) {
  assert.match(String(this.corpoResposta?.comprovante), /^\d{6}$/);
});

Then(
  'o erro retornado deve ser {string}',
  function (this: TransferenciasWorld, erro: string) {
    assert.equal(this.corpoResposta?.erro, erro);
  },
);
