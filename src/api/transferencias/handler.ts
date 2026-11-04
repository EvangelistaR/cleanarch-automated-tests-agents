import { ErroNegocio } from '../../domain/ErroNegocio';

export type DadosTransferencia = {
  contaOrigem: string;
  contaDestino: string;
  valor: number;
};

export type OperacaoTransferencia = {
  executar(
    dados: DadosTransferencia,
  ): { comprovante: string } | Promise<{ comprovante: string }>;
};

const FORMATO_CONTA = /^[0-9]{6}$/;

// Códigos de domínio previstos para este endpoint. Qualquer outro vira 500.
const STATUS_POR_CODIGO: Partial<Record<string, number>> = {
  MESMA_CONTA: 422,
  SALDO_INSUFICIENTE: 422,
  CONTA_NAO_ENCONTRADA: 404,
};

function respostaErro(codigo: string, status: number): Response {
  return Response.json({ erro: codigo }, { status });
}

function traduzirErro(erro: unknown): Response {
  if (erro instanceof ErroNegocio) {
    const status = STATUS_POR_CODIGO[erro.codigo];
    if (status !== undefined) {
      return respostaErro(erro.codigo, status);
    }
  }
  return respostaErro('ERRO_INTERNO', 500);
}

function ehObjetoJson(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function ehContaValida(conta: unknown): conta is string {
  return typeof conta === 'string' && FORMATO_CONTA.test(conta);
}

// Guarda de transporte do contrato JSON; invariantes de saldo continuam no domínio.
function ehValorValido(valor: unknown): valor is number {
  return (
    typeof valor === 'number' &&
    Number.isFinite(valor) &&
    valor > 0 &&
    Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6
  );
}

export function criarPostTransferencias(
  operacao: OperacaoTransferencia,
): (request: Request) => Promise<Response> {
  return async (request) => {
    let corpo: unknown;
    try {
      corpo = await request.json();
    } catch {
      return respostaErro('REQUISICAO_INVALIDA', 400);
    }
    if (!ehObjetoJson(corpo)) {
      return respostaErro('REQUISICAO_INVALIDA', 400);
    }

    const { contaOrigem, contaDestino, valor } = corpo;
    if (!ehContaValida(contaOrigem) || !ehContaValida(contaDestino)) {
      return respostaErro('CONTA_INVALIDA', 400);
    }
    if (!ehValorValido(valor)) {
      return respostaErro('VALOR_INVALIDO', 400);
    }
    if (contaOrigem === contaDestino) {
      return respostaErro('MESMA_CONTA', 422);
    }

    try {
      const resultado = await operacao.executar({ contaOrigem, contaDestino, valor });
      return Response.json({ comprovante: resultado.comprovante }, { status: 201 });
    } catch (erro) {
      return traduzirErro(erro);
    }
  };
}
