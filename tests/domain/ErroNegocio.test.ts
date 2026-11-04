import { ErroNegocio } from "../../src/domain/ErroNegocio";

describe("ErroNegocio", () => {
  test("é um Error com código e mensagem preservados", () => {
    const erro = new ErroNegocio("SALDO_INSUFICIENTE", "Saldo insuficiente");

    expect(erro).toBeInstanceOf(Error);
    expect(erro).toBeInstanceOf(ErroNegocio);
    expect(erro.codigo).toBe("SALDO_INSUFICIENTE");
    expect(erro.message).toBe("Saldo insuficiente");
  });
});
