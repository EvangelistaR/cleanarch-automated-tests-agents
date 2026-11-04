import { criarGetContaPorId } from '../../../../api/contas/handlers';
import { criarOperacoesContas } from '../../../../application/contas/operacoes';
import { contasDemonstracao } from '../../../../application/estado-contas';

export const dynamic = 'force-dynamic';

const getContaPorId = criarGetContaPorId(criarOperacoesContas(contasDemonstracao));

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return getContaPorId(request, id);
}
