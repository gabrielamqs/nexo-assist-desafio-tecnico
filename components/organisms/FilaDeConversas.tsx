import Link from "next/link";
import { Avatar } from "@/components/atoms/Avatar";
import { SeloDeEstadoDaConversa } from "@/components/atoms/Selo";
import type { ConversaNaFila } from "@/application/ports/conversas";
import { FILTROS_DA_FILA, type FiltroDaFila } from "@/domain/conversas";
import { formatarHora } from "@/lib/formatacao";

const ROTULO_DO_FILTRO: Record<FiltroDaFila, string> = {
  para_voce: "Para você",
  com_agent: "Com o agent",
  minhas: "Minhas",
  encerradas: "Encerradas",
  todas: "Todas",
};

type Props = {
  itens: ConversaNaFila[];
  contagem: Record<FiltroDaFila, number>;
  filtroAtivo: FiltroDaFila;
  conversaAtiva: string | null;
};

const enderecoDa = (filtro: FiltroDaFila, conversaId?: string) => {
  const parametros = new URLSearchParams({ filtro });
  if (conversaId !== undefined) parametros.set("conversa", conversaId);
  return `/analista?${parametros.toString()}`;
};

function descricaoDoItem({ conversa, ultimaMensagem }: ConversaNaFila) {
  if (ultimaMensagem === null) return "Sem mensagens ainda.";

  const prefixo =
    ultimaMensagem.autor === "agent"
      ? "Nexo: "
      : ultimaMensagem.autor === "analista"
        ? "Você: "
        : "";

  return conversa.estado === "aguardando_analista" &&
    conversa.resumoParaAnalista !== null
    ? conversa.resumoParaAnalista
    : `${prefixo}${ultimaMensagem.conteudo}`;
}

export function FilaDeConversas({
  itens,
  contagem,
  filtroAtivo,
  conversaAtiva,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-borda px-4 py-4">
        <h2 className="font-serif text-xl">Conversas</h2>
        <nav aria-label="Filtros da fila" className="flex flex-wrap gap-1.5">
          {FILTROS_DA_FILA.map((filtro) => {
            const ativo = filtro === filtroAtivo;
            return (
              <Link
                key={filtro}
                href={enderecoDa(filtro)}
                aria-current={ativo ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  ativo
                    ? "bg-primario-acao text-tinta-invertida"
                    : "text-tinta-media hover:bg-superficie"
                }`}
              >
                {ROTULO_DO_FILTRO[filtro]}
                <span className={ativo ? "" : "text-tinta-fraca"}>
                  {contagem[filtro]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {itens.length === 0 ? (
        <p className="px-4 py-6 text-sm text-tinta-fraca">
          Nenhuma conversa nesta aba.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-borda overflow-y-auto">
          {itens.map((item) => {
            const { conversa, funcionario } = item;
            const ativa = conversa.id === conversaAtiva;

            return (
              <li key={conversa.id}>
                <Link
                  href={enderecoDa(filtroAtivo, conversa.id)}
                  aria-current={ativa ? "true" : undefined}
                  className={`flex gap-3 px-4 py-3 transition-colors ${
                    ativa ? "bg-primario-suave" : "hover:bg-superficie-baixa"
                  }`}
                >
                  <Avatar nome={funcionario.nome} tamanho="compacto" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-tinta">
                        {funcionario.nome}
                      </span>
                      {item.ultimaMensagem !== null && (
                        <time
                          dateTime={item.ultimaMensagem.criadaEm.toISOString()}
                          className="shrink-0 text-xs text-tinta-fraca"
                        >
                          {formatarHora(item.ultimaMensagem.criadaEm)}
                        </time>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-tinta-media">
                      {descricaoDoItem(item)}
                    </p>
                    <SeloDeEstadoDaConversa estado={conversa.estado} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
