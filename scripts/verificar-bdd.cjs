// Proteção contra execução vazia: exige os seis cenários @bdd-01..06 com todos os steps aprovados.
const fs = require('node:fs');

const ARQUIVO = 'reports/cucumber.json';
const ESPERADOS = ['bdd-01', 'bdd-02', 'bdd-03', 'bdd-04', 'bdd-05', 'bdd-06'];

function falhar(msg) {
  console.error(`verificar-bdd: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(ARQUIVO)) falhar(`${ARQUIVO} não encontrado`);
const features = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));

const encontrados = [];
for (const feature of features) {
  for (const cenario of feature.elements ?? []) {
    const ids = (cenario.tags ?? []).map((t) => t.name.replace(/^@/, '')).filter((t) => /^bdd-\d+$/.test(t));
    const steps = cenario.steps ?? [];
    if (steps.length === 0 || !steps.every((s) => s.result?.status === 'passed')) {
      falhar(`cenário "${cenario.name}" possui steps não aprovados`);
    }
    encontrados.push(...ids);
  }
}

const ordenados = [...encontrados].sort();
if (JSON.stringify(ordenados) !== JSON.stringify(ESPERADOS)) {
  falhar(`IDs esperados ${ESPERADOS.join(',')}; encontrados ${ordenados.join(',') || '(nenhum)'}`);
}
console.log(`verificar-bdd: OK — ${ESPERADOS.length} cenários aprovados (${ESPERADOS.join(', ')})`);
