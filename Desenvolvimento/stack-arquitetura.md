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
  /login/acoes.ts     → Server Action de entrar (no lugar de /api/auth)
  /sair/route.ts      → logout como navegação completa (POST → 303), para descartar a memória da página
  /chat/acoes.ts      → Server Actions de confirmar e cancelar o rascunho

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
    responder-mensagem.ts   (uma rodada de conversa: histórico → agent → decisão persistida; limite de 30)
    carregar-conversa.ts    (conversa ativa e histórico para a tela)
    transferir-conversa.ts  (estado, resumo, chamado e marco na conversa)
    confirmar-proposta.ts   (cria/atualiza o chamado só no clique de confirmação; cancelar)
    autenticar.ts
  acoes-do-agent.ts         (chamadas de ferramenta → ações exibidas, detalhes, proposta e dados dos cards)
  ports/
    assistente.ts           (o agent visto pela aplicação: sem Mastra nem Gemini)
    conversas.ts, ticket-repository.ts, central-de-ajuda.ts, usuarios.ts

/infrastructure
  /db                   → schema Drizzle, migrations, client SQLite, dados-exemplo.ts (Anexo B)
  /llm                  → configuração do modelo (Gemini via roteador do Mastra)
  /conversas            → repositório SQLite de conversas e mensagens
  /mcp                  → MCPServer (expõe o serviço) e cliente MCP (o agent consome)
  dependencias.ts       → composição de produção (banco → repositórios → MCP → agent)
  /ticket-repo          → implementação SQLite de ticket-repository, com simulação de indisponibilidade
  /central-de-ajuda     → busca nos artigos (ranqueamento por título/palavra-chave/conteúdo)

/agent                  → implementação do port assistente com Mastra
  assistente.ts         (Agent por requisição, stream, saída estruturada)
  ferramentas.ts        (ferramentas que o modelo enxerga, com o funcionário amarrado)
  instrucoes.ts         (prompt gerado a partir das constantes do domínio)
  saida.ts              (schema da decisão e normalização)

/lib                    → utilitários compartilhados (leitura de env, sessão/auth, etc.)

/scripts                → linha de comando: seed do banco e conversa com o agent no terminal

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

## Decisões do MCP (Etapa 3)

- **Seis ferramentas**: `consultar_chamados`, `consultar_chamado`, `criar_chamado`, `atualizar_chamado`, `transferir_chamado` e `buscar_central_ajuda`. O nome exposto vem da **chave do objeto** passado em `tools`, não do `id` do `createTool` — detalhe que custou uma depuração.
- **Adaptador `fetch-to-node` na rota**: `MCPServer.startHTTP` recebe `req`/`res` do Node, e route handler do App Router trabalha com `Request`/`Response` da Web. A própria documentação do `@mastra/mcp` indica esse adaptador para runtimes baseados em fetch.
- **Sem `export const runtime`** na rota: é incompatível com `cacheComponents`, que está ligado. Node já é o padrão.
- **Revisão 2026-07-28 do protocolo, que é stateless**: cada requisição se basta, sem `initialize` nem sessão guardada entre chamadas. É o que permite servir MCP de dentro de um route handler.
- **Privacidade dentro da ferramenta, não só no repositório**: toda ferramenta de chamado recebe o `funcionarioId` (que vem da sessão, não do que a pessoa digita) e confere o dono antes de responder. Chamado de outra pessoa e chamado inexistente devolvem **a mesma mensagem**, para não confirmar que o chamado dos outros existe. Há teste comparando as duas respostas.
- **O cliente MCP prefixa os nomes** com a chave do servidor: a ferramenta chega ao agent como `chamados_consultar_chamados`. Importa na Etapa 5.
- **O rascunho continua fora do MCP**: `criar_chamado` só é chamada depois da confirmação do funcionário, e isso está escrito na descrição da ferramenta — a confirmação em si é da UI e do agent.

