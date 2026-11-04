import { ErroNegocio } from "../../src/domain/ErroNegocio";
import { NumeroConta } from "../../src/domain/NumeroConta";

describe("NumeroConta", () => {
  test("deve aceitar número de conta com seis dígitos", () => {
    // Arrange
    const numero = "123456";

    // Act
    const conta = new NumeroConta(numero);

    // Assert
    expect(conta.numero).toBe("123456");
  });

  test("deve preservar zeros à esquerda", () => {
    // Arrange
    const numero = "000123";

    // Act
    const conta = new NumeroConta(numero);

    // Assert
    expect(conta.numero).toBe("000123");
  });

  test.each([
    ["cinco dígitos", "12345"],
    ["sete dígitos", "1234567"],
    ["vazio", ""],
    ["letras", "12345a"],
    ["somente letras", "abcdef"],
    ["espaço", "12345 "],
    ["quebra de linha final", "123456\n"],
    ["sinal", "-12345"],
    ["dígitos não ASCII", "١٢٣٤٥٦"],
  ])("deve rejeitar número de conta inválido: %s", (_descricao, numero) => {
    // Arrange / Act
    const criar = () => new NumeroConta(numero);

    // Assert
    expect(criar).toThrow(ErroNegocio);
  });
});
