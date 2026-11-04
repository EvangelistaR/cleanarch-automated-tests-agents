describe("ambiente", () => {
  test("deve executar o Jest corretamente", () => {
    // Arrange
    const esperado = 2;

    // Act
    const resultado = 1 + 1;

    // Assert
    expect(resultado).toBe(esperado);
  });
});
