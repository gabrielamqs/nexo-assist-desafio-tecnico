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

### 12.2 — Chat do funcionário (Telas 2 e 3) (feito)
- [x] Ícone de check das ações do agent em cinza (`$ink-3`), não verde
- [x] Elevação dos cartões: raio 16, borda `#1B243117` e as duas sombras do protótipo, agora em `sombra-de-cartao`
- [x] Cartão de rascunho e de chamado no formato do protótipo: "eyebrow" dentro do corpo, título 18 px, grade de campos sobre régua superior, rodapé em `desk`
- [x] `Confirmar` com a tecla de atalho visível — e **o atalho funciona** (Ctrl/⌘+Enter), não é só enfeite
- [x] Bolhas com raio 12 e canto de 4 px no lado do remetente (eram 16/2 px)
- [x] Cartões ocupando a largura da coluna (`fill_container` no protótipo), bolha do agent limitada a ~600 px
- [x] Código do chamado em `font-ui`, não `font-mono`
- [x] Sombra de controle nos campos de texto e nos botões secundários

**Duas correções à leitura inicial deste plano**, encontradas ao conferir o `.pen` nó a nó em vez de confiar na primeira passada:
- Os **atalhos numéricos (1–4)** nas opções rápidas estão com `enabled: false` no protótipo, ou seja, são camadas **ocultas**. Não existem na tela. Item removido.
- A **largura da coluna de mensagens** já estava certa: `Main` mede 1208 px (1440 − 232 da sidebar) e `Messages` tem padding lateral de 200 px, sobrando 808 px — o nosso `max-w-3xl` dá 768 px. A conta anterior (~1040 px) esquecia de descontar a sidebar. Item removido.

### 12.3 — Console do analista (Telas 4 e 5) (feito)
- [x] Trilha vertical de 64 px em `desk`: marca, ícone "Conversas" com contador de conversas que esperam atendente, e avatar do analista com ponto de online no rodapé
- [x] Colunas nas medidas do protótipo: trilha 64, lista 380, transcrição flexível sobre `#EEF1F5`, painel 340
- [x] Cabeçalho da lista com "Conversas" em `font-ui` (saiu do Newsreader), selo "Disponível" e campo de busca
- [x] **A busca funciona**: filtra por nome, e-mail, departamento, resumo do caso e última mensagem, sem distinguir acento ou caixa (`listarFila`)
- [x] Chips de filtro no estilo do protótipo (`desk` / `primary-soft`), não mais azul sólido
- [x] Itens da fila com avatar de 46 px, raio 12 e o item ativo em `desk`
- [x] Avatar com cor por pessoa (três tons do protótipo, escolhidos por hash do nome)
- [x] Transcrição na perspectiva do analista, como no protótipo: funcionário à esquerda em branco, agent à direita em azul-claro com etiqueta "IA", analista à direita em verde-claro
- [x] Analista identificado pelo nome quando a conversa é dele, em vez de "Analista de TI"
- [x] Separador de dia como pílula na transcrição (no chat do funcionário segue como linha, que é o que o protótipo mostra lá)
- [x] Painel: "Outros chamados" como linhas compactas; "Desta conversa" segue como cartão

### 12.4 — Tela de login (feito)
- [x] "Service desk de TI da Nexo" em caixa normal, 13,5 px, peso 500
- [x] Números das métricas maiores (30 px, 36 px em telas largas)
- [x] Botão "Entrar" com as duas sombras do protótipo (`sombra-de-acao`)
- [x] Caixa de "Manter conectado" desenhada (18 px, raio 6, preenchida em `cta`)
- [x] Marca do painel escuro em 24 px, maior que a da sidebar
- [x] Bolhas do exemplo com raio 12 e canto de 4 px

### 12.5 — Meu perfil (feito)
- [x] "Redefinir senha" como botão de verdade, desabilitado, com a nota explicando que a demo não tem redefinição

### 12.6 — Divergências deliberadas (não corrigir)
Registrado para não virar "bug" em revisão futura.

**Porque o PRD pede, e o protótipo não cobre:**
- **"Como decidi"** (painel de transparência) não existe no protótipo — é exigência do PRD ("Visibilidade das decisões", p.2) e fica, inclusive na transcrição do analista.
- **"Tipo"** (incidente/requisição) no cartão de rascunho: o protótipo mostra três campos, nós mostramos quatro. É dado do Anexo A e some informação real se for removido.
- **Filtro "Encerradas"** na fila é nosso; o protótipo tem quatro filtros.
- **Departamento** no perfil não está no protótipo, mas é dado real do seed.

