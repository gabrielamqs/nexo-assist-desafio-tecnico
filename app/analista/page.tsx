import { Inbox } from "lucide-react";
import {
  carregarAtendimento,
  contarPorFiltro,
  listarFila,
} from "@/application/usecases/console-do-analista";
import { Avatar } from "@/components/atoms/Avatar";
import { SeloDeEstadoDaConversa } from "@/components/atoms/Selo";
import { AcoesDoAtendimento } from "@/components/organisms/AcoesDoAtendimento";
import { FilaDeConversas } from "@/components/organisms/FilaDeConversas";
import { PainelDeChamados } from "@/components/organisms/PainelDeChamados";
import { TranscricaoDaConversa } from "@/components/organisms/TranscricaoDaConversa";
import { LayoutDoConsole } from "@/components/templates/LayoutDoConsole";
import {
  FILTROS_DA_FILA,
  FILTRO_PADRAO,
  type FiltroDaFila,
} from "@/domain/conversas";
import {
  repositorioDeChamados,
  repositorioDeConversas,
  repositorioDeUsuarios,
} from "@/infrastructure/dependencias";
import { paraMensagemNaTela } from "@/lib/mensagem-na-tela";
import { exigirUsuario } from "@/lib/sessao-servidor";

export const instant = false;

const ehFiltro = (valor: unknown): valor is FiltroDaFila =>
  typeof valor === "string" &&
  (FILTROS_DA_FILA as readonly string[]).includes(valor);

const primeiroNomeDe = (nome: string) => nome.split(" ")[0] ?? nome;

export default async function PaginaDoAnalista({
  searchParams,
}: PageProps<"/analista">) {
  const analista = await exigirUsuario("analista");
  const parametros = await searchParams;

  const filtro = ehFiltro(parametros.filtro)
    ? parametros.filtro
    : FILTRO_PADRAO;
  const conversaPedida =
    typeof parametros.conversa === "string" ? parametros.conversa : null;

  const conversas = repositorioDeConversas();
  const [itens, contagem] = await Promise.all([
    listarFila({ conversas }, { analista, filtro }),
    contarPorFiltro({ conversas }, analista, FILTROS_DA_FILA),
  ]);

  const atendimento =
    conversaPedida === null
      ? null
      : await carregarAtendimento(
          {
            conversas,
            chamados: repositorioDeChamados(),
            usuarios: repositorioDeUsuarios(),
          },
          { analista, conversaId: conversaPedida },
        ).catch(() => null);

  return (
    <LayoutDoConsole
      analista={analista}
      fila={
        <FilaDeConversas
          itens={itens}
          contagem={contagem}
          filtroAtivo={filtro}
          conversaAtiva={atendimento?.conversa.id ?? null}
        />
      }
      painel={
        atendimento === null ? null : (
          <PainelDeChamados
            primeiroNome={primeiroNomeDe(atendimento.funcionario.nome)}
            chamados={atendimento.chamados}
            agora={new Date()}
          />
        )
      }
    >
      {atendimento === null ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <Inbox className="h-8 w-8 text-tinta-fraca" aria-hidden="true" />
          <p className="text-sm text-tinta-media">
            Escolha uma conversa na lista para ver o histórico e os chamados do
            funcionário.
          </p>
        </div>
      ) : (
        <>
          <header className="flex items-center gap-3 border-b border-borda px-4 py-3 sm:px-6">
            <Avatar nome={atendimento.funcionario.nome} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-tinta">
                {atendimento.funcionario.nome}
              </p>
              <p className="truncate text-xs text-tinta-fraca">
                {atendimento.funcionario.departamento}
              </p>
            </div>
            <SeloDeEstadoDaConversa estado={atendimento.conversa.estado} />
          </header>

          {atendimento.conversa.resumoParaAnalista !== null && (
            <div className="border-b border-borda bg-primario-suave px-4 py-3 sm:px-6">
              <p className="text-xs font-medium tracking-wide text-primario uppercase">
                Resumo do caso
              </p>
              <p className="mt-1 text-sm text-tinta">
                {atendimento.conversa.resumoParaAnalista}
              </p>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            <TranscricaoDaConversa
              mensagens={atendimento.mensagens.map(paraMensagemNaTela)}
            />
          </div>

          <AcoesDoAtendimento
            conversaId={atendimento.conversa.id}
            primeiroNome={primeiroNomeDe(atendimento.funcionario.nome)}
            podeAssumir={atendimento.podeAssumir}
            podeDevolver={atendimento.podeDevolver}
            podeEncerrar={atendimento.podeEncerrar}
            podeResponder={atendimento.podeResponder}
            aguardando={atendimento.conversa.estado === "aguardando_analista"}
          />
        </>
      )}
    </LayoutDoConsole>
  );
}