## Decisões de autenticação e interface (Etapa 4)

- **Server Actions no lugar de `/api/auth`**: entrar e sair são duas funções com `"use server"`, sem endpoint nem `fetch` no cliente. Detalhe que custou um build quebrado: um arquivo `"use server"` só pode exportar funções async, então o estado inicial do formulário mora em `app/login/estado.ts`.
- **Sessão em cookie assinado com HMAC-SHA256**, sem biblioteca: `httpOnly`, `sameSite=lax`, `secure` em produção, expiração de 7 dias dentro do payload assinado e comparação de assinatura em tempo constante. São ~50 linhas, testadas contra adulteração, segredo trocado e expiração. Num sistema real eu usaria uma biblioteca de sessão; aqui o ganho é não ter dependência para algo pequeno e verificável.
- **`SESSION_SECRET` é obrigatório em produção** e cai num segredo fixo apenas em desenvolvimento, para `npm run dev` funcionar sem `.env`.
- **"Manter conectado" é funcional**: marcado grava cookie persistente de 7 dias, desmarcado grava cookie de sessão. Não é enfeite de protótipo.
- **Qualquer senha é aceita**, como o PRD pede. O campo é exigido (vazio dá erro) mas não verificado, e isso está dito na própria tela e num comentário no caso de uso.
- **Guarda por papel em cada página** (`exigirUsuario`), não em middleware: o middleware roda no edge e precisaria de outra implementação de verificação, e a guarda no servidor já cobre todas as rotas protegidas.
- **`export const instant = false`** nas rotas que leem cookie: com `cacheComponents` ligado, acesso a dado de requisição fora de `<Suspense>` quebra o build. Essas telas decidem redirecionar antes de renderizar, então não há casca para mostrar — rota bloqueante é o certo. Pelo mesmo motivo, `sessaoAtual` chama `connection()` antes de ler o cookie.
- **Tokens de design em `app/globals.css`** (`@theme` do Tailwind v4), com as fontes do protótipo: Newsreader nos títulos, Schibsted Grotesk no texto, ícones Lucide.
- **Campo de e-mail controlado**: o React reseta o formulário depois de uma Server Action, o que apagava o e-mail digitado quando o login falhava.

## Convenção de configuração (variáveis de ambiente)

Regra: **nenhum `process.env` fora de `lib/env.ts`.** A única exceção é `NEXT_RUNTIME` no `instrumentation.ts`, que é variável do próprio Next dizendo em que runtime o código roda, não configuração do app.

- **Um schema zod descreve todas as variáveis**: tipo, padrão e restrições. O resto do código lê `ambiente().X`, já tipado e validado. Nada de ler texto cru e converter em cada lugar.
- **Valor inválido derruba, não é corrigido em silêncio.** Taxa de falha `1.5` ou `abc`, URL do MCP sem `http://`, segredo de sessão com menos de 32 caracteres: erro com o nome da variável e o problema. Antes, a taxa inválida virava o padrão sem aviso.
- **Produção exige `SESSION_SECRET` e `GEMINI_API_KEY`.** O `instrumentation.ts` valida o ambiente na subida do servidor: configuração errada impede o app de subir, em vez de explodir no primeiro login ou na primeira mensagem. Em desenvolvimento as duas são opcionais, para o app abrir sem `.env`.
- **Variável vazia conta como ausente**, porque o `.env.example` copiado traz `SESSION_SECRET=` sem valor.
- **Mensagem de erro nunca contém valor**, só nome e problema. Tem teste para isso.
- **Nenhuma variável `NEXT_PUBLIC_`**: o Next só embute no código do navegador as que têm esse prefixo, então nenhum segredo tem como ir para o cliente. Conferido no build: a chave do Gemini não aparece em nenhum arquivo gerado, nem do navegador nem do servidor, porque é lida em tempo de execução.
- **Sem o pacote `server-only` no `lib/env.ts`**: ele quebraria os scripts (`tsx`) e os testes, que também leem o ambiente. A garantia de não vazar já vem da regra do prefixo acima.

