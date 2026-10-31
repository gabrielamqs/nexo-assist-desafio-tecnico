import { MCPClient } from "@mastra/mcp";
import type { ServicoDeChamadosRemoto } from "@/agent/servico-remoto";

export const CHAVE_DO_SERVIDOR_DE_CHAMADOS = "chamados";

function textoDoConteudo(resultado: object): string | null {
  if (!("content" in resultado) || !Array.isArray(resultado.content)) {
    return null;
  }
  const [primeiro]: unknown[] = resultado.content;
  if (
    typeof primeiro === "object" &&
    primeiro !== null &&
    "text" in primeiro &&
    typeof primeiro.text === "string"
  ) {
    return primeiro.text;
  }
  return null;
}

export function extrairConteudo(resultado: unknown): unknown {
  if (typeof resultado !== "object" || resultado === null) return resultado;

  const texto = textoDoConteudo(resultado);

  if ("isError" in resultado && resultado.isError === true) {
    throw new Error(texto ?? "O serviço de chamados devolveu um erro.");
  }
  if (
    "structuredContent" in resultado &&
    resultado.structuredContent !== undefined
  ) {
    return resultado.structuredContent;
  }
  if (texto === null) return resultado;

  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

export function criarServicoDeChamadosViaMcp(
  url: URL,
): ServicoDeChamadosRemoto {
  const cliente = new MCPClient({
    id: "nexo-assist-agent",
    servers: { [CHAVE_DO_SERVIDOR_DE_CHAMADOS]: { url } },
  });

  let ferramentas: ReturnType<typeof cliente.listTools> | undefined;

  const listarFerramentas = () => {
    ferramentas ??= cliente.listTools().catch((erro: unknown) => {
      ferramentas = undefined;
      throw erro;
    });
    return ferramentas;
  };

  return async (ferramenta, entrada) => {
    const disponiveis = await listarFerramentas();
    const alvo = disponiveis[`${CHAVE_DO_SERVIDOR_DE_CHAMADOS}_${ferramenta}`];

    if (alvo?.execute === undefined) {
      throw new Error(
        `A ferramenta ${ferramenta} não está disponível no serviço de chamados.`,
      );
    }

    return extrairConteudo(await alvo.execute(entrada, {}));
  };
}
