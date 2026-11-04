# SPEC-NEXT-001 — Evolução para Next.js

Versão 2.0 — Aula 02. Dependência: domínio e testes existentes da branch-base.

## Objetivo e invariantes

Evoluir o mesmo projeto para Next.js App Router. Preservar `src/domain/**`, `tests/domain/**`, `specs/transferencia.md` e as dependências existentes. Não utilizar `create-next-app` nem criar um projeto em subpasta.

Não implementar APIs ou formulário nesta etapa. A adaptação de erros será feita separadamente, conforme `specs/erros-aplicacao.md`.

## Regressão inicial

```bash
npm ci
npm test -- --runInBand
npm run typecheck
npm run build:ts
```

Registre resultados reais. A referência consultada tem quatro suítes e 60 testes; essa contagem não é uma obrigação para implementações próprias distintas.

Na base, não existem scripts `dev`, `build`, `start` ou `test:bdd`. Sua ausência antes da atividade não é um defeito funcional do domínio.

## Instalação e arquivos

A base já declara React, React DOM e seus tipos. Acrescente Next à raiz:

```bash
npm install --save-exact next@16.4.5
```

Use a versão indicada para esta revisão e versione o lockfile. Em projeto próprio sem React/tipos, o professor deverá adequar as dependências antes da migração, sem substituir o package.json inteiro.

Crie `src/app/layout.tsx` com `<html>` e `<body>` e `src/app/page.tsx` com uma mensagem estática de ambiente pronto. Não use fontes externas ou dados bancários nessa página. Mantenha os componentes síncronos e simples.

O pacote também fornece `next.config.ts` com `agentRules: false`, opção suportada pela versão fixada, para evitar que `next dev` acrescente instruções automáticas ao AGENTS.md pedagógico. Preserve essa configuração durante a atividade.

Copie os modelos reais fornecidos:

```bash
cp exemplos/jest.next.config.cjs jest.config.cjs
cp exemplos/tsconfig.next.json tsconfig.json
```

No PowerShell use `Copy-Item origem destino`. O Next pode regenerar `next-env.d.ts` e complementar o tsconfig; preserve strict, inclusão de testes/features e exclusões dos artefatos. Os tipos gerados em `.next` não devem ser escritos manualmente nem versionados.

Mescle ao package.json os scripts `dev: next dev`, `build: next build` e `start: next start`. Preserve todos os scripts originais, inclusive `build:ts`. Consulte `exemplos/package.scripts.final.json` como modelo de mesclagem, não como substituição do package.json.

O Jest principal passa a usar next/jest em ambiente Node. `jest.domain.config.cjs` permanece independente, com ts-jest e somente `tests/domain/**`. Não instale jsdom ou Testing Library nesta aula.

## Critérios de aceite

| ID | Verificação | Resultado esperado |
| --- | --- | --- |
| NEXT-01 | Jest principal após migração | Testes existentes preservados e aprovados |
| NEXT-02 | `npm run typecheck` | Exit code 0, strict ativo |
| NEXT-03 | `npm run build` | Build Next concluído |
| NEXT-04 | `npm run dev`, abrir `/` | Página mínima exibida |
| NEXT-05 | Comparar domínio e testes com baseline | Sem mudanças de comportamento, assinaturas ou asserções |
| NEXT-06 | Conferir scripts e lockfile | Novos scripts presentes; scripts originais e dependências preservados |
| NEXT-07 | Incluir `features/**/*.ts` no tsconfig | Arquivos BDD serão checados quando criados; não carregados como suítes Jest |

Execute primeiro `npm run build` para gerar tipos do Next e, depois, `npm run typecheck`, Jest e `npm run build:ts`. O build TypeScript isolado continua útil para domínio, mas não substitui o build Next.

Na CI inicial fornecida, troque apenas o passo de `npm run build:ts` por `npm run build` após concluir NEXT-01..07. Cucumber será adicionado à CI somente depois de sua etapa. Não copie ainda o workflow final.

## Evidência e parada

Registre a contagem antes/depois, os comandos, a página mínima e o build. Pare antes das APIs. Problemas de migração devem ser corrigidos na configuração, sem enfraquecer testes do domínio.
