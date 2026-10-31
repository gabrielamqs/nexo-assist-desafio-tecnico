import { Search } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/atoms/Avatar";
import { Selo, SeloDeEstadoDaConversa } from "@/components/atoms/Selo";
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
  busca: string;
  conversaAtiva: string | null;
};

const enderecoDa = (
  filtro: FiltroDaFila,
  busca: string,
  conversaId?: string,
) => {
  const parametros = new URLSearchParams({ filtro });
  if (busca !== "") parametros.set("busca", busca);
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
  busca,
  conversaAtiva,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 px-4 pt-4 pb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="flex-1 text-xl font-bold tracking-tight text-tinta">
            Conversas
          </h2>
          <Selo tom="resolvido" forma="pilula">
            Disponível
          </Selo>
        </div>

        <form action="/analista" className="relative flex">
          <input type="hidden" name="filtro" value={filtroAtivo} />
          <label htmlFor="busca" className="sr-only">
            Pesquisar conversa ou chamado
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-tinta-fraca"
          />
          <input
            id="busca"
            name="busca"
            type="search"
            defaultValue={busca}
            placeholder="Pesquisar conversa ou chamado"
            className="h-9 w-full rounded-full bg-superficie-baixa pr-3 pl-9 text-sm text-tinta placeholder:text-tinta-fraca focus:outline-2 focus:outline-offset-2 focus:outline-primario"
          />
        </form>

        <nav aria-label="Filtros da fila" className="flex flex-wrap gap-1">
          {FILTROS_DA_FILA.map((filtro) => {
            const ativo = filtro === filtroAtivo;
            return (
              <Link
                key={filtro}
                href={enderecoDa(filtro, busca)}
                aria-current={ativo ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors ${
                  ativo
                    ? "bg-primario-suave text-primario-texto"
                    : "bg-superficie-baixa text-tinta-media hover:text-tinta"
                }`}
              >
                <span className="font-medium">{ROTULO_DO_FILTRO[filtro]}</span>
                <span
                  className={`font-semibold ${ativo ? "" : "text-tinta-fraca"}`}
                >
                  {contagem[filtro]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {itens.length === 0 ? (
        <p className="px-4 py-6 text-sm text-tinta-fraca">
          {busca === ""
            ? "Nenhuma conversa nesta aba."
            : `Nenhuma conversa encontrada para "${busca}".`}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {itens.map((item) => {
            const { conversa, funcionario } = item;
            const ativa = conversa.id === conversaAtiva;

            return (
              <li key={conversa.id}>
                <Link
                  href={enderecoDa(filtroAtivo, busca, conversa.id)}
                  aria-current={ativa ? "true" : undefined}
                  className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors ${
                    ativa ? "bg-superficie-baixa" : "hover:bg-superficie-baixa"
                  }`}
                >
                  <Avatar nome={funcionario.nome} tamanho="grande" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-tinta">
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
                    <p className="line-clamp-2 text-sm text-tinta-fraca">
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
