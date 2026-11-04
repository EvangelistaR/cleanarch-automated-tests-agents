import http from 'k6/http';
import { check, sleep } from 'k6';
import type { Options } from 'k6/options';

type Massa = { numero: string; saldo: number };

const baseURL = (__ENV.BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const vus = Number(__ENV.VUS || '5');
if (!Number.isSafeInteger(vus) || vus < 1) throw new Error('VUS deve ser inteiro positivo');
if (!/^https?:\/\//.test(baseURL)) throw new Error('BASE_URL deve iniciar com http:// ou https://');

export const options: Options = {
  vus,
  duration: '30s',
  thresholds: {
    'http_req_duration{operacao:consulta}': ['p(95)<500'],
    'http_req_failed{operacao:consulta}': ['rate<0.01'],
    'checks{operacao:consulta}': ['rate>0.99'],
    'http_reqs{operacao:consulta}': ['count>0'],
  },
};

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function setup(): Massa {
  for (let tentativa = 1; tentativa <= 10; tentativa += 1) {
    const numero = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    const criacao = http.post(
      `${baseURL}/api/contas`,
      JSON.stringify({ numero, saldoInicial: 1000 }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { operacao: 'preparacao', name: 'POST /api/contas' },
        responseCallback: http.expectedStatuses(201, 409),
      },
    );
    if (criacao.status === 409) {
      const erro: unknown = criacao.json();
      if (objeto(erro) && erro.erro === 'CONTA_JA_EXISTE') continue;
    }
    if (criacao.status !== 201) {
      throw new Error(`Preparacao: POST /api/contas retornou ${criacao.status}, esperado 201`);
    }
    const criada: unknown = criacao.json();
    if (!objeto(criada) || criada.numero !== numero || criada.saldo !== 1000) {
      throw new Error('Preparacao: DTO de criacao diverge da conta solicitada');
    }
    const consulta = http.get(`${baseURL}/api/contas/${numero}`, {
      tags: { operacao: 'preparacao', name: 'GET /api/contas/{numero}' },
      responseCallback: http.expectedStatuses(200),
    });
    if (consulta.status !== 200) {
      throw new Error(`Preparacao: GET retornou ${consulta.status}, esperado 200`);
    }
    const confirmada: unknown = consulta.json();
    if (!objeto(confirmada) || confirmada.numero !== numero || confirmada.saldo !== 1000) {
      throw new Error('Preparacao: saldo ou numero confirmado por GET diverge da massa');
    }
    return { numero, saldo: 1000 };
  }
  throw new Error('Preparacao: limite de 10 colisoes de cadastro atingido');
}

export default function consulta(massa: Massa): void {
  const resposta = http.get(`${baseURL}/api/contas/${massa.numero}`, {
    tags: { operacao: 'consulta', name: 'GET /api/contas/{numero}' },
    responseCallback: http.expectedStatuses(200),
  });
  let dados: unknown;
  try {
    dados = resposta.json();
  } catch {
    dados = undefined;
  }
  check(resposta, {
    'HTTP 200': r => r.status === 200,
    'numero correto': () => objeto(dados) && dados.numero === massa.numero,
    'saldo correto': () => objeto(dados) && dados.saldo === massa.saldo,
  }, { operacao: 'consulta' });
  sleep(1);
}
