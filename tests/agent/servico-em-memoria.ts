import type { ServicoDeChamadosRemoto } from "@/agent/servico-remoto";
import { criarCentralDeAjuda } from "@/infrastructure/central-de-ajuda/repositorio-sqlite";
import { construirChamadosDeExemplo } from "@/infrastructure/db/dados-exemplo";
import { chamados } from "@/infrastructure/db/schema";
import { criarServidorMcp } from "@/infrastructure/mcp/servidor";
import { criarRepositorioDeChamados } from "@/infrastructure/ticket-repo/repositorio-sqlite";
import { criarBancoComArtigos } from "../infrastructure/banco-de-teste";

export async function criarServicoEmMemoria(agora: Date) {
  const banco = await criarBancoComArtigos();
  await banco.insert(chamados).values(construirChamadosDeExemplo(agora));

  const repositorioDeChamados = criarRepositorioDeChamados({
    banco,
    agora: () => agora,
  });

  const servidor = criarServidorMcp({
    repositorioDeChamados,
    centralDeAjuda: criarCentralDeAjuda(banco),
    agora: () => agora,
  });

  const servico: ServicoDeChamadosRemoto = async (ferramenta, entrada) => {
    const resultado = (await servidor.executeTool(ferramenta, entrada)) as {
      output: unknown;
    };
    return resultado.output;
  };

  return { banco, servico, repositorioDeChamados };
}