## Convenção de estilo

Regra: **nenhuma cor literal fora de `app/globals.css`**. Nada de hex, nada de cor da paleta padrão do Tailwind (`blue-600`, `slate-500`), nada de `text-white`. Só token.

Os nomes dizem a **função**, não a cor, para que trocar a identidade visual seja mexer em valores num lugar só, sem renomear nada no código:

| Grupo      | Tokens                                                                               |
| ---------- | ------------------------------------------------------------------------------------ |
| Ação       | `primario`, `primario-escuro`, `primario-suave`                                        |
| Superfície | `superficie`, `superficie-baixa`, `superficie-escura`, `superficie-escura-alta`        |
| Texto      | `tinta`, `tinta-media`, `tinta-fraca`, `tinta-invertida`                               |
| Borda      | `borda`, `borda-escura`                                                                |
| Domínio    | `critica`, `alta`, `media`, `baixa`, `resolvido`                                       |

Transparência se resolve com o modificador do Tailwind sobre o token (`bg-critica/5`), nunca com uma nova cor.

**Token resolve cor, não resolve combinação repetida.** Os selos de prioridade e status vão aparecer no chat, no card de chamado, na lista do analista e no painel lateral, sempre como o mesmo trio de fundo, borda e texto. Isso vira um átomo `Selo` na Etapa 6, que recebe a prioridade ou o status e decide as classes — um lugar só define como "prioridade alta" se parece.

## Decisões do agent (Etapa 5)

- **O LLM entende, o código decide as regras.** O modelo julga quem é afetado e se há urgência; a prioridade e o prazo saem de `definirPrioridade` e `calcularPrazo` do domínio, chamados pela ferramenta `propor_chamado`. O modelo nunca escolhe a prioridade. A mesma ferramenta usa `validarRascunho` e devolve os campos que faltam — é a regra do Anexo A que diz ao agent o que perguntar.
- **Confirmação garantida pela estrutura, não pelo prompt.** As ferramentas do agent só *propõem* (`propor_chamado`, `propor_atualizacao`). Criar, atualizar e reabrir acontecem em `confirmarProposta`, disparado pelo clique do funcionário. O modelo não tem como pular a confirmação, por mais que erre. Por isso `criar_chamado` e `atualizar_chamado` do MCP não estão entre as ferramentas do agent.
- **Privacidade amarrada no servidor.** As ferramentas que o modelo enxerga não têm campo de funcionário: o `funcionarioId` vem da sessão e é fechado na criação das ferramentas, a cada requisição. Tem teste injetando outro id na entrada e confirmando que é ignorado.
- **Ações exibidas = ferramentas realmente chamadas.** Cada ferramenta registra entrada, saída e sucesso; `acoesDasFerramentas` traduz isso nos rótulos do protótipo ("consultou seus chamados", "classificou a prioridade"). O que aparece acima da resposta é o que aconteceu, não o que o modelo diz que fez — inclusive falhas ("não conseguiu consultar seus chamados").
- **Saída estruturada com `jsonPromptInjection: "system"`** e instruções compactas no lugar do schema inteiro. A doc do Mastra avisa que o Gemini 2.5 recusa ferramentas e `response_format` juntos; a injeção no prompt funciona com qualquer versão e custa menos tokens. O schema tem `.catch()` nos campos secundários: intenção desconhecida vira `conversa`, confiança ausente vira 0 (e portanto recomenda analista). Uma resposta nunca cai por um campo fora do formato.
- **Texto em tempo real pelo `objectStream`**: o campo `resposta` chega parcial enquanto o JSON é gerado, e o caso de uso repassa por callback. A Etapa 6 só precisa ligar isso ao stream HTTP.
- **Prompt gerado do domínio.** Categorias, tabela de prioridades, prazos, expediente e janela de reabertura vêm das constantes de `domain/`. Mudou a regra, mudou o prompt — não há duas cópias para divergirem.
- **Uma chamada de modelo por rodada**, com histórico limitado às últimas 20 mensagens, temperatura 0.2, no máximo 6 passos e 45 s de teto. As mensagens de confirmação e cancelamento são texto montado pelo código: zero tokens.
- **O port `llm-provider` virou `assistente`.** Com o Mastra, trocar de provedor é trocar a configuração do modelo (`infrastructure/llm/modelo.ts`), então um port só para o provedor seria uma interface sem implementação alternativa. O port que isola de verdade é o `Assistente`: a aplicação não sabe que existe Mastra nem Gemini, e os testes dos casos de uso usam um assistente falso.
- **Testes do loop real sem chave de API.** O Mastra traz `MastraLanguageModelV2Mock`, que aceita um stream por passo. Os testes roteirizam "chama ferramenta → chama outra → responde JSON" e exercitam o loop de verdade, com o servidor MCP real em memória por trás.
- **Variáveis novas**: `GEMINI_MODEL` e `MCP_SERVER_URL`. O padrão do modelo virou `gemini-3.5-flash-lite` depois do teste real: os flash maiores (3.8, 3.7, 3.5) estavam sobrecarregados, com erro 503 e respostas de até 56 s para um "oi", e o 2.5-flash já não existe para a chave. O lite respondeu em cerca de 1 s e conduziu o fluxo inteiro em 6 s. A chave continua em `GEMINI_API_KEY`, passada explicitamente ao modelo em vez de depender do nome que o roteador do Mastra procura.

