# Nexo Assist — Plano de Desenvolvimento

Checklist vivo, por etapa. Decisões de stack e arquitetura estão em `stack-arquitetura.md` — esse doc não duplica isso, só referencia.

## Documentos de referência (fonte da verdade)

Este plano e o `stack-arquitetura.md` são um **resumo interpretado** das fontes abaixo, não um substituto delas. Antes de implementar qualquer etapa — especialmente Etapa 1 (regras do Anexo A), Etapa 6/8 (UI) e Etapa 9 (qualidade das decisões) — reler a fonte original, não confiar só neste resumo:

- **PRD do desafio**: `../Documentacao/Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf` — especificação completa (histórias de usuário, Anexo A: regras do service desk e prazos, Anexo B: formato dos dados de exemplo, critérios de avaliação).
- **Protótipo visual (Anexo C)**: https://app.pen.dev/s/swhm7Xfy1krKDIc-QyqE9J8ZI2xFB0qbNvHIncCXcLg — referência de layout e estilo das 5+ telas. É um app client-side (carrega via JS): `WebFetch`/leitura direta de HTML não renderiza nada útil, é preciso abrir num navegador (Claude in Chrome ou navegador normal) para ver o conteúdo.
- **Export do protótipo**: `nexo.pen` — o mesmo protótipo exportado como JSON, e a forma **preferida** de consultá-lo: traz a árvore completa das 6 telas com nome, tamanho, espaçamento, cor, fonte e texto de cada nó, além do dicionário de variáveis de design em `variables`. Ler com um script (`json.load`) e percorrer `children` recursivamente; não abrir o arquivo inteiro de uma vez (148 KB). As cores aparecem como `$nome` (referência a `variables`) ou hex literal.

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
- **Valores de design centralizados, nunca literais espalhados pelo código.** Cor é o caso mais claro — nenhum hex, nenhuma cor da paleta padrão do Tailwind, nenhum `text-white`/`bg-white` solto num componente. Sempre via token nomeado semanticamente (pela função, não pela cor), definido em um lugar só. O mesmo princípio vale para outros valores de design que se repetem (espaçamento, raio de borda, etc.) se aparecer o mesmo padrão. *Obs: regra percebida durante o desenvolvimento, não prevista desde o início — surgiu do commit `refact: centraliza tokens de cor com nomes semânticos`, documentado em "Convenção de estilo" em `stack-arquitetura.md`.*
- **Variáveis de ambiente nunca lidas direto do código** (`process.env.X` espalhado). Sempre através de um único ponto de leitura/validação (`lib/env.ts`), que define o schema, os defaults e o que é obrigatório em produção, e expõe acessores (`ambiente()`, `chaveDoGemini()`, etc.) para o resto do app consumir. *Obs: regra percebida durante o desenvolvimento, não prevista desde o início — mesmo motivo do token de cor: não havia um padrão único até então.*

---

## Etapa 0 — Setup inicial
- [x] Scaffold Next.js (App Router) + TypeScript strict
- [x] ESLint + Prettier
- [x] Vitest configurado
- [x] Estrutura de pastas base (ver `stack-arquitetura.md`)
- [x] `.env.example` (GEMINI_API_KEY, DATABASE_URL, etc.)
- [x] README inicial (placeholder, seção "como rodar")

## Etapa 1 — Domínio e dados de exemplo
- [x] Tipos de domínio (Chamado, Conversa, Funcionário, Artigo)
- [x] Regras puras de negócio — **ver PDF, Anexo A (p.4)** para tipos, categorias, prioridade/prazo, duplicidade e validação de abertura exatos; não reimplementar de memória
- [x] Testes unitários das regras (Vitest)
- [x] Dados de exemplo — **ver PDF, Anexo B (p.4)** para os requisitos mínimos

## Etapa 2 — Infraestrutura de dados
- [x] Schema Drizzle (chamados, conversas, mensagens, usuários, artigos)
- [x] Migrations
- [x] Client SQLite (local) com seed dos dados de exemplo
- [x] Repositório de chamados (`ticket-repository`) com simulação de indisponibilidade + retry/backoff

## Etapa 3 — Serviço de chamados via MCP
- [x] `MCPServer` expondo ferramentas: consultar, criar, atualizar, transferir chamado, buscar central de ajuda
- [x] Endpoint `/api/mcp`
- [x] Teste manual/automatizado do server MCP isolado (sem agent)

## Etapa 4 — Auth
- [x] Tabela de usuários com `role`
- [x] Tela de login — **ver protótipo, Tela 1**
- [x] Sessão simples, roteamento por papel (decisão própria — PRD não detalha login do analista, ver `stack-arquitetura.md`)

## Etapa 5 — Agent (Mastra)
- [x] Configuração do agent com Gemini
- [x] `MCPClient` consumindo o `/api/mcp`
- [x] Prompt / regras do Anexo A injetadas no system prompt
- [x] Structured output: decisão + confiança + justificativa
- [x] Casos de uso (`application/usecases`) orquestrando domain + ports
- [x] Teste de ponta a ponta com o Gemini real (`npm run conversar` e pela tela)

