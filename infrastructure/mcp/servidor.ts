import { MCPServer } from "@mastra/mcp";
import {
  criarFerramentasDeChamados,
  type DependenciasDasFerramentas,
} from "./ferramentas";

export const NOME_DO_SERVIDOR_MCP = "servico-de-chamados-nexo";

export const INSTRUCOES_DO_SERVIDOR_MCP = `Serviço de chamados do service desk de TI da Nexo.

Antes de abrir um chamado novo, consulte os chamados do funcionário e a central de ajuda:
um chamado aberto sobre o mesmo problema deve ser atualizado, não duplicado, e um resolvido
há até 7 dias pode ser reaberto.

Todas as ferramentas de chamado exigem o identificador do funcionário e só devolvem os
chamados dele.`;

export const criarServidorMcp = (dependencias: DependenciasDasFerramentas) =>
  new MCPServer({
    id: NOME_DO_SERVIDOR_MCP,
    name: "Serviço de chamados da Nexo",
    version: "1.0.0",
    description:
      "Consulta, abertura, atualização e transferência de chamados, mais a central de ajuda.",
    instructions: INSTRUCOES_DO_SERVIDOR_MCP,
    tools: criarFerramentasDeChamados(dependencias),
  });
