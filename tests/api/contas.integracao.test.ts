import { criarGetContaPorId, criarGetContas, criarPostContas } from '../../src/api/contas/handlers';
import { criarOperacoesContas } from '../../src/application/contas/operacoes';
import { Conta } from '../../src/domain/Conta';

function montar() {
  const map = new Map<string, Conta>();
  const operacoes = criarOperacoesContas(map);
  const post = criarPostContas(operacoes);
  const lista = criarGetContas(operacoes);
  const porId = criarGetContaPorId(operacoes);

  return {
    map,
    criar: (corpo: string) =>
      post(
        new Request('http://localhost/api/contas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: corpo,
        }),
      ),
    listar: () => lista(new Request('http://localhost/api/contas')),
    consultar: (id: string) => porId(new Request(`http://localhost/api/contas/${id}`), id),
  };
}

const corpo = (numero: unknown, saldoInicial: unknown) => JSON.stringify({ numero, saldoInicial });

describe('API de contas com domínio e cadastro reais', () => {
  test('CINT-01: criar 123456 com 1000 insere uma Conta real', async () => {
    const api = montar();

    const response = await api.criar(corpo('123456', 1000));

    expect(response.status).toBe(201);
    expect(response.headers.get('Location')).toBe('/api/contas/123456');
    expect(await response.json()).toEqual({ numero: '123456', saldo: 1000 });
    expect(api.map.size).toBe(1);
    const conta = api.map.get('123456');
    expect(conta).toBeInstanceOf(Conta);
    expect(conta?.saldo).toBe(1000);
  });

  test('CINT-02: preserva zeros à esquerda, saldo zero e centavos', async () => {
    const api = montar();

    const r1 = await api.criar(corpo('001234', 0));
    const r2 = await api.criar(corpo('654321', 200.29));

    expect(r1.status).toBe(201);
    expect(await r1.json()).toEqual({ numero: '001234', saldo: 0 });
    expect(r2.status).toBe(201);
    expect(await r2.json()).toEqual({ numero: '654321', saldo: 200.29 });
  });

  test('CINT-03: conta duplicada não substitui instância nem saldo', async () => {
    const api = montar();
    await api.criar(corpo('123456', 1000));
    const original = api.map.get('123456');

    const response = await api.criar(corpo('123456', 200));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ erro: 'CONTA_JA_EXISTE' });
    expect(api.map.size).toBe(1);
    expect(api.map.get('123456')).toBe(original);
    expect(original?.saldo).toBe(1000);
  });

  test.each([
    ['saldo negativo', corpo('123456', -1), 'SALDO_INVALIDO'],
    ['saldo com três casas', corpo('123456', 1.255), 'SALDO_INVALIDO'],
    ['saldo acima do máximo', corpo('123456', Number.MAX_SAFE_INTEGER + 1), 'SALDO_INVALIDO'],
    ['saldo não finito (vira null no JSON)', corpo('123456', Infinity), 'SALDO_INVALIDO'],
    ['saldo ausente', JSON.stringify({ numero: '123456' }), 'SALDO_INVALIDO'],
    ['saldo string', corpo('123456', '10'), 'SALDO_INVALIDO'],
    ['número com cinco dígitos', corpo('12345', 10), 'CONTA_INVALIDA'],
    ['número com sete dígitos', corpo('1234567', 10), 'CONTA_INVALIDA'],
    ['número com letra', corpo('12A456', 10), 'CONTA_INVALIDA'],
    ['número com espaços', corpo(' 12345', 10), 'CONTA_INVALIDA'],
    ['número numérico', corpo(123456, 10), 'CONTA_INVALIDA'],
    ['número e saldo inválidos', corpo('12', -1), 'CONTA_INVALIDA'],
    ['JSON malformado', '{', 'REQUISICAO_INVALIDA'],
    ['null', 'null', 'REQUISICAO_INVALIDA'],
    ['array', '[]', 'REQUISICAO_INVALIDA'],
  ])('CINT-04: %s devolve 400 sem inserir', async (_nome, body, codigo) => {
    const api = montar();

    const response = await api.criar(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ erro: codigo });
    expect(api.map.size).toBe(0);
  });

  test('CONTA-08: duplicada com saldo inválido prioriza SALDO_INVALIDO e nada muda', async () => {
    const api = montar();
    await api.criar(corpo('123456', 1000));

    const response = await api.criar(corpo('123456', -5));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ erro: 'SALDO_INVALIDO' });
    expect(api.map.size).toBe(1);
    expect(api.map.get('123456')?.saldo).toBe(1000);
  });

  test('CINT-05: listagem vazia devolve exatamente {"contas":[]}', async () => {
    const api = montar();

    const response = await api.listar();

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('{"contas":[]}');
  });

  test('CINT-06: lista 3 contas ordenadas com campos exatos', async () => {
    const api = montar();
    await api.criar(corpo('654321', 200));
    await api.criar(corpo('001234', 0));
    await api.criar(corpo('123456', 1000));

    const response = await api.listar();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      contas: [
        { numero: '001234', saldo: 0 },
        { numero: '123456', saldo: 1000 },
        { numero: '654321', saldo: 200 },
      ],
    });
  });

  test('CINT-07: consulta preserva zeros e não altera saldo', async () => {
    const api = montar();
    await api.criar(corpo('123456', 1000));
    await api.criar(corpo('001234', 0));

    const r1 = await api.consultar('123456');
    const r2 = await api.consultar('001234');

    expect(r1.status).toBe(200);
    expect(await r1.json()).toEqual({ numero: '123456', saldo: 1000 });
    expect(r2.status).toBe(200);
    expect(await r2.json()).toEqual({ numero: '001234', saldo: 0 });
    expect(api.map.get('123456')?.saldo).toBe(1000);
  });

  test.each([
    ['999999', 404, 'CONTA_NAO_ENCONTRADA'],
    ['12345', 400, 'CONTA_INVALIDA'],
    ['1234567', 400, 'CONTA_INVALIDA'],
    ['ABC123', 400, 'CONTA_INVALIDA'],
  ])('CINT-08: consulta de %s devolve %i %s sem alterar o Map', async (id, status, codigo) => {
    const api = montar();
    await api.criar(corpo('123456', 1000));

    const response = await api.consultar(id);

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ erro: codigo });
    expect(api.map.size).toBe(1);
  });

  test('CINT-09: novo Map não herda contas de outro teste', async () => {
    const response = await montar().listar();

    expect(await response.json()).toEqual({ contas: [] });
  });

  test('CINT-10: leituras repetidas não alteram objetos nem valores', async () => {
    const api = montar();
    await api.criar(corpo('123456', 1000));
    const instancia = api.map.get('123456');

    const primeira = await (await api.listar()).json();
    await api.consultar('123456');
    const segunda = await (await api.listar()).json();

    expect(segunda).toEqual(primeira);
    expect(api.map.size).toBe(1);
    expect(api.map.get('123456')).toBe(instancia);
    expect(instancia?.saldo).toBe(1000);
  });

  test('CONTA-17 (parcial): GET reflete saldo alterado diretamente na Conta real', async () => {
    const api = montar();
    await api.criar(corpo('123456', 1000));

    api.map.get('123456')?.sacar(300);

    expect(await (await api.consultar('123456')).json()).toEqual({ numero: '123456', saldo: 700 });
    expect(await (await api.listar()).json()).toEqual({
      contas: [{ numero: '123456', saldo: 700 }],
    });
  });
});
