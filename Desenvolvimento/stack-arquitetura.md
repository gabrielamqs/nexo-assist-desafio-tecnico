# Nexo Assist — Stack, Decisões e Arquitetura

Documento de referência estável. Registra o que foi decidido e por quê. Não é checklist de progresso — isso fica em `plano-desenvolvimento.md`.

Este documento é um resumo interpretado, não a fonte original. Fontes: `../Documentacao/Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf` (PRD completo) e https://app.pen.dev/s/swhm7Xfy1krKDIc-QyqE9J8ZI2xFB0qbNvHIncCXcLg (protótipo Anexo C — requer navegador, é um app client-side). Em caso de dúvida ou conflito, a fonte original vence.

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Linguagem | TypeScript (strict) | Exigido pelo desafio |
| Framework do agent | Mastra | Preferência explícita do PRD; TS-nativo; já integra memory/workflows/MCP |
| Modelo de LLM | Google Gemini (`@ai-sdk/google`, `GEMINI_API_KEY`) | Tier gratuito real, sem necessidade de cartão vinculado |
| Protocolo agent ↔ serviço de chamados | MCP (`@mastra/mcp`: `MCPServer` + `MCPClient`) | Garante a separação "serviço de chamados separado do agent" como fronteira de processo/protocolo, não só de pasta |
| Frontend | Next.js (App Router) + React | Sugestão do PRD; app único (sem monorepo) |
| Estilização | Tailwind CSS v4 | Padrão do scaffold do Next.js; utilitários casam bem com Atomic Design e com a fidelidade ao protótipo |
| Organização de componentes | Atomic Design (atoms/molecules/organisms/templates) | Escalável sem overhead de ferramental extra |
| ORM / banco | Drizzle + SQLite | TS-first, leve, roda bem com arquivo local e com volume persistente |
| Testes | Vitest | Padrão de fato em projetos TS/Next |
| Deploy | Railway | Suporta volume persistente (SQLite sobrevive a restart); Vercel tem filesystem efêmero nas functions, incompatível com esse requisito |

## Por que não Vercel para o deploy

Funções serverless da Vercel têm filesystem efêmero e não compartilhado entre instâncias — um arquivo SQLite local não persiste de forma confiável. Railway roda um processo Node persistente com volume de disco real, então SQLite "puro" funciona sem troca de banco. Também evita conflito com outro projeto já hospedado no Vercel.

Ponto de atenção ao configurar o volume no Railway: o volume só existe em runtime (não em build) — a criação/migração do banco precisa acontecer no startup do app, com o caminho do arquivo apontando para o mount path absoluto do volume, não um caminho relativo.

## Arquitetura interna — "Clean Architecture lite"

Decisão: **não** aplicar Clean Architecture completa (4 camadas, DI container, DTO em toda fronteira). Isso seria overhead desnecessário para o tamanho do projeto. Em vez disso, isolar só onde há ganho real e justificável:

1. **Regras de negócio do Anexo A como funções puras e testáveis** (`/domain`) — cálculo de prioridade/prazo, checagem de duplicidade, validação de abertura de chamado. Sem dependência de framework, banco ou HTTP. Testadas via Vitest.
2. **Interface (`port`) para o provider de LLM** — permite trocar Gemini por outro provedor sem tocar no resto do agent (já tivemos essa troca de decisão na prática: Claude → Gemini).
3. **Interface (`port`) para o repositório de chamados** — necessário porque o PRD define que o sistema legado fica indisponível por alguns segundos às vezes; isola a simulação de falha/retry sem acoplar ao resto do código.

Fora esses três pontos, sem camadas adicionais só pelo nome.

## Estrutura de pastas (app único, sem monorepo)

```
/app
  /login
  /chat
  /analista
  /api
    /mcp              → MCPServer: expõe o serviço de chamados simulado como ferramentas MCP
    /chat             → endpoint de streaming do agent
    /auth             → login/sessão

/components           → Atomic Design
  /atoms
  /molecules
  /organisms
  /templates

/domain                → regras puras do Anexo A (prioridade, prazo, duplicidade, validação)
  ticket-rules.ts
  types.ts

/application            → casos de uso, orquestram domain + ports
  usecases/
    abrir-chamado.ts
    consultar-chamados.ts
    buscar-central-ajuda.ts
    transferir-para-analista.ts
  ports/
    llm-provider.ts      (interface)
    ticket-repository.ts (interface)

/infrastructure
  /db                   → schema Drizzle, migrations, client SQLite
  /llm                  → adapter Gemini implementando llm-provider
  /mcp                  → setup do MCPServer (expõe) e MCPClient (agent consome)
  /ticket-repo          → implementação SQLite de ticket-repository, com simulação de indisponibilidade

/agent                  → definição do agent Mastra, wiring de tools via MCPClient, prompts, structured output

/lib                    → utilitários compartilhados (sessão/auth, etc.)

/tests
  /domain               → testes unitários das regras puras
  /eval                 → conjunto de casos para avaliar decisões do agent
```

## Decisões de comportamento do agent

- **Grau de confiança ("segurança")**: o LLM retorna isso como parte de um *structured output* (schema Zod) junto com a decisão e a justificativa — não é um cálculo heurístico separado.
- **Transferência automática para analista**: regras explícitas do Anexo A (pedido do funcionário, caso crítico, chamado vencido) **+** fallback por limiar de confiança (a definir/ajustar durante os testes, ponto de partida ~70%).
- **Limite de 30 mensagens**: aviso visual a partir de ~25 mensagens; ao atingir 30, a conversa é automaticamente marcada como aguardando analista.
- **Indisponibilidade simulada do sistema legado**: taxa de falha configurável (~5-10%) no `ticket-repo`, com retry/backoff e estado de "tentando novamente" na UI.

## Auth / papéis

Tabela única de usuários com campo `role: 'funcionario' | 'analista'`. Mesma tela de login do protótipo; roteamento pós-login conforme o papel. (O PRD não detalha como o analista entra — essa é a lacuna preenchida por decisão própria.)

## Interface — fidelidade ao protótipo

Protótipo de referência: [pen.dev/s/swhm7Xfy1krKDIc-QyqE9J8ZI2xFB0qbNvHIncCXcLg](https://app.pen.dev/s/swhm7Xfy1krKDIc-QyqE9J8ZI2xFB0qbNvHIncCXcLg) (Anexo C do PRD).

Preservar: layout de login dividido (marketing + formulário), sidebar fina de navegação, bolhas de chat com tag/timestamp do agent, card de rascunho de chamado com campos estruturados e Confirmar/Editar/Cancelar, chips de resposta rápida, lista de seleção de chamados com status/prioridade, console do analista em 3 colunas (lista de conversas / chat ativo / painel de chamados do funcionário), badges coloridos de status.

Liberdade: paleta exata, tipografia, ícones, microcopy, telas extras.

## Dados de exemplo (Anexo B)

Pendente de criação: funcionários, 5-10 artigos de central de ajuda, chamados cobrindo os 4 estados exigidos (aberto, vencido, resolvido recente, de outro funcionário). Ver etapa correspondente em `plano-desenvolvimento.md`.
