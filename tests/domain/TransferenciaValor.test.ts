import { Conta } from "../../src/domain/Conta";
import { ErroNegocio } from "../../src/domain/ErroNegocio";
import { Recibo } from "../../src/domain/Recibo";
import { TransferenciaValor } from "../../src/domain/TransferenciaValor";

const gerarCodigoFixo = (): string => "000321";

describe("TransferenciaValor", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("transferência aceita", () => {
    test("deve debitar a origem, creditar o destino e retornar o comprovante", () => {
      // Arrange
      const origem = new Conta("123456", 10000);
      const destino = new Conta("654321", 2000);
      const transferencia = new TransferenciaValor(gerarCodigoFixo);

      // Act
      const recibo = transferencia.transferir(origem, destino, 3000);

      // Assert
      expect(origem.saldo).toBe(7000);
      expect(destino.saldo).toBe(5000);
      expect(recibo).toBeInstanceOf(Recibo);
      expect(recibo.codigo).toBe("000321");
    });

    test("deve aceitar transferência com saldo exatamente suficiente", () => {
      // Arrange
      const origem = new Conta("123456", 3000);
      const destino = new Conta("654321", 1000);
      const transferencia = new TransferenciaValor(gerarCodigoFixo);

      // Act
      const recibo = transferencia.transferir(origem, destino, 3000);

      // Assert
      expect(origem.saldo).toBe(0);
      expect(destino.saldo).toBe(4000);
      expect(recibo.codigo).toBe("000321");
    });

    test("deve usar o gerador padrão de Recibo quando nenhum é informado", () => {
      // Arrange
      jest.spyOn(Math, "random").mockReturnValue(0.000042);
      const origem = new Conta("123456", 1000);
      const destino = new Conta("654321", 0);
      const transferencia = new TransferenciaValor();

      // Act
      const recibo = transferencia.transferir(origem, destino, 1000);

      // Assert
      expect(recibo.codigo).toBe("000042");
    });
  });

  describe("transferência rejeitada", () => {
    test("deve rejeitar saldo insuficiente mantendo os dois saldos", () => {
      // Arrange
      const origem = new Conta("123456", 2000);
      const destino = new Conta("654321", 5000);
      const transferencia = new TransferenciaValor(gerarCodigoFixo);

      // Act
      const transferir = () => transferencia.transferir(origem, destino, 3000);

      // Assert
      expect(transferir).toThrow(ErroNegocio);
      expect(origem.saldo).toBe(2000);
      expect(destino.saldo).toBe(5000);
    });

    test.each([
      ["zero", 0],
      ["negativo", -100],
      ["fracionário", 10.5],
      ["NaN", NaN],
      ["Infinity", Infinity],
    ])("deve rejeitar valor %s mantendo os dois saldos", (_descricao, valor) => {
      // Arrange
      const origem = new Conta("123456", 10000);
      const destino = new Conta("654321", 5000);
      const transferencia = new TransferenciaValor(gerarCodigoFixo);

      // Act
      const transferir = () => transferencia.transferir(origem, destino, valor);

      // Assert
      expect(transferir).toThrow(ErroNegocio);
      expect(origem.saldo).toBe(10000);
      expect(destino.saldo).toBe(5000);
    });

    test("deve rejeitar transferência para a própria conta mantendo o saldo", () => {
      // Arrange
      const origem = new Conta("123456", 10000);
      const mesmaConta = new Conta("123456", 10000);
      const transferencia = new TransferenciaValor(gerarCodigoFixo);

      // Act
      const transferir = () => transferencia.transferir(origem, mesmaConta, 1000);

      // Assert
      expect(transferir).toThrow(ErroNegocio);
      expect(origem.saldo).toBe(10000);
      expect(mesmaConta.saldo).toBe(10000);
    });

    test("deve rejeitar transferência para a mesma instância de conta", () => {
      // Arrange
      const conta = new Conta("123456", 10000);
      const transferencia = new TransferenciaValor(gerarCodigoFixo);

      // Act
      const transferir = () => transferencia.transferir(conta, conta, 1000);

      // Assert
      expect(transferir).toThrow(ErroNegocio);
      expect(conta.saldo).toBe(10000);
    });

    test("deve restaurar a origem quando o crédito no destino falha", () => {
      // Arrange
      const origem = new Conta("123456", 10000);
      const destino = new Conta("654321", Number.MAX_SAFE_INTEGER);
      const transferencia = new TransferenciaValor(gerarCodigoFixo);

      // Act
      const transferir = () => transferencia.transferir(origem, destino, 1000);

      // Assert
      expect(transferir).toThrow(ErroNegocio);
      expect(origem.saldo).toBe(10000);
      expect(destino.saldo).toBe(Number.MAX_SAFE_INTEGER);
    });

    test("deve rejeitar código inválido do gerador antes de alterar os saldos", () => {
      // Arrange
      const origem = new Conta("123456", 10000);
      const destino = new Conta("654321", 5000);
      const transferencia = new TransferenciaValor(() => "12345");

      // Act
      const transferir = () => transferencia.transferir(origem, destino, 3000);

      // Assert
      expect(transferir).toThrow(ErroNegocio);
      expect(origem.saldo).toBe(10000);
      expect(destino.saldo).toBe(5000);
    });
  });
});
