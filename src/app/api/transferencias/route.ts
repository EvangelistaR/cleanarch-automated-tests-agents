import { criarPostTransferencias } from '../../../api/transferencias/handler';
import { contasDemonstracao } from '../../../application/estado-contas';
import { criarOperacaoTransferencia } from '../../../application/transferencias/operacao';

export const dynamic = 'force-dynamic';

export const POST = criarPostTransferencias(criarOperacaoTransferencia(contasDemonstracao));
