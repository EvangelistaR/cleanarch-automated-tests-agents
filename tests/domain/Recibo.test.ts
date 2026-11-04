import { ErroNegocio } from "../../src/domain/ErroNegocio";
import { Recibo } from "../../src/domain/Recibo";

describe("Recibo", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("deve expor o código informado preservando zeros à esquerda", () => {
    // Arrange / Act
    const recibo = new Recibo("000042");

    // Assert
    expect(recibo.codigo).toBe("000042");
  });

  test.each([
    ["cinco dígitos", "12345"],
    ["sete dígitos", "1234567"],
    ["vazio", ""],
    ["letras", "12345a"],
    ["espaço", "12345 "],
    ["quebra de linha final", "123456\n"],
    ["dígitos não ASCII", "١٢٣٤٥٦"],
  ])("deve rejeitar código inválido: %s", (_descricao, codigo) => {
    // Arrange / Act
    const criar = () => new Recibo(codigo);

    // Assert
    expect(criar).toThrow(ErroNegocio);
  });

  describe("gerarCodigoAleatorio", () => {
    test.each([
      [0, "000000"],
      [0.000042, "000042"],
      [0.5, "500000"],
      [0.999999, "999999"],
    ])("deve gerar seis dígitos com zeros à esquerda quando o sorteio é %s", (sorteio, esperado) => {
      // Arrange
      jest.spyOn(Math, "random").mockReturnValue(sorteio);

      // Act
      const codigo = Recibo.gerarCodigoAleatorio();

      // Assert
      expect(codigo).toBe(esperado);
    });

    test("deve gerar códigos aceitos pelo próprio Recibo", () => {
      // Arrange / Act
      const codigos = Array.from({ length: 200 }, () => Recibo.gerarCodigoAleatorio());

      // Assert
      for (const codigo of codigos) {
        expect(new Recibo(codigo).codigo).toBe(codigo);
      }
    });
  });
});