## Etapa 6 — Chat do funcionário (UI)
- [x] Telas 2 e 3 — **ver protótipo** para layout/comportamento esperado; rascunho só confirma após aprovação do funcionário (regra de abertura, Anexo A)
- [x] Streaming de resposta em tempo real
- [x] Limite de 30 mensagens/sessão (exigido no PRD, "O que construir" p.2); comportamento no limite é decisão própria — ver `stack-arquitetura.md`
- [x] Painel de transparência — requisito "Visibilidade das decisões", PRD p.2 ("a parte mais importante do desafio"); formato (expandir ações / painel lateral / log) é decisão própria

## Etapa 7 — Transferência para analista
- [x] Condições de transferência — **ver PDF, Anexo A, item "Transferência" (p.4)** para os gatilhos obrigatórios; limiar de confiança como fallback é decisão própria
- [x] Estado da conversa (com agent / com analista) persistido
- [x] Agent pausado durante atendimento humano (regra explícita do Anexo A)

## Etapa 8 — Console do analista (UI)
- [x] Telas 4 e 5 — **ver protótipo** para layout; comportamento esperado descrito no PRD, histórias do analista (p.1) e "O que construir" item 6 (p.2)
- [x] Assumir / devolver / encerrar atendimento
- [x] Painel lateral com chamados do funcionário (privacidade: só os do funcionário da conversa — regra do Anexo A)

## Etapa 9 — Qualidade das decisões
- [x] Conjunto de casos de avaliação (eval set) do agent — `tests/eval/casos.ts`, 14 casos cobrindo os critérios de **"Qualidade das decisões" e "Condução da conversa", PRD p.3 ("Como vamos avaliar")**. Entraram os casos observados no teste real da Etapa 6: "a impressora do meu andar parou" virando prioridade sem perguntar e a urgência saindo pronta depois de "Só eu"
- [x] Rodar eval como teste automatizado — `npm run eval`, fora do `npm test` porque depende do Gemini real (ver `stack-arquitetura.md`)
- [x] Ajustar limiar de confiança / prompt conforme resultado

## Etapa 10 — Estados de carregamento/erro e polimento
- [x] Loading states (streaming, busca de chamados, indisponibilidade simulada) — ações ao vivo e "pensando" no chat, e `carregando` no `Botao`, que mostra qual ação do console está rodando
- [x] Tratamento de erro visível na UI — ação que falhou aparece com X e o motivo no "Como decidi"; o rascunho mostra o erro e libera o botão para confirmar de novo
- [x] Revisão de fidelidade ao protótipo (Anexo C): separador de dia ("Hoje"/"Ontem") no chat e na transcrição do analista, e o selo do cabeçalho seguindo o estado da conversa
- [x] O chat do funcionário se atualiza sozinho quando o analista assume, responde, devolve ou encerra

## Etapa 11 — README final
- [x] Como rodar
- [x] Visão geral da arquitetura (linkar/resumir `stack-arquitetura.md`)
- [x] Como o agent decide o que fazer
- [x] Como a qualidade das decisões foi garantida
- [x] Trade-offs principais
- [x] O que faria com mais tempo
- [x] Escolha do modelo e segurança/privacidade (o PRD pede que a escolha do provedor seja explicada no README)

## Etapa 12 — Fidelidade ao protótipo (Anexo C)

Etapa aberta depois da Etapa 11, quando o export `nexo.pen` chegou e permitiu comparar o frontend com o protótipo nó a nó, em vez de no olho. O que está aqui é diferença **medida** contra o export, não impressão.

### 12.1 — Paleta e correções pontuais (feito)
- [x] Tokens de `app/globals.css` alinhados aos `variables` do `.pen` (ver tabela abaixo)
- [x] `Selo` passa a separar cor do ponto e cor do texto, como o protótipo faz (`$warning` no ponto, `$warning-text` no texto) — sem isso a paleta nova fica ilegível
- [x] Ícone da marca trocado pelo path real do protótipo (`MarcaNexoAssist`), branco no painel escuro do login e azul na sidebar
- [x] Login: traços verticais separando as três métricas; chip do INC-20517 branco com ponto âmbar, não vermelho
- [x] Sidebar: item "Meu perfil", e "Sair" como linha (ícone + rótulo) **abaixo** do cartão do usuário
- [x] Página `/perfil` criada (Tela 6 do protótipo), que é o destino do novo item da sidebar

**Mapa de tokens** (`.pen` → nosso nome). O protótipo usa três variações por cor — base (ponto/borda), `-text` (texto sobre fundo claro) e `-soft` (fundo de pílula) — e essa divisão virou regra aqui:

| `.pen` | nosso token | | `.pen` | nosso token |
|---|---|---|---|---|
| `primary` | `primario` | | `ink` | `tinta` |
| `primary-hover` | `primario-hover` | | `ink-2` | `tinta-media` |
| `cta` | `primario-acao` | | `ink-3` | `tinta-fraca` |
| `primary-text` | `primario-texto` | | `rule` | `borda` |
| `primary-soft` | `primario-suave` | | `paper` | `superficie` |
| `danger` / `-text` / `-soft` | `critica` / `-texto` / `-suave` | | `desk` | `superficie-baixa` |
| `warning` / `-text` / `-soft` | `alta` / `-texto` / `-suave` | | — | `media` (ponto cinza, `#1b243166`) |
| `success` / `-text` / `-soft` | `resolvido` / `-texto` / `-suave` | | — | `baixa` (= `primary`) |

`font-display` (Newsreader) aparece **só na tela de login** no protótipo — título, "Entrar" e os três números. Todo o resto é `font-ui` (Schibsted Grotesk). `font-data` (IBM Plex Mono) está declarado nas variáveis mas não é usado em nenhum nó.

### 12.2 — Chat do funcionário (Telas 2 e 3)
- [ ] Coluna de mensagens centralizada: o protótipo usa `padding [28, 200]`, ou seja ~1040 px de coluna útil, não a largura toda
- [ ] Ícone de check das ações do agent em cinza (`$ink-3`), não verde — no protótipo o check é neutro, a cor fica por conta do erro
- [ ] Opções rápidas com atalho numérico (1–4) e estado "escolhida" (`primary-soft` + borda `primary`)
- [ ] Cartão de rascunho no formato do protótipo: raio 16, sombra dupla, "eyebrow" dentro do corpo (`Novo chamado · Rascunho D-381` + estado à direita), título 18 px, grade de 3 campos (Categoria / Prioridade / Afetados — sem "Tipo") sobre régua superior, e rodapé em `desk` com `Confirmar` trazendo a tecla `⌘↵`
- [ ] Compositor como pílula de 48 px com o botão Enviar dentro, e o contador `18/30 mensagens nesta sessão` alinhado à direita abaixo
- [ ] Código do chamado em `font-ui`, não `font-mono` (`SelecaoDeChamado`, `PainelDeChamados`)
- [ ] Elevação dos cartões: raio 16 + borda `#1B243117` + duas sombras suaves — hoje é raio 12 sem sombra

### 12.3 — Console do analista (Telas 4 e 5) — reestruturação
A maior diferença estrutural do projeto. O protótipo não tem o cabeçalho de topo que temos hoje.
- [ ] Trilha vertical de 64 px em `desk`: marca, ícone "Conversas" com contador de não lidas, e avatar do analista com ponto de online no rodapé
- [ ] Cabeçalho da lista com título "Conversas" em `font-ui` (hoje está em Newsreader), seletor de disponibilidade ("Disponível") e campo de busca "Pesquisar conversa ou chamado"
- [ ] Itens da fila: contador de não lidas, ponto de online no avatar, marca de leitura (ticks) na última mensagem do agent, estado "digitando…"
- [ ] Avatar com cor por pessoa (o protótipo usa um tom por funcionário, não azul para todos)
- [ ] Transcrição: hora e ticks dentro da bolha, etiqueta "IA" ao lado de "Nexo Assist", e o analista identificado por nome + equipe ("Rafael Lima · Suporte N2") em vez de "Analista de TI"
- [ ] Separador de dia como pílula, não como linha
- [ ] Painel de chamados: linha de último evento no chamado da conversa ("Transferido para um analista · 10:05"), outros chamados como linhas compactas com chevron, rodapé "Ver todos os chamados da Ana", e botão de fechar no cabeçalho

### 12.4 — Tela de login
- [ ] "Service desk de TI da Nexo" em caixa normal, 13,5 px, peso 500 — hoje está em caixa alta e menor
- [ ] Números das métricas em 34 px (hoje 24 px)
- [ ] Botão "Entrar" com as duas sombras do protótipo
- [ ] Caixa de "Manter conectado" desenhada (18 px, raio 6, preenchida em `cta`) em vez do checkbox nativo
- [ ] Marca do painel escuro em 24 px (hoje 20 px, igual à da sidebar)
- [ ] Bolhas do exemplo com raio 12 e canto de 4 px no lado do remetente (hoje 16 px)

### 12.5 — Meu perfil
- [ ] "Redefinir senha" como botão de verdade (hoje é um rótulo inerte com nota de demonstração)

### 12.6 — Divergências deliberadas (não corrigir)
Registrado para não virar "bug" em revisão futura:
- **"Como decidi"** (painel de transparência) não existe no protótipo — é exigência do PRD ("Visibilidade das decisões", p.2) e fica.
- **Filtro "Encerradas"** na fila é nosso; o protótipo tem quatro filtros.
- **"Esqueci minha senha"** virou "Qualquer senha é aceita nesta demonstração", porque não há recuperação de senha nesta demo.
- **Departamento** no perfil não está no protótipo, mas é dado real do seed e ajuda o analista.
- O ícone da marca é **cortado à direita** no protótipo (desenho de 24,388 px dentro de uma caixa de 24 px com clip). Reproduzido como está, de propósito.

## Etapa 13 — Deploy (diferencial)
- [ ] Deploy no Railway com volume persistente
- [ ] Proteção de chaves / limite de uso
- [ ] Documentar processo de deploy no README
