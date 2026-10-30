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

/domain                → regras puras do Anexo A
  types.ts              (tipos e constantes: tipo, categoria, prioridade, status, limites)
  prazos.ts             (horário útil, prazo por prioridade, chamado vencido)
  prioridade.ts         (impacto + urgência → prioridade)
  chamados.ts           (validação de abertura, duplicidade/reabertura, privacidade)
  transferencia.ts      (gatilhos de transferência para analista)

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
  /db                   → schema Drizzle, migrations, client SQLite, dados-exemplo.ts (Anexo B)
  /llm                  → adapter Gemini implementando llm-provider
  /mcp                  → setup do MCPServer (expõe) e MCPClient (agent consome)
  /ticket-repo          → implementação SQLite de ticket-repository, com simulação de indisponibilidade
  /central-de-ajuda     → busca nos artigos (ranqueamento por título/palavra-chave/conteúdo)

/agent                  → definição do agent Mastra, wiring de tools via MCPClient, prompts, structured output

/lib                    → utilitários compartilhados (leitura de env, sessão/auth, etc.)

/scripts                → scripts de linha de comando (seed do banco)

/tests
  /domain               → testes unitários das regras puras
  /eval                 → conjunto de casos para avaliar decisões do agent
```

## Decisões do domínio (lacunas do Anexo A preenchidas na Etapa 1)

O Anexo A dá a tabela de prioridade/prazo mas não define o expediente nem como contar "horas úteis". Decisões tomadas:

- **Expediente**: segunda a sexta, 8h às 18h — veio do próprio artigo da central de ajuda citado como exemplo no Anexo B ("Horário do service desk"). Logo, 1 dia útil = 10 horas úteis.
- **Crítica conta em hora corrida**, não útil: o mesmo artigo diz que chamados críticos têm plantão 24 horas, então o prazo de 1 hora não pode esperar o expediente abrir. As outras prioridades contam em horas úteis.
- **Feriados não são modelados** — só fim de semana. Um calendário de feriados seria o próximo passo natural, mas não muda a forma da função.
- **Fuso fixo em −03:00** em vez de biblioteca de timezone: o Brasil não adota horário de verão desde 2019, então o offset de São Paulo é constante. Evita uma dependência para ~20 linhas de aritmética.
- **Privacidade com exceção para o analista**: o Anexo A diz que informações de um chamado só vão para quem o abriu, mas o console do analista (Tela 4) mostra os chamados do funcionário atendido. A regra implementada é: funcionário vê só os próprios; analista vê os do funcionário em atendimento.
- **Impacto e urgência como entrada da prioridade**: a classificação vem do protótipo, que pergunta "Quem está sendo afetado?" com as opções Só eu / Minha equipe / Toda a empresa / Não sei. Impacto desconhecido não escala para crítica.
- **Transferência por limite de mensagens** entra junto dos gatilhos do Anexo A, já que a sessão termina em 30 mensagens e a conversa não pode simplesmente parar.

## Decisões de infraestrutura (Etapa 2)

- **Driver `@libsql/client`** em vez de `better-sqlite3`: a API é assíncrona (combina com route handlers do Next), aceita a URL no formato `file:` que já estava no `.env.example` e deixa uma saída pronta para Turso caso o volume do Railway dê problema. O Drizzle 0.45 não tem driver para o `node:sqlite` nativo, então a escolha era entre esses dois.
- **Migrations rodam no startup**, pelo `instrumentation.ts` do Next, não no build — o volume do Railway só existe em runtime. O mesmo hook cria a pasta do arquivo (o libsql não cria) e roda o seed.
- **Seed idempotente**: só insere se a tabela de usuários estiver vazia. `npm run db:seed` serve para popular manualmente; em uso normal o startup já resolve.
- **Tabela `atualizacoes_de_chamado`** em vez de concatenar texto na descrição: a história 3 do funcionário ("complementar um chamado com novas informações") fica com histórico de verdade, com autor e data, e a descrição original não se perde.
- **Cada atualização reinicia a contagem do prazo**, conforme o Anexo A ("o prazo vale para a primeira resposta e para cada atualização").
- **Indisponibilidade simulada dentro do repositório** (ele *é* o sistema legado), e **retry/backoff como decorator separado** (`comTentativas`). A falha é sorteada antes de qualquer escrita, então repetir a operação não corre risco de duplicar chamado — não precisa de chave de idempotência.
- **Busca na central de ajuda em memória**, com normalização de acentos e pontuação por título/palavra-chave/conteúdo, em vez de `LIKE` no SQL. São 9 artigos; isso dá busca sem acento e sem depender de collation do SQLite. Privilegia recall: o agent lê os artigos e decide se servem.

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