## Decisões do chat do funcionário (Etapa 6)

- **Transparência por expansão, no lugar da resposta.** Acima de cada resposta ficam as ações reais, com as palavras do protótipo ("consultou seus chamados", "classificou a prioridade"). O botão "Como decidi" abre ali mesmo: o que o agent entendeu, a decisão tomada, a segurança (medidor contra o mínimo de 70%), o porquê, cada ação com o detalhe do que encontrou ("7 chamados no total, 4 em aberto, 2 vencidos"; "afetados: somente você, urgência: trabalho parado → prioridade alta pela tabela do Anexo A"), as fontes da central de ajuda e a recomendação de analista. Escolhi expandir em vez de painel lateral porque mantém a explicação junto da resposta que ela explica e funciona no celular.
- **Mesmo quando o modelo erra, o erro fica visível.** No teste real, o painel mostrou exatamente onde o modelo interpretou demais a urgência. É isso que permite ao analista (e ao avaliador) confiar ou corrigir.
- **Cards desenhados a partir de dados gravados na decisão** (`chamadosListados`, `chamadoConsultado`, `artigosConsultados`), não de nova consulta: a conversa reaberta outro dia mostra os mesmos cards (história 6), sem consultar o sistema de novo e sem depender do estado atual.
- **Qual card aparece é regra da tela, não do modelo**: proposta mostra o rascunho; chamado consultado mostra o card do chamado; intenção de consulta com mais de um chamado em aberto e nenhum escolhido mostra a lista de seleção. Quando a lista aparece, as respostas rápidas somem, para não oferecer a mesma escolha duas vezes.
- **Streaming em NDJSON** pela rota `/api/chat`: eventos `acao` (ações ao vivo), `parcial` (texto crescendo, só quando muda), `respondida`, `com_analista`, `limite` e `erro`. A rota recusa sem sessão de funcionário (401) e valida o corpo (até 2.000 caracteres).
- **Limite de 30 conta só as mensagens do funcionário**: cada uma é uma chamada ao modelo, então é a medida de custo. O bloqueio é **no servidor** (o modelo nem é chamado na 31ª); a tela avisa a partir da 25ª e trava o campo na 30ª. A 30ª resposta já sai com transferência recomendada por limite; a mudança de estado da conversa é da Etapa 7.
- **Confirmar e cancelar são Server Actions** que chamam os casos de uso e devolvem a mensagem atualizada e a nova. "Editar" é conversacional: preenche o campo com "Quero ajustar o rascunho:" e o agent remonta. Sem formulário de edição para não abrir um caminho de alterar prioridade sem passar pela regra.
- **Bug de privacidade encontrado e corrigido no teste.** Com `cacheComponents`, o Next 16 preserva o estado de rotas já visitadas (React Activity). Sair e entrar com outro usuário na mesma aba trazia de volta, em memória, a conversa do usuário anterior — o servidor estava certo, o navegador mostrava o antigo. Duas correções: o logout virou navegação completa (`POST /sair` respondendo 303, que descarta toda a memória da página) e o componente da conversa tem `key` com usuário e conversa, para ser recriado se receber dados de outra pessoa. Conferido no navegador: Ana → sair → Diego, na mesma aba, sem recarregar, e nada da Ana aparece.
- **Evidência obrigatória para impacto e urgência.** O `propor_chamado` exige o trecho literal do que a pessoa escreveu para "quem é afetado" e para a urgência, e confere esse trecho nas mensagens dela (sem acento, caixa ou pontuação). Sem trecho válido, o campo é descartado e volta como "falta perguntar". Impede o modelo de inventar; não impede interpretar demais um trecho que existe — esses casos foram para o eval set da Etapa 9.
- **Átomos novos que centralizam combinações**: `Selo` (o único lugar que define como cada prioridade e status aparece), `Aviso` (erro, atenção, informação — o login passou a usar também) e `MedidorDeConfianca`. `Botao` ganhou `tamanho` para as respostas rápidas não sobrescreverem classes por fora.
- **Datas gravadas sem termos relativos.** Detalhes que ficam salvos usam data absoluta ("09 mar, 18:00"); "hoje"/"amanhã" só em texto de conversa, que tem horário ao lado.

