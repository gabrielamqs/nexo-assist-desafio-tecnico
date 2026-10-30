# Nexo Assist — Plano de Desenvolvimento

Checklist vivo, por etapa. Decisões de stack e arquitetura estão em `stack-arquitetura.md` — esse doc não duplica isso, só referencia.

## Documentos de referência (fonte da verdade)

Este plano e o `stack-arquitetura.md` são um **resumo interpretado** das fontes abaixo, não um substituto delas. Antes de implementar qualquer etapa — especialmente Etapa 1 (regras do Anexo A), Etapa 6/8 (UI) e Etapa 9 (qualidade das decisões) — reler a fonte original, não confiar só neste resumo:

- **PRD do desafio**: `../Documentacao/Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf` — especificação completa (histórias de usuário, Anexo A: regras do service desk e prazos, Anexo B: formato dos dados de exemplo, critérios de avaliação).
- **Protótipo visual (Anexo C)**: https://app.pen.dev/s/swhm7Xfy1krKDIc-QyqE9J8ZI2xFB0qbNvHIncCXcLg — referência de layout e estilo das 5+ telas. É um app client-side (carrega via JS): `WebFetch`/leitura direta de HTML não renderiza nada útil, é preciso abrir num navegador (Claude in Chrome ou navegador normal) para ver o conteúdo.

Se alguma decisão registrada aqui parecer conflitar com o PDF ou o protótipo na hora de implementar, a fonte original vence — e vale atualizar este plano para refletir isso.

## Convenção de trabalho (regra fixa)

Ao final de cada etapa:
1. Código da etapa implementado e funcionando localmente.
2. `git add` já executado com os arquivos relevantes da etapa (nunca `git add -A` às cegas — revisar o que entra).
3. Uma descrição de commit pronta (mensagem sugerida, estilo convencional), **sem commitar**.
4. Resto da sessão pausa ali para você revisar o diff e decidir se commita, pede ajuste, ou segue.

Isso garante histórico de commits incremental (critério de avaliação "commits que contem a história do desenvolvimento") e te dá controle total sobre o que entra no repo.

## Regras de código (fixas, valem para todas as etapas)

- **Sem comentários.** Código limpo e autoexplicativo — nomes de variáveis/funções bons substituem comentário. Só abrir exceção para algo genuinamente não óbvio (uma invariante escondida, um workaround de bug específico), e mesmo assim em uma linha curta.
- **Boas práticas sempre**: DRY e SOLID onde fazem sentido para o contexto (não aplicar como regra cega onde adiciona abstração sem ganho real — ver nota sobre "Clean Architecture lite" em `stack-arquitetura.md`, o mesmo princípio de pragmatismo vale aqui).

---

## Etapa 0 — Setup inicial
- [x] Scaffold Next.js (App Router) + TypeScript strict
- [x] ESLint + Prettier
- [x] Vitest configurado
- [x] Estrutura de pastas base (ver `stack-arquitetura.md`)
- [x] `.env.example` (GEMINI_API_KEY, DATABASE_URL, etc.)
- [x] README inicial (placeholder, seção "como rodar")

## Etapa 1 — Domínio e dados de exemplo
- [ ] Tipos de domínio (Chamado, Conversa, Funcionário, Artigo)
- [ ] Regras puras de negócio — **ver PDF, Anexo A (p.4)** para tipos, categorias, prioridade/prazo, duplicidade e validação de abertura exatos; não reimplementar de memória
- [ ] Testes unitários das regras (Vitest)
- [ ] Dados de exemplo — **ver PDF, Anexo B (p.4)** para os requisitos mínimos

## Etapa 2 — Infraestrutura de dados
- [ ] Schema Drizzle (chamados, conversas, mensagens, usuários, artigos)
- [ ] Migrations
- [ ] Client SQLite (local) com seed dos dados de exemplo
- [ ] Repositório de chamados (`ticket-repository`) com simulação de indisponibilidade + retry/backoff

## Etapa 3 — Serviço de chamados via MCP
- [ ] `MCPServer` expondo ferramentas: consultar, criar, atualizar, transferir chamado, buscar central de ajuda
- [ ] Endpoint `/api/mcp`
- [ ] Teste manual/automatizado do server MCP isolado (sem agent)

## Etapa 4 — Auth
- [ ] Tabela de usuários com `role`
- [ ] Tela de login — **ver protótipo, Tela 1**
- [ ] Sessão simples, roteamento por papel (decisão própria — PRD não detalha login do analista, ver `stack-arquitetura.md`)

## Etapa 5 — Agent (Mastra)
- [ ] Configuração do agent com Gemini
- [ ] `MCPClient` consumindo o `/api/mcp`
- [ ] Prompt / regras do Anexo A injetadas no system prompt
- [ ] Structured output: decisão + confiança + justificativa
- [ ] Casos de uso (`application/usecases`) orquestrando domain + ports

## Etapa 6 — Chat do funcionário (UI)
- [ ] Telas 2 e 3 — **ver protótipo** para layout/comportamento esperado; rascunho só confirma após aprovação do funcionário (regra de abertura, Anexo A)
- [ ] Streaming de resposta em tempo real
- [ ] Limite de 30 mensagens/sessão (exigido no PRD, "O que construir" p.2); comportamento no limite é decisão própria — ver `stack-arquitetura.md`
- [ ] Painel de transparência — requisito "Visibilidade das decisões", PRD p.2 ("a parte mais importante do desafio"); formato (expandir ações / painel lateral / log) é decisão própria

## Etapa 7 — Transferência para analista
- [ ] Condições de transferência — **ver PDF, Anexo A, item "Transferência" (p.4)** para os gatilhos obrigatórios; limiar de confiança como fallback é decisão própria
- [ ] Estado da conversa (com agent / com analista) persistido
- [ ] Agent pausado durante atendimento humano (regra explícita do Anexo A)

## Etapa 8 — Console do analista (UI)
- [ ] Telas 4 e 5 — **ver protótipo** para layout; comportamento esperado descrito no PRD, histórias do analista (p.1) e "O que construir" item 6 (p.2)
- [ ] Assumir / devolver / encerrar atendimento
- [ ] Painel lateral com chamados do funcionário (privacidade: só os do funcionário da conversa — regra do Anexo A)

## Etapa 9 — Qualidade das decisões
- [ ] Conjunto de casos de avaliação (eval set) do agent — mensagens de exemplo + resultado esperado, cobrindo os critérios de **"Qualidade das decisões" e "Condução da conversa", PRD p.3 ("Como vamos avaliar")**
- [ ] Rodar eval como teste automatizado
- [ ] Ajustar limiar de confiança / prompt conforme resultado

## Etapa 10 — Estados de carregamento/erro e polimento
- [ ] Loading states (streaming, busca de chamados, indisponibilidade simulada)
- [ ] Tratamento de erro visível na UI ("tentando novamente")
- [ ] Revisão de fidelidade ao protótipo (Anexo C)

## Etapa 11 — README final
- [ ] Como rodar
- [ ] Visão geral da arquitetura (linkar/resumir `stack-arquitetura.md`)
- [ ] Como o agent decide o que fazer
- [ ] Como a qualidade das decisões foi garantida
- [ ] Trade-offs principais
- [ ] O que faria com mais tempo

## Etapa 12 — Deploy (diferencial)
- [ ] Deploy no Railway com volume persistente
- [ ] Proteção de chaves / limite de uso
- [ ] Documentar processo de deploy no README