**Porque exibir seria inventar dado que o sistema não tem:**
- **Contador de não lidas por conversa**, **marcas de leitura (ticks)** e **"digitando…"**: não há modelo de leitura nem de presença. O contador da trilha é real (conversas aguardando analista); por conversa, seria número inventado.
- **Ponto de "online"** no avatar do funcionário na fila: mesma razão. O ponto na trilha é do próprio analista, que está logado — esse é verdade.
- **"Ver todos os chamados da Ana"** no rodapé do painel e **botão de fechar** o painel: não existe página de listagem nem estado para esconder o painel; seriam controles mortos.

**Outras:**
- **"Esqueci minha senha"** virou "Qualquer senha é aceita nesta demonstração", porque não há recuperação de senha nesta demo.
- **Compositor** continua um `textarea` que cresce, em vez da pílula de altura fixa do protótipo: mensagem longa é o caso normal aqui e o protótipo é um mock de uma linha só.
- **Botão "Sair"** na trilha do console: o protótipo não tem logout em lugar nenhum da tela do analista, e a sessão precisa ser encerrável.
- O ícone da marca é **cortado à direita** no protótipo (desenho de 24,388 px dentro de uma caixa de 24 px com clip). Reproduzido como está, de propósito.

## Etapa 13 — Deploy (diferencial)

### Preparo do repositório, primeira rodada — Railway (substituída)
- [x] `railway.json` com builder Nixpacks, comando de start, healthcheck e política de reinício
- [x] `GET /api/saude` conferindo o banco — ver abaixo, ficou e serve para qualquer plataforma
- [x] `MCP_SERVER_URL` derivada de `PORT` quando não informada — ver abaixo, decisão agnóstica de plataforma, ficou
- [x] Limite de uso por pessoa em `/api/chat` (15 mensagens por minuto, `lib/limite-de-uso.ts`) — ficou
- [x] Seção "Deploy" no README com o passo a passo da Railway