## Decisões da transferência para analista (Etapa 7)

- **Transferir na hora, ou apenas oferecer.** O Anexo A lista chamado vencido entre os gatilhos, mas o protótipo (Tela 3) mostra o agent *perguntando* "Quer que eu chame um analista?" nesse caso. Segui o protótipo: pedido da pessoa, caso crítico, baixa confiança e limite de mensagens transferem na hora; chamado vencido só recomenda, e a transferência acontece se a pessoa aceitar — o que cai em "o funcionário pediu". A distinção mora no domínio (`transfereImediatamente`), não na tela.
- **O resumo é escrito pelo modelo sem chamada extra.** A ferramenta `chamar_analista` só registra o texto, dentro da mesma chamada que já está acontecendo; quem decide se transfere continua sendo a regra. Se o modelo não escrever, o código monta um resumo com o entendimento, o chamado em questão e o motivo. Resultado real: "A usuária Carla Mendes (Comercial) solicitou atendimento com um analista devido ao seu notebook lento. Não há chamado aberto sobre este problema específico."
- **A transferência também alcança o chamado.** Se a conversa girava em torno de um chamado, ele vai para "aguardando analista" com o resumo no histórico. Uma falha do sistema legado aqui **não desfaz** a transferência da conversa: ela já aconteceu, e o chamado fica para o analista acertar. Há teste com o repositório falhando.
- **O agent pausa por estado da conversa, não por sinalizador na tela.** Enquanto o estado não for `com_agent`, `responderMensagem` grava a mensagem da pessoa (o analista precisa vê-la) e devolve sem chamar o modelo. Conferido no teste real: depois de transferir, "Alguém aí?" entrou na conversa e o agent não respondeu.
- **O motivo fica visível para os dois lados**, numa mensagem de sistema no fio da conversa ("Transferida para um analista · a pessoa pediu um analista"), que o funcionário vê como marco e o analista lerá no histórico na Etapa 8.

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
