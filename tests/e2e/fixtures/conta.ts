import { randomInt } from 'node:crypto';
import type { APIRequestContext, APIResponse } from '@playwright/test';

export type ContaDTO = { numero: string; saldo: number };
export type ParContas = { origem: ContaDTO; destino: ContaDTO };

const LIMITE_TENTATIVAS = 10;

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

async function lerJson(resposta: APIResponse, operacao: string): Promise<unknown> {
  try {
    return await resposta.json();
  } catch {
    throw new Error(`${operacao}: resposta nao contem JSON valido`);
  }
}

function lerConta(dados: unknown, numero: string, operacao: string): ContaDTO {
  if (
    !objeto(dados) || dados.numero !== numero ||
    typeof dados.saldo !== 'number' || !Number.isFinite(dados.saldo) ||
    dados.saldo < 0
  ) {
    throw new Error(`${operacao}: DTO invalido ou numero diferente de ${numero}`);
  }
  return { numero: dados.numero, saldo: dados.saldo };
}

/** Consulta HTTP real. A fixture request deve ter baseURL configurada. */
export async function consultarConta(
  request: APIRequestContext,
  numero: string,
): Promise<ContaDTO> {
  if (!/^[0-9]{6}$/.test(numero)) {
    throw new Error('consultarConta: numero deve ser uma string de seis digitos');
  }
  const caminho = `/api/contas/${numero}`;
  const resposta = await request.get(caminho);
  if (resposta.status() !== 200) {
    throw new Error(`GET ${caminho}: esperado HTTP 200; recebido ${resposta.status()}`);
  }
  return lerConta(await lerJson(resposta, `GET ${caminho}`), numero, `GET ${caminho}`);
}

async function criarConta(
  request: APIRequestContext,
  saldoInicial: number,
  diferenteDe?: string,
): Promise<ContaDTO> {
  for (let tentativa = 1; tentativa <= LIMITE_TENTATIVAS; tentativa += 1) {
    // O dominio exige seis digitos, inclusive zeros a esquerda.
    // O deslocamento garante destino diferente da origem sem novo loop.
    let candidato = randomInt(0, 1_000_000);
    if (String(candidato).padStart(6, '0') === diferenteDe) {
      candidato = (candidato + 1) % 1_000_000;
    }
    const numero = String(candidato).padStart(6, '0');
    const resposta = await request.post('/api/contas', {
      data: { numero, saldoInicial },
    });
    const status = resposta.status();
    if (status === 409) {
      const dados = await lerJson(resposta, 'POST /api/contas');
      if (objeto(dados) && dados.erro === 'CONTA_JA_EXISTE') continue;
    }
    if (status !== 201) {
      throw new Error(`POST /api/contas: esperado HTTP 201; recebido ${status}`);
    }
    const conta = lerConta(await lerJson(resposta, 'POST /api/contas'), numero, 'POST /api/contas');
    if (conta.saldo !== saldoInicial) {
      throw new Error(`POST /api/contas: saldo de ${numero} diverge do saldo inicial ${saldoInicial}`);
    }
    return conta;
  }
  throw new Error(`Nao foi possivel criar conta apos ${LIMITE_TENTATIVAS} colisoes de cadastro`);
}

/** Cria um par novo por teste e confirma o estado inicial no servidor. */
export async function prepararContas(
  request: APIRequestContext,
  saldos: { saldoOrigem: number; saldoDestino: number },
): Promise<ParContas> {
  for (const saldo of [saldos.saldoOrigem, saldos.saldoDestino]) {
    if (!Number.isFinite(saldo) || saldo < 0) {
      throw new Error('prepararContas: saldos iniciais devem ser numeros finitos nao negativos');
    }
  }
  const origemCriada = await criarConta(request, saldos.saldoOrigem);
  const destinoCriado = await criarConta(request, saldos.saldoDestino, origemCriada.numero);
  const [origem, destino] = await Promise.all([
    consultarConta(request, origemCriada.numero),
    consultarConta(request, destinoCriado.numero),
  ]);
  if (origem.saldo !== saldos.saldoOrigem || destino.saldo !== saldos.saldoDestino) {
    throw new Error('prepararContas: saldo inicial confirmado por GET diverge da massa solicitada');
  }
  return { origem, destino };
}
