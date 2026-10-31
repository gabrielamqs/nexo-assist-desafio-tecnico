import { createInterface } from "node:readline/promises";
import {
  cancelarProposta,
  confirmarProposta,
} from "@/application/usecases/confirmar-proposta";
import { responderMensagem } from "@/application/usecases/responder-mensagem";
import type { Mensagem, Usuario } from "@/domain/types";
import { prepararBancoDeDados } from "@/infrastructure/db/client";
import {
  assistente,
  repositorioDeChamados,
  repositorioDeConversas,
  repositorioDeUsuarios,
} from "@/infrastructure/dependencias";
import { urlDoServidorMcp } from "@/lib/env";

const AJUDA = `Comandos: /confirmar, /cancelar, /sair. Qualquer outro texto vai para o agent.
O serviço de chamados precisa estar no ar (npm run dev) em ${urlDoServidorMcp()}.`;

function mostrarDecisao(mensagem: Mensagem) {
  const decisao = mensagem.decisao;
  console.log(`\nNexo Assist: ${mensagem.conteudo}`);
  if (decisao === null) return;

  const acoes = decisao.acoes.map(
    (acao) => `${acao.sucesso ? "✓" : "✗"} ${acao.descricao}`,
  );
  console.log(`  ações:         ${acoes.join(" · ") || "nenhuma"}`);
  console.log(`  entendimento:  ${decisao.entendimento}`);
  console.log(`  intenção:      ${decisao.intencao}`);
  console.log(`  confiança:     ${Math.round(decisao.confianca * 100)}%`);
  console.log(`  justificativa: ${decisao.justificativa}`);
  if (decisao.opcoesRapidas.length > 0) {
    console.log(`  opções:        ${decisao.opcoesRapidas.join(" | ")}`);
  }
  if (decisao.proposta !== null) {
    console.log(`  proposta:      ${JSON.stringify(decisao.proposta)}`);
  }
  if (decisao.transferencia.recomendada) {
    console.log(`  transferir:    sim (${decisao.transferencia.motivo})`);
  }
}

async function mensagemComPropostaPendente(funcionario: Usuario) {
  const conversa = await repositorioDeConversas().buscarAtiva(funcionario.id);
  if (conversa === null) return null;
  const mensagens = await repositorioDeConversas().listarMensagens(conversa.id);
  return (
    mensagens.findLast(
      (mensagem) => mensagem.decisao?.proposta?.situacao === "pendente",
    ) ?? null
  );
}

async function main() {
  await prepararBancoDeDados();

  const email = process.argv[2] ?? "ana.souza@nexo.com.br";
  const funcionario = await repositorioDeUsuarios().buscarPorEmail(email);
  if (funcionario === null) throw new Error(`Usuário ${email} não encontrado.`);

  console.log(`Conversando como ${funcionario.nome}. ${AJUDA}\n`);
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const texto = (await terminal.question("\nVocê: ")).trim();
    if (texto === "/sair") break;
    if (texto === "") continue;

    if (texto === "/confirmar" || texto === "/cancelar") {
      const pendente = await mensagemComPropostaPendente(funcionario);
      if (pendente === null) {
        console.log("Não há rascunho pendente.");
        continue;
      }
      const pedido = { funcionario, mensagemId: pendente.id };
      const resposta =
        texto === "/confirmar"
          ? (
              await confirmarProposta(
                {
                  conversas: repositorioDeConversas(),
                  chamados: repositorioDeChamados(),
                },
                pedido,
              )
            ).mensagem
          : await cancelarProposta(
              { conversas: repositorioDeConversas() },
              pedido,
            );
      mostrarDecisao(resposta);
      continue;
    }

    const inicio = Date.now();
    const resultado = await responderMensagem(
      { conversas: repositorioDeConversas(), assistente: assistente() },
      { funcionario, texto },
      {
        aoUsarFerramenta: (chamada) =>
          console.log(
            `  … ${chamada.ferramenta}${chamada.sucesso ? "" : " (falhou)"}`,
          ),
      },
    );

    if (resultado.situacao === "com_analista") {
      console.log("A conversa está com um analista; o agent não responde.");
      continue;
    }
    mostrarDecisao(resultado.resposta);
    console.log(
      `  tempo:         ${((Date.now() - inicio) / 1000).toFixed(1)} s`,
    );
  }

  terminal.close();
}

main().catch((erro: unknown) => {
  console.error(erro);
  process.exitCode = 1;
});
