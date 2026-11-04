import { criarPostTransferencias } from '../../src/api/transferencias/handler';
import { criarOperacaoTransferencia } from '../../src/application/transferencias/operacao';
import { Conta } from '../../src/domain/Conta';

function montar(gerador: () => string = () => '123456', extras: Conta[] = []) {
  const origem = new Conta('123456', 1000);
  const destino = new Conta('654321', 200);
  const contas = new Map<string, Conta>();
  for (const c of [origem, destino, ...extras]) contas.set(c.numero, c);
  const POST = criarPostTransferencias(criarOperacaoTransferencia(contas, gerador));
  const transferir = (corpo: unknown) =>
    POST(
      new Request('http://localhost/api/transferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      }),
    );
  return { origem, destino, contas, transferir };
}

const dados = (valor: unknown, contaOrigem = '123456', contaDestino = '654321') => ({
  contaOrigem,
  contaDestino,
  valor,
});

describe('POST /api/transferencias — integração com domínio real', () => {
  test('INT-01/API-01: debita e credita com domínio real', async () => {
    const { origem, destino, transferir } = montar();

    const resposta = await transferir(dados(300));

    expect(resposta.status).toBe(201);
    expect(await resposta.json()).toEqual({ comprovante: '123456' });
    expect(origem.saldo).toBe(700);
    expect(destino.saldo).toBe(500);
  });

  test('INT-02/API-03: saldo insuficiente → 422 e saldos preservados', async () => {
    const { origem, destino, transferir } = montar();

    const resposta = await transferir(dados(1001));
    const texto = await resposta.text();

    expect(resposta.status).toBe(422);
    expect(JSON.parse(texto)).toEqual({ erro: 'SALDO_INSUFICIENTE' });
    expect(texto).not.toContain('comprovante');
    expect(origem.saldo).toBe(1000);
    expect(destino.saldo).toBe(200);
  });

  test('INT-03/API-02: transferir exatamente o saldo zera a origem', async () => {
    const { origem, destino, transferir } = montar();

    const resposta = await transferir(dados(1000));

    expect(resposta.status).toBe(201);
    expect(await resposta.json()).toEqual({ comprovante: '123456' });
    expect(origem.saldo).toBe(0);
    expect(destino.saldo).toBe(1200);
  });

  test.each([1, 2])('INT-04: fixture nova (execução %i) inicia com 1000 / 200', async () => {
    const { origem, destino, transferir } = montar();
    expect([origem.saldo, destino.saldo]).toEqual([1000, 200]);

    const resposta = await transferir(dados(300));

    expect(resposta.status).toBe(201);
    expect([origem.saldo, destino.saldo]).toEqual([700, 500]);
  });

  test.each([
    ['API-08: mesma conta', dados(100, '123456', '123456'), 422, 'MESMA_CONTA'],
    ['API-08b: mesma conta inexistente (precedência sobre 404)', dados(100, '999999', '999999'), 422, 'MESMA_CONTA'],
    ['API-07: origem inexistente', dados(100, '999999', '654321'), 404, 'CONTA_NAO_ENCONTRADA'],
    ['API-07: destino inexistente', dados(100, '123456', '999999'), 404, 'CONTA_NAO_ENCONTRADA'],
    ['API-06: conta malformada', dados(100, '12345', '654321'), 400, 'CONTA_INVALIDA'],
    ['API-04: valor negativo', dados(-1), 400, 'VALOR_INVALIDO'],
    ['API-05: valor com três casas', dados(1.255), 400, 'VALOR_INVALIDO'],
    ['API-05: valor string', dados('300'), 400, 'VALOR_INVALIDO'],
    ['saldo insuficiente', dados(1000.01), 422, 'SALDO_INSUFICIENTE'],
  ])('INT-05: %s → erro contratual com ambos os saldos originais', async (_n, corpo, status, erro) => {
    const { origem, destino, transferir } = montar();

    const resposta = await transferir(corpo);

    expect(resposta.status).toBe(status);
    expect(await resposta.json()).toEqual({ erro });
    expect(origem.saldo).toBe(1000);
    expect(destino.saldo).toBe(200);
  });

  test.each([
    ['API-12a: JSON malformado', '{', 'REQUISICAO_INVALIDA'],
    ['API-09: null', 'null', 'REQUISICAO_INVALIDA'],
    ['API-09: array', '[]', 'REQUISICAO_INVALIDA'],
  ])('%s → 400 sem alterar saldos', async (_n, bruto, erro) => {
    const { origem, destino, contas } = montar();
    const POST = criarPostTransferencias(criarOperacaoTransferencia(contas, () => '123456'));

    const resposta = await POST(
      new Request('http://localhost/api/transferencias', { method: 'POST', body: bruto }),
    );

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toEqual({ erro });
    expect([origem.saldo, destino.saldo]).toEqual([1000, 200]);
  });

  test('API-12b: conta e valor inválidos → CONTA_INVALIDA, nada executado', async () => {
    const { origem, destino, transferir } = montar();

    const resposta = await transferir(dados(-5, '12345'));

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toEqual({ erro: 'CONTA_INVALIDA' });
    expect([origem.saldo, destino.saldo]).toEqual([1000, 200]);
  });

  test('INT-06/API-13: gerador devolve código inválido → 500 e saldos preservados', async () => {
    const { origem, destino, transferir } = montar(() => 'ERRADO');

    const resposta = await transferir(dados(300));
    const texto = await resposta.text();

    expect(resposta.status).toBe(500);
    expect(JSON.parse(texto)).toEqual({ erro: 'ERRO_INTERNO' });
    expect(texto).not.toContain('seis dígitos');
    expect(origem.saldo).toBe(1000);
    expect(destino.saldo).toBe(200);
  });

  test('API-10: transfere 0.29 com conta 001234, preservando centavos e zero à esquerda', async () => {
    const zeros = new Conta('001234', 1);
    const { destino, transferir } = montar(() => '123456', [zeros]);

    const resposta = await transferir(dados(0.29, '001234', '654321'));

    expect(resposta.status).toBe(201);
    expect(zeros.saldo).toBe(0.71);
    expect(destino.saldo).toBe(200.29);
  });

  test('falha de crédito por limite máximo → 500 e saldos preservados', async () => {
    const cheia = new Conta('111111', Number.MAX_SAFE_INTEGER);
    const { origem, transferir } = montar(() => '123456', [cheia]);

    const resposta = await transferir(dados(100, '123456', '111111'));

    expect(resposta.status).toBe(500);
    expect(await resposta.json()).toEqual({ erro: 'ERRO_INTERNO' });
    expect(origem.saldo).toBe(1000);
    expect(cheia.saldo).toBe(Number.MAX_SAFE_INTEGER);
  });
});
