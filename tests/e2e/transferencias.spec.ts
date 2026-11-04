import { expect, test } from '@playwright/test';
import { consultarConta, prepararContas } from './fixtures/conta';

test('E2E-01 — transferência aceita atualiza a tela e o servidor', async ({ page, request }) => {
  // Arrange: par novo, criado e confirmado por HTTP.
  const { origem, destino } = await prepararContas(request, {
    saldoOrigem: 1000,
    saldoDestino: 200,
  });
  test.info().annotations.push({
    type: 'contas',
    description: `origem=${origem.numero} destino=${destino.numero}`,
  });

  await page.goto('/transferencias');
  await page.getByLabel('Conta origem').fill(origem.numero);
  await page.getByLabel('Conta destino').fill(destino.numero);
  await page.getByLabel('Valor (R$)').fill('300');

  // Saldos iniciais na tela, antes de submeter.
  await expect(page.getByTestId('saldo-origem')).toHaveText(/R\$\s1\.000,00/);
  await expect(page.getByTestId('saldo-destino')).toHaveText(/R\$\s200,00/);

  // Act: a espera pelo POST real é registrada antes do clique.
  const respostaPost = page.waitForResponse(
    (resposta) =>
      resposta.request().method() === 'POST' &&
      new URL(resposta.url()).pathname === '/api/transferencias',
  );
  await page.getByRole('button', { name: 'Transferir' }).click();
  const resposta = await respostaPost;
  const corpo: { comprovante: string } = await resposta.json();

  // Assert: requisição enviada pelo navegador e resposta real.
  expect(resposta.request().postDataJSON()).toEqual({
    contaOrigem: origem.numero,
    contaDestino: destino.numero,
    valor: 300,
  });
  expect(resposta.status()).toBe(201);
  expect(corpo.comprovante).toMatch(/^[0-9]{6}$/);

  // Assert: interface.
  await expect(page.getByRole('status')).toHaveText('Transferência realizada');
  await expect(page.getByTestId('comprovante-id')).toHaveText(corpo.comprovante);
  await expect(page.getByTestId('saldo-origem')).toHaveText(/R\$\s700,00/);
  await expect(page.getByTestId('saldo-destino')).toHaveText(/R\$\s500,00/);

  // Assert: estado no servidor, por consultas HTTP independentes da tela.
  expect(await consultarConta(request, origem.numero)).toEqual({ numero: origem.numero, saldo: 700 });
  expect(await consultarConta(request, destino.numero)).toEqual({ numero: destino.numero, saldo: 500 });
});

test('E2E-02 — saldo insuficiente é rejeitado e preserva os saldos', async ({ page, request }) => {
  // Arrange: outro par novo; nada é reaproveitado do E2E-01.
  const { origem, destino } = await prepararContas(request, {
    saldoOrigem: 1000,
    saldoDestino: 200,
  });
  test.info().annotations.push({
    type: 'contas',
    description: `origem=${origem.numero} destino=${destino.numero}`,
  });

  await page.goto('/transferencias');
  await page.getByLabel('Conta origem').fill(origem.numero);
  await page.getByLabel('Conta destino').fill(destino.numero);
  await page.getByLabel('Valor (R$)').fill('1001');

  await expect(page.getByTestId('saldo-origem')).toHaveText(/R\$\s1\.000,00/);
  await expect(page.getByTestId('saldo-destino')).toHaveText(/R\$\s200,00/);

  // Act: a espera pelo POST real é registrada antes do clique.
  const respostaPost = page.waitForResponse(
    (resposta) =>
      resposta.request().method() === 'POST' &&
      new URL(resposta.url()).pathname === '/api/transferencias',
  );
  await page.getByRole('button', { name: 'Transferir' }).click();
  const resposta = await respostaPost;
  const corpo: unknown = await resposta.json();

  // Assert: requisição enviada e rejeição de negócio real.
  expect(resposta.request().postDataJSON()).toEqual({
    contaOrigem: origem.numero,
    contaDestino: destino.numero,
    valor: 1001,
  });
  expect(resposta.status()).toBe(422);
  expect(corpo).toEqual({ erro: 'SALDO_INSUFICIENTE' });

  // Assert: interface. O Next também usa role="alert" (anunciador de rotas),
  // por isso o alerta da tela é identificado pelo texto.
  await expect(
    page.getByRole('alert').filter({ hasText: 'Saldo insuficiente' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByTestId('comprovante-id')).toHaveCount(0);
  await expect(page.getByTestId('saldo-origem')).toHaveText(/R\$\s1\.000,00/);
  await expect(page.getByTestId('saldo-destino')).toHaveText(/R\$\s200,00/);

  // Assert: estado no servidor, por consultas HTTP independentes da tela.
  expect(await consultarConta(request, origem.numero)).toEqual({ numero: origem.numero, saldo: 1000 });
  expect(await consultarConta(request, destino.numero)).toEqual({ numero: destino.numero, saldo: 200 });
});
