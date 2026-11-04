import { Conta } from "../../src/domain/Conta";
import { ErroNegocio } from "../../src/domain/ErroNegocio";

const valoresNaoInteirosSeguros: Array<[string, number]> = [
  ["fracionário", 10.5],
  ["NaN", NaN],
  ["Infinity", Infinity],
  ["-Infinity", -Infinity],
  ["acima do inteiro seguro", Number.MAX_SAFE_INTEGER + 1],
];

describe("Conta", () => {
  describe("criação", () => {
    test("deve expor número e saldo informados", () => {
      // Arrange / Act
      const conta = new Conta("000123", 10000);

      // Assert
      expect(conta.numero).toBe("000123");
      expect(conta.saldo).toBe(10000);
    });

    test("deve permitir saldo inicial igual a zero", () => {
      // Arrange / Act
      const conta = new Conta("123456", 0);

      // Assert
      expect(conta.saldo).toBe(0);
    });

    test("deve rejeitar número de conta inválido", () => {
      // Arrange / Act
      const criar = () => new Conta("12345", 100);

      // Assert
      expect(criar).toThrow(ErroNegocio);
    });

    test.each([["negativo", -1], ...valoresNaoInteirosSeguros])(
      "deve rejeitar saldo inicial %s",
      (_descricao, saldo) => {
        // Arrange / Act
        const criar = () => new Conta("123456", saldo);

        // Assert
        expect(criar).toThrow(ErroNegocio);
      },
    );
  });

  describe("sacar", () => {
    test("deve debitar o valor quando menor que o saldo", () => {
      // Arrange
      const conta = new Conta("123456", 10000);

      // Act
      conta.sacar(3000);

      // Assert
      expect(conta.saldo).toBe(7000);
    });

    test("deve permitir saque igual ao saldo", () => {
      // Arrange
      const conta = new Conta("123456", 3000);

      // Act
      conta.sacar(3000);

      // Assert
      expect(conta.saldo).toBe(0);
    });

    test("deve rejeitar saque maior que o saldo mantendo o saldo", () => {
      // Arrange
      const conta = new Conta("123456", 2000);

      // Act
      const sacar = () => conta.sacar(2001);

      // Assert
      expect(sacar).toThrow(ErroNegocio);
      expect(conta.saldo).toBe(2000);
    });

    test.each([["zero", 0], ["negativo", -100], ...valoresNaoInteirosSeguros])(
      "deve rejeitar saque %s mantendo o saldo",
      (_descricao, valor) => {
        // Arrange
        const conta = new Conta("123456", 10000);

        // Act
        const sacar = () => conta.sacar(valor);

        // Assert
        expect(sacar).toThrow(ErroNegocio);
        expect(conta.saldo).toBe(10000);
      },
    );
  });

  describe("depositar", () => {
    test("deve creditar o valor positivo", () => {
      // Arrange
      const conta = new Conta("123456", 2000);

      // Act
      conta.depositar(3000);

      // Assert
      expect(conta.saldo).toBe(5000);
    });

    test.each([["zero", 0], ["negativo", -100], ...valoresNaoInteirosSeguros])(
      "deve rejeitar depósito %s mantendo o saldo",
      (_descricao, valor) => {
        // Arrange
        const conta = new Conta("123456", 10000);

        // Act
        const depositar = () => conta.depositar(valor);

        // Assert
        expect(depositar).toThrow(ErroNegocio);
        expect(conta.saldo).toBe(10000);
      },
    );

    test("deve permitir depósito que leva o saldo exatamente a Number.MAX_SAFE_INTEGER", () => {
      // Arrange
      const conta = new Conta("123456", Number.MAX_SAFE_INTEGER - 1);

      // Act
      conta.depositar(1);

      // Assert
      expect(conta.saldo).toBe(Number.MAX_SAFE_INTEGER);
    });

    test("deve rejeitar depósito que ultrapassa Number.MAX_SAFE_INTEGER mantendo o saldo", () => {
      // Arrange
      const conta = new Conta("123456", Number.MAX_SAFE_INTEGER);

      // Act
      const depositar = () => conta.depositar(1);

      // Assert
      expect(depositar).toThrow(ErroNegocio);
      expect(conta.saldo).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
