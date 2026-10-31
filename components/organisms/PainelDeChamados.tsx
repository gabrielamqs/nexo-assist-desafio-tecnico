import { SeloDePrioridade, SeloDeStatus } from "@/components/atoms/Selo";
import type { ChamadoDoFuncionario } from "@/application/usecases/console-do-analista";
import { estaEmAberto } from "@/domain/chamados";
import {
  formatarDataHoraCurta,
  formatarTempoDecorrido,
} from "@/lib/formatacao";

type Props = {
  primeiroNome: string;
  chamados: ChamadoDoFuncionario[];
  agora: Date;
};

function ItemDoChamado({
  chamado,
  agora,
}: {
  chamado: ChamadoDoFuncionario;
  agora: Date;
}) {
  return (
    <li className="space-y-1.5 rounded-lg border border-borda p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-tinta-fraca">
          {chamado.codigo}
        </span>
        <SeloDeStatus status={chamado.status} />
      </div>
      <p className="text-sm font-medium text-tinta">{chamado.titulo}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-fraca">
        <SeloDePrioridade prioridade={chamado.prioridade} />
        <span>{chamado.categoria}</span>
        <span>{formatarTempoDecorrido(chamado.atualizadoEm, agora)}</span>
      </div>
      {chamado.vencido ? (
        <p className="text-xs font-medium text-alta-texto">
          Prazo vencido em {formatarDataHoraCurta(chamado.prazoDeResposta)}
        </p>
      ) : (
        estaEmAberto(chamado) && (
          <p className="text-xs text-tinta-fraca">
            Prazo até {formatarDataHoraCurta(chamado.prazoDeResposta)}
          </p>
        )
      )}
    </li>
  );
}

export function PainelDeChamados({ primeiroNome, chamados, agora }: Props) {
  const desteAtendimento = chamados.filter(
    (chamado) => chamado.desteAtendimento,
  );
  const outros = chamados.filter((chamado) => !chamado.desteAtendimento);
  const emAberto = chamados.filter(estaEmAberto).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-borda px-4 py-4">
        <h2 className="text-sm font-semibold text-tinta">
          Chamados de {primeiroNome}
        </h2>
        <p className="mt-0.5 text-xs text-tinta-fraca">
          {emAberto} em aberto · {chamados.length - emAberto} resolvidos
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {chamados.length === 0 && (
          <p className="text-sm text-tinta-fraca">
            Este funcionário não tem chamados.
          </p>
        )}

        {desteAtendimento.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-medium tracking-wide text-tinta-fraca uppercase">
              Desta conversa
            </h3>
            <ul className="space-y-2">
              {desteAtendimento.map((chamado) => (
                <ItemDoChamado
                  key={chamado.codigo}
                  chamado={chamado}
                  agora={agora}
                />
              ))}
            </ul>
          </section>
        )}

        {outros.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-medium tracking-wide text-tinta-fraca uppercase">
              {desteAtendimento.length > 0 ? "Outros chamados" : "Chamados"}
            </h3>
            <ul className="space-y-2">
              {outros.map((chamado) => (
                <ItemDoChamado
                  key={chamado.codigo}
                  chamado={chamado}
                  agora={agora}
                />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
