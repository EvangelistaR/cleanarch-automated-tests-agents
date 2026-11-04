import { criarGetContas, criarPostContas } from '../../../api/contas/handlers';
import { criarOperacoesContas } from '../../../application/contas/operacoes';
import { contasDemonstracao } from '../../../application/estado-contas';

export const dynamic = 'force-dynamic';

const operacoes = criarOperacoesContas(contasDemonstracao);

export const GET = criarGetContas(operacoes);
export const POST = criarPostContas(operacoes);
