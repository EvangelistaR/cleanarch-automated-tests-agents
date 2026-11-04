# SPEC-TRACE-001 — Rastreabilidade da Aula 02

Versão 2.0. Esta é a matriz para registrar evidências, não uma declaração de testes já aprovados.

## 1. Etapas e evidências

| Grupo | Requisitos | Evidência esperada |
| --- | --- | --- |
| Regressão | BANK-SPEC-001 e testes antigos | Quantidade antes/depois, testes preservados, Jest aprovado |
| Next | NEXT-01..07 | Scripts, tipos, build e página mínima |
| Erros | ERR-01..04 | Classe/códigos, mensagens preservadas, regressão |
| Contas | CONTA-01..17 | Contratos HTTP e estado dos objetos reais |
| Mocks de contas | CMOCK-01..09 | Status/corpo/Location, delegação e ausência de chamada em erro estrutural |
| Integração de contas | CINT-01..10 | Map, Conta real, duplicidade, consultas e isolamento |
| Fluxos cruzados | FLUXO-01..04 | Mesmo Map local, criar/consultar/transferir/consultar |
| Transferência | API-01..13 | Respostas HTTP e ausência de efeitos indevidos |
| Mocks de transferência | MOCK-01..05 | Chamadas, argumentos e classificação de erros |
| Integração de transferência | INT-01..06 | Domínio real, dois saldos, limites e recibo inválido |
| BDD | BDD-01..06 | World, steps e seis cenários realmente aprovados |
| Qualidade | QUAL-01..04 | LCOV, CI, relatório Stryker e análise Sonar |

Os IDs de mocks/integração e os IDs funcionais podem ser demonstrados pelo mesmo teste quando suas asserções cobrirem ambos. Não exigir um arquivo ou teste duplicado por ID; preencher a correspondência com títulos reais.

## 2. Correspondência de transferência

| Requisito | BDD fornecido | Evidência Jest mínima |
| --- | --- | --- |
| API-01: sucesso 300 | BDD-01 | MOCK-01 e INT-01 |
| API-02: saldo exato | BDD-02 | INT-03 |
| API-03: saldo insuficiente | BDD-03 | MOCK-04 e INT-02 |
| API-04: zero/negativo | BDD-04 e BDD-05 | MOCK-02 e teste parametrizado API-04 |
| API-05: tipo/precisão inválidos | Sem cenário fornecido | Testes API-05 |
| API-06: conta malformada | Sem cenário fornecido | MOCK-03 e testes API-06 |
| API-07: conta inexistente | Sem cenário fornecido | Teste API-07 e INT-05 |
| API-08: mesma conta | Sem cenário fornecido | Teste API-08 e INT-05 |
| API-09: JSON malformado | BDD-06 | MOCK-03 e testes API-09 |
| API-10: zeros à esquerda/centavos | Sem cenário fornecido | Testes API-10 |
| API-11: erro inesperado | Sem cenário fornecido | MOCK-05 |
| API-12: precedência | Sem cenário fornecido | Testes API-12 |
| API-13: recibo inválido | Sem cenário fornecido | INT-06 |
| Isolamento | Novo World em cada cenário | INT-04 |

Existem somente seis IDs BDD nesta versão. Não há BDD-07..11 nem BDD-C. O Cucumber é obrigatório e seus resultados não substituem a cobertura dos requisitos sem Gherkin.

## 3. Registro por teste

Criar, no relatório do aluno, uma linha para cada requisito usando esta estrutura:

| ID(s) | Arquivo e título real do teste/cenário | Asserções verificadas | Comando e resultado | Evidência |
| --- | --- | --- | --- | --- |
| Informar ID | Informar caminho e título existentes | Descrever resultados observados | Registrar saída real | Log/run/relatório correspondente |

Em TDD, registrar critério, RED observado, alteração mínima, GREEN e eventual refatoração. Em configuração, registrar regressão antes/depois. O documento não presume que cada novo teste teve um RED de negócio.

## 4. Sequência final de validação

```bash
npm test -- --runInBand
npm run typecheck
npm run build
npm run test:coverage
npm run test:bdd -- --order random
npm run test:bdd:full
npx jest --config jest.domain.config.cjs --runInBand
npx stryker run
docker compose --profile scan run --rm scanner
```

Além desses comandos: smoke manual pelo servidor Next e URL do run da CI final. A sequência pressupõe dependências instaladas, BDD implementado e servidor Sonar previamente preparado. Não executá-la na base ainda sem APIs como se toda a solução já existisse.

## 5. Decisões já definidas

| Tema | Decisão desta revisão |
| --- | --- |
| Caminho da feature | `specs/transferencias.feature` |
| Estado demonstrativo | Map inicialmente vazio, compartilhado no mesmo processo |
| Classificação de erros | ErroNegocio conforme SPEC-ERR-001 |
| Framework HTTP | Next.js App Router; factories Request/Response |
| Unidade monetária | Reais, no máximo duas casas; regras preservadas da Aula 01 |
| Comprovante | String com seis dígitos; stub nos testes, gerador padrão no servidor |
| Workflow | `.github/workflows/ci.yml`, evoluído nas etapas |
| Sonar | `docker-compose.yml` e token local em `.env` |

Uma nova decisão não prevista deve ser registrada explicitamente; não modificar a matriz nem o requisito para encobrir comportamento incorreto.
