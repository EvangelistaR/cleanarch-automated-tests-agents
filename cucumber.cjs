// Configuração efetiva do Cucumber.js (projeto CommonJS; sem "type": "module").
module.exports = {
  default: {
    // Onde estão os arquivos .feature (fornecido pelo professor).
    paths: ['specs/aula02/transferencias.feature'],
    // Registra o loader tsx para que o Cucumber consiga carregar TypeScript via require().
    requireModule: ['tsx/cjs'],
    // Arquivos carregados antes da execução: World/hooks e step definitions.
    require: [
      'features/support/**/*.ts',
      'features/step-definitions/**/*.ts',
    ],
    // Saída no terminal + relatórios HTML e JSON (o JSON alimenta scripts/verificar-bdd.cjs).
    format: [
      'progress',
      ['html', 'reports/cucumber.html'],
      ['json', 'reports/cucumber.json'],
    ],
    // Não publica relatórios no serviço público do Cucumber.
    publish: false,
    // 0 = execução sequencial no mesmo processo (facilita inspecionar isolamento).
    parallel: 0,
  },
};
