import { Conta } from "../../src/domain/Conta";
import { ErroNegocio } from "../../src/domain/ErroNegocio";
import { NumeroConta } from "../../src/domain/NumeroConta";
import { TransferenciaValor } from "../../src/domain/TransferenciaValor";

function capturar(acao: () => unknown): unknown {
  try {
    acao();
  } catch (erro) {
    return erro;
  }
  throw new Error("Esperava uma exceção");
}

describe("classificação de erros do domínio", () => {
  test.each(["12345", "1234567", "12345a", ""])(
    "número de conta inválido %p lança CONTA_INVALIDA com a mensagem antiga",
    (numero) => {
      const erro = capturar(() => new NumeroConta(numero));

      expect(erro).toBeInstanceOf(ErroNegocio);
      expect((erro as ErroNegocio).codigo).toBe("CONTA_INVALIDA");
      expect((erro as ErroNegocio).message).toBe("Número de conta deve possuir exatamente seis dígitos");
    },
  );

  test.each([-1, 0.001, NaN, Infinity, Number.MAX_SAFE_INTEGER + 2])(
    "saldo inicial inválido %p lança SALDO_INVALIDO com a mensagem antiga",
    (saldo) => {
      const erro = capturar(() => new Conta("123456", saldo));

      expect(erro).toBeInstanceOf(ErroNegocio);
      expect((erro as ErroNegocio).codigo).toBe("SALDO_INVALIDO");
      expect((erro as ErroNegocio).message).toBe(
        "Saldo inicial deve ser um valor com até duas casas decimais entre zero e Number.MAX_SAFE_INTEGER",
      );
    },
  );

  describe.each(["sacar", "depositar"] as const)("%s", (operacao) => {
    test.each([0, -5, 0.001, NaN, Infinity])(
      "valor inválido %p lança VALOR_INVALIDO com a mensagem antiga e saldo inalterado",
      (valor) => {
        const conta = new Conta("123456", 100);

        const erro = capturar(() => conta[operacao](valor));

        expect(erro).toBeInstanceOf(ErroNegocio);
        expect((erro as ErroNegocio).codigo).toBe("VALOR_INVALIDO");
        expect((erro as ErroNegocio).message).toBe(
          "Valor deve ser um número finito com até duas casas decimais maior que zero",
        );
        expect(conta.saldo).toBe(100);
      },
    );
  });

  test("transferir para a mesma conta lança MESMA_CONTA sem alterar saldos", () => {
    const origem = new Conta("123456", 100);
    const destino = new Conta("123456", 50);

    const erro = capturar(() => new TransferenciaValor(() => "123456").transferir(origem, destino, 10));

    expect(erro).toBeInstanceOf(ErroNegocio);
    expect((erro as ErroNegocio).codigo).toBe("MESMA_CONTA");
    expect((erro as ErroNegocio).message).toBe("Conta de origem e destino devem ser diferentes");
    expect(origem.saldo).toBe(100);
    expect(destino.saldo).toBe(50);
  });

  test("depósito acima do saldo máximo continua sendo Error genérico", () => {
    const conta = new Conta("123456", Number.MAX_SAFE_INTEGER);

    const erro = capturar(() => conta.depositar(1));

    expect(erro).toBeInstanceOf(Error);
    expect(erro).not.toBeInstanceOf(ErroNegocio);
    expect(conta.saldo).toBe(Number.MAX_SAFE_INTEGER);
  });

  test("sacar acima do saldo lança SALDO_INSUFICIENTE com a mensagem antiga e saldo inalterado", () => {
    const conta = new Conta("123456", 100);

    const erro = capturar(() => conta.sacar(100.01));

    expect(erro).toBeInstanceOf(ErroNegocio);
    expect((erro as ErroNegocio).codigo).toBe("SALDO_INSUFICIENTE");
    expect((erro as ErroNegocio).message).toBe("Saldo insuficiente");
    expect(conta.saldo).toBe(100);
  });
});