Na hora de criar a conta na Railway, os cadastros estavam suspensos por um [incidente de segurança](https://status.railway.com/incident/O1VGXWU5) (abuso em massa na criação de contas), sem previsão de retorno. Como o PRD lista Fly.io como alternativa igualmente válida ("Pode ser em qualquer plataforma: Vercel, Railway, Fly.io, Render ou outra") e ela atende ao mesmo requisito técnico (volume persistente), a etapa foi refeita para Fly.io em vez de esperar. `railway.json` foi removido; o raciocínio das trocas está em `Desenvolvimento/stack-arquitetura.md`, seção "Railway → Fly.io → Vercel".

### Preparo do repositório, segunda rodada — Fly.io (feito)
- [x] `output: "standalone"` no `next.config.ts`, para uma imagem Docker enxuta
- [x] `Dockerfile` multi-stage (deps/builder/runner), usuário não-root, `/data` como ponto de montagem do volume
- [x] `.dockerignore`
- [x] `fly.toml`: região `gru`, healthcheck em `/api/saude`, volume `nexo_assist_data` em `/data`, `auto_stop_machines`/`min_machines_running = 0` para custo zero quando ocioso (pedido do PRD: "limite o uso para evitar [...] custo inesperado")
- [x] Seção "Deploy" no README reescrita para o fluxo `flyctl` (`fly launch`, `fly volumes create`, `fly secrets set`, `fly deploy`)

**Verificado de ponta a ponta com Docker local** (não só lendo o Dockerfile — rodando de verdade):
- `docker build` conclui e gera a imagem a partir do `Dockerfile`
- container sobe com volume Docker montado em `/data`, variáveis de produção, `GEMINI_API_KEY` e `SESSION_SECRET` de teste: `/api/saude` e `/login` respondem 200, banco criado dentro do volume (não na camada do container)
- **teste de persistência real**: parei e removi o container, subi um container novo com o mesmo volume — o arquivo do banco manteve tamanho e data de modificação (não foi recriado), e o seed não rodou de novo (só insere em banco vazio)
- recursos de teste (container, volume, imagem) removidos depois

Continua valendo, independente da plataforma: sem `GEMINI_API_KEY`/`SESSION_SECRET` em produção, o `instrumentation.ts` falha e **toda requisição devolve 500**, com o log nomeando a variável que faltou e nunca o valor. O processo não encerra — por isso o healthcheck importa: é ele que faz a plataforma reprovar o deploy.

### Segunda rodada publicada e abandonada — limite da conta gratuita da Fly.io

O deploy na Fly.io **funcionou**: máquina em `gru`, volume montado em `/data`, banco criado e migrado dentro dele, `Checks 1/1 passing` com `/api/saude` devolvendo `{"estado":"ok"}`, 256 MB sem OOM. Três problemas apareceram no caminho e todos foram corrigidos — commit antigo publicado pelo assistente web da Fly (os arquivos de deploy ainda não estavam no `main`), `SESSION_SECRET` enviada vazia por expansão de variável do PowerShell em outra sessão de terminal, e app sem IP público alocado.

O que inviabilizou foi política de conta, não técnica: **a conta gratuita desliga a máquina a cada 5 minutos de execução** até se cadastrar um cartão. Medido duas vezes no log (`Trial machine stopping. To run for longer than 5m0s`), por tempo ligado e **não por inatividade** — a segunda medição caiu em 5m03s com a máquina recebendo requisições. Ela volta sozinha em ~4,5 s na requisição seguinte e os dados sobrevivem no volume, mas o chat é streaming NDJSON: um corte no meio de uma resposta do agent aparece na tela como falha do app. Não serve para um link de demonstração.

### Preparo do repositório, terceira rodada — Vercel + Turso (feito)

Em vez de procurar uma quarta plataforma com volume gratuito (praticamente inexistente — na Render, disco persistente é só para serviço pago), tirou-se o requisito que criava a busca: **o banco saiu do disco**. Sem arquivo local o app fica sem estado, e serverless deixa de ser impedimento. O `@libsql/client`, escolhido na Etapa 2, já tinha sido escolhido pensando nessa saída.

- [x] `DATABASE_AUTH_TOKEN` em `lib/env.ts`, exigida sempre que `DATABASE_URL` não for arquivo local (`libsql://`, `http(s)://`, `ws(s)://`)
- [x] `authToken` repassado em `criarBancoDeDados()` e em `drizzle.config.ts` (que já usava `dialect: "turso"`)
- [x] `MCP_SERVER_URL` passa a ser derivada também de `VERCEL_URL` (`https://$VERCEL_URL/api/mcp`), sem perder a derivação por `PORT` fora da Vercel
- [x] `prepararBancoDeDados()` não migra nem semeia quando o banco é remoto — em serverless, instâncias frias concorrentes disputariam a mesma migration e o mesmo seed. Com arquivo local, o comportamento automático de sempre continua
- [x] `maxDuration = 300` em `/api/chat`: teto do plano Hobby, que vale também para resposta em streaming
- [x] `fly.toml` removido; `Dockerfile` e `.dockerignore` mantidos (contêiner local e caminho de volta ao SQLite em arquivo)
- [x] 4 testes novos em `tests/lib/env.test.ts` (derivação por `VERCEL_URL`, precedência da URL informada, token obrigatório em banco remoto, token dispensável em arquivo local) — 234 testes no total
- [x] README: seção "Deploy" reescrita para Vercel + Turso, com "O que muda em serverless"; `stack-arquitetura.md` com o raciocínio de banco em disco vs. banco remoto e o histórico das três plataformas
- [x] `npm run typecheck`, `npm run lint`, `npm test` (234 passando) e `npm run build` verdes

Verificado também que **variável definida na linha de comando vence a do `.env`** no `npm run db:seed`, o que permite semear o Turso sem tocar no banco local.

### Falta fazer (precisa das contas do Turso e da Vercel)

- [ ] Criar o banco no Turso e gerar o token de acesso
- [ ] Semear uma vez: `DATABASE_URL=... DATABASE_AUTH_TOKEN=... npm run db:seed`
- [ ] Importar o repositório na Vercel e definir `GEMINI_API_KEY`, `SESSION_SECRET`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`
- [ ] Publicar e conferir `GET /api/saude?detalhado` → `{"estado":"ok","banco":"ok"}`
- [ ] Testar o fluxo completo na URL pública (funcionário → analista) e anotá-la no README
