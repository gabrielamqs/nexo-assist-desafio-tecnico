import { SeloDePrioridade, SeloDeStatus } from "@/components/atoms/Selo";
import { CampoDoCartao, Cartao } from "@/components/molecules/Cartao";
import type { DetalheDeChamado } from "@/domain/types";
import {
  formatarDataHoraCurta,
  formatarTempoDecorrido,
} from "@/lib/formatacao";

export function CartaoDeChamado({ chamado }: { chamado: DetalheDeChamado }) {
  return (
    <Cartao
      cabecalho={`Chamado · ${chamado.codigo}`}
      selo={<SeloDeStatus status={chamado.status} />}
    >
      <h3 className="font-semibold text-tinta">{chamado.titulo}</h3>
      <p className="text-sm text-tinta-media">{chamado.descricao}</p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CampoDoCartao rotulo="Categoria">{chamado.categoria}</CampoDoCartao>
        <CampoDoCartao rotulo="Prioridade">
          <SeloDePrioridade prioridade={chamado.prioridade} />
        </CampoDoCartao>
        <CampoDoCartao rotulo="Aberto em">
          {formatarDataHoraCurta(new Date(chamado.abertoEm))}
        </CampoDoCartao>
        <CampoDoCartao rotulo="Última atualização">
          <span suppressHydrationWarning>
            {formatarTempoDecorrido(new Date(chamado.atualizadoEm), new Date())}
          </span>
          {chamado.vencido && (
            <span className="block text-xs font-medium text-alta">
              prazo vencido
            </span>
          )}
        </CampoDoCartao>
      </dl>
    </Cartao>
  );
}
