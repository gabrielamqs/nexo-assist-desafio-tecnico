# Nexo Assist

Agent de atendimento do service desk de TI da Nexo. O funcionário descreve o problema num chat, e o agent consulta os chamados dele, busca na central de ajuda, prepara a abertura ou a atualização de chamados e passa a conversa para um analista quando precisa. O analista tem um console próprio para assumir, responder, devolver ao agent e encerrar.

- [Como rodar](#como-rodar)
- [Visão geral da arquitetura](#visão-geral-da-arquitetura)
- [Como o agent decide o que fazer](#como-o-agent-decide-o-que-fazer)
- [Como a qualidade das decisões foi garantida](#como-a-qualidade-das-decisões-foi-garantida)
- [Escolha do modelo](#escolha-do-modelo)
- [Segurança e privacidade](#segurança-e-privacidade)
- [Principais trade-offs](#principais-trade-offs)
- [O que eu faria com mais tempo](#o-que-eu-faria-com-mais-tempo)

## Stack

Next.js 16 (App Router) · TypeScript estrito · Mastra · Google Gemini · MCP · Drizzle + SQLite (libsql) · Tailwind CSS 4 · Vitest

## Como rodar

Pré-requisitos: Node.js 22.9 ou superior e npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Preencha o `.env`: ao menos `GEMINI_API_KEY` (chave gratuita em https://aistudio.google.com/app/apikey) e, para `npm start`, `SESSION_SECRET` (por exemplo `openssl rand -base64 32`). A aplicação sobe em http://localhost:3000.

O banco SQLite é criado, migrado e populado com os dados de exemplo na primeira vez que a aplicação sobe, sem passo manual. Ele fica em `data/nexo-assist.db`, fora do versionamento; apagar essa pasta devolve o projeto ao estado inicial. Conversas, chamados e o estado de cada conversa sobrevivem a um reinício. Esse preparo automático vale para banco em arquivo; com banco remoto ele é um passo único e explícito, descrito em "Deploy".

**O agent consome o serviço de chamados por MCP, por HTTP**, no endereço de `MCP_SERVER_URL` (padrão `http://localhost:3000/api/mcp`). Se rodar em outra porta, ajuste essa variável. Por isso o servidor precisa estar de pé para o agent responder, inclusive em `npm run conversar`.

### Variáveis de ambiente

Todas são lidas e validadas em um único lugar (`lib/env.ts`). Valor inválido impede o app de subir, com o nome da variável e o problema, nunca o valor.

| Variável                      | Para quê                                                                  | Padrão                             |
| ----------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| `GEMINI_API_KEY`              | Chave do Gemini. Obrigatória em produção                                  | —                                  |
| `GEMINI_MODEL`                | Modelo usado pelo agent                                                   | `gemini-3.5-flash-lite`            |
| `SESSION_SECRET`              | Assina o cookie de sessão (mínimo 32 caracteres). Obrigatória em produção | segredo fixo só em desenvolvimento |
| `DATABASE_URL`                | Banco libSQL: arquivo local ou `libsql://` do Turso                       | `file:./data/nexo-assist.db`       |
| `DATABASE_AUTH_TOKEN`         | Token do banco remoto. Obrigatório quando o banco não é um arquivo        | —                                  |
| `MCP_SERVER_URL`              | Endereço do serviço de chamados que o agent consome                       | derivada (ver abaixo)              |
| `PORT`                        | Porta em que o app escuta                                                 | `3000`                             |
| `TICKET_SERVICE_FAILURE_RATE` | Chance (0 a 1) de o sistema legado simular indisponibilidade              | `0.08`                             |

`MCP_SERVER_URL` é derivada quando não é informada, porque o agent chama o próprio app: na Vercel, de `VERCEL_URL` (`https://$VERCEL_URL/api/mcp`), onde não há porta própria; fora dela, de `PORT` (`http://localhost:$PORT/api/mcp`), onde a porta é dinâmica e um valor fixo quebraria o serviço de chamados.

### Como entrar

Qualquer senha é aceita para os usuários de exemplo, como o PRD pede. O login roteia conforme o papel:

| E-mail                      | Papel       | Departamento | Vai para    |
| --------------------------- | ----------- | ------------ | ----------- |
| `ana.souza@nexo.com.br`     | Funcionária | Financeiro   | `/chat`     |
| `bruno.tavares@nexo.com.br` | Funcionário | Operações    | `/chat`     |
| `carla.mendes@nexo.com.br`  | Funcionária | Comercial    | `/chat`     |
| `diego.ramos@nexo.com.br`   | Funcionário | Marketing    | `/chat`     |
| `rafael.lima@nexo.com.br`   | Analista    | Suporte N2   | `/analista` |

Para ver o fluxo completo: entre como Carla, que tem um chamado crítico vencido (INC-20455), peça para falar com um analista, saia, entre como Rafael e assuma a conversa. A Ana tem chamados em vários estados, inclusive um resolvido há poucos dias que pode ser reaberto.

### Scripts

| Comando                | O que faz                                                              |
| ---------------------- | ---------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento                                            |
| `npm run build`        | Build de produção                                                      |
| `npm start`            | Servidor de produção (após o build)                                    |
| `npm run lint`         | ESLint                                                                 |
| `npm run typecheck`    | Checagem de tipos do TypeScript                                        |
| `npm run format`       | Formata o código com Prettier                                          |
| `npm run format:check` | Verifica a formatação sem alterar nada                                 |
| `npm test`             | Testes com Vitest (determinísticos, sem chave de API)                  |
| `npm run test:watch`   | Testes em modo watch                                                   |
| `npm run eval`         | Casos de avaliação das decisões do agent, com o Gemini real            |
| `npm run db:generate`  | Gera a migration a partir do schema                                    |
| `npm run db:seed`      | Popula o banco com os dados de exemplo                                 |
| `npm run conversar`    | Conversa com o agent no terminal, mostrando a decisão de cada resposta |

## Deploy

Publicado na **Vercel**, com o banco no **Turso** (libSQL hospedado — o mesmo motor do SQLite). Em desenvolvimento nada disso aparece: o banco continua sendo um arquivo local, criado e semeado no primeiro boot.

> O deploy passou por três plataformas antes de assentar, e o porquê importa mais que o destino. A primeira escolha foi a Railway, pelo volume persistente; na hora de criar a conta, ela [suspendeu novos cadastros por um incidente de segurança](https://status.railway.com/incident/O1VGXWU5). A segunda foi a Fly.io, com `Dockerfile` e `fly.toml` prontos e verificados de ponta a ponta — mas a conta gratuita desliga a máquina a cada 5 minutos de execução até se cadastrar um cartão, o que inutiliza um link de demonstração. A terceira atacou a causa em vez do sintoma: o que prendia o projeto a plataformas com volume era o banco ser um arquivo em disco. Tirando o arquivo do disco, o app fica sem estado e cabe em serverless — e o driver `@libsql/client`, escolhido na Etapa 2, já tinha sido escolhido pensando nessa saída. Detalhes em `Desenvolvimento/stack-arquitetura.md`.

O `Dockerfile` segue no repositório: serve para rodar em contêiner localmente e mantém o deploy reproduzível em qualquer plataforma com volume, caso se queira voltar para o SQLite em arquivo.

### Vercel + Turso, passo a passo

1. **Criar o banco** no [Turso](https://turso.tech):

   ```bash
   turso db create nexo-assist
   turso db show nexo-assist --url      # libsql://nexo-assist-<organizacao>.turso.io
   turso db tokens create nexo-assist   # o token de acesso
   ```

   Pelo painel web dá na mesma: criar o banco e gerar um token.

2. **Criar as tabelas e os dados de exemplo**, uma única vez, da sua máquina:

   ```bash
   DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." npm run db:seed
   ```

   No PowerShell: `$env:DATABASE_URL="..."; $env:DATABASE_AUTH_TOKEN="..."; npm run db:seed`.

   Variável definida na linha de comando vence a do `.env`, então o banco local não é tocado. O script imprime a URL que usou — confira que é a do Turso. Ele aplica as migrations e só insere os dados de exemplo se o banco estiver vazio, então repetir o comando não duplica nada.

3. **Importar o repositório na Vercel** e definir as variáveis do projeto:

   | Variável              | Valor                            |
   | --------------------- | -------------------------------- |
   | `GEMINI_API_KEY`      | a sua chave do Gemini            |
   | `SESSION_SECRET`      | 32 caracteres aleatórios ou mais |
   | `DATABASE_URL`        | a URL `libsql://` do passo 1     |
   | `DATABASE_AUTH_TOKEN` | o token do passo 1               |

   `NODE_ENV` e `VERCEL_URL` a Vercel define sozinha. `MCP_SERVER_URL` fica de fora de propósito (ver abaixo) e `PORT` não se aplica a serverless.

4. **Pôr as funções na mesma região do banco**, em Settings → Functions: `gru1` (São Paulo), se o banco do Turso também estiver em São Paulo. O padrão da Vercel é `iad1` (Washington), e a latência que pesa aqui é a da função até o banco, não a do navegador: todas as páginas são renderizadas no servidor, e cada requisição faz várias consultas mais a chamada do agent ao próprio `/api/mcp`. O plano Hobby permite uma região, e a mudança só vale no deploy seguinte.

5. **Publicar.** A Vercel detecta Next.js sozinha; não há `vercel.json` e não precisa de nenhum ajuste de build.

6. **Conferir**: `GET /api/saude?detalhado` deve responder `{"estado":"ok","banco":"ok"}`. Se o banco não responder, o campo `banco` vem `"sem resposta"` e o status é 503.

### O que muda em serverless

- **Migrations e seed não rodam no boot quando o banco é remoto.** Instâncias frias concorrentes correriam entre si para aplicar a mesma migration ou semear o mesmo banco vazio. Com banco remoto, o passo 2 acima é a única vez que isso acontece; com arquivo local o comportamento antigo continua, criando e semeando sozinho sem passo manual.
- **O agent chama o próprio `/api/mcp` por HTTP**, e o endereço é derivado de `VERCEL_URL` quando `MCP_SERVER_URL` não é informada, porque em serverless não existe porta própria para derivar. Cada chamada de ferramenta passa a ser uma segunda invocação de função: conta para a franquia e soma latência. O acoplamento por MCP é requisito do desafio, não acidente.
- **O limite de uso é por instância.** `lib/limite-de-uso.ts` conta em memória e serverless tem várias instâncias, então o teto efetivo é mais alto que os 15 por minuto configurados. Para valer de verdade precisaria de um contador compartilhado — ver "O que eu faria com mais tempo".
- **`maxDuration` de 300 s no `/api/chat`**, que é o teto do plano Hobby e vale também para resposta em streaming. Uma volta do agent fica muito abaixo disso, mas o padrão da plataforma não vale arriscar num endpoint que faz streaming.
- `GEMINI_API_KEY` e `SESSION_SECRET` são obrigatórias em produção. Faltando qualquer uma, `lib/env.ts` recusa o ambiente e **toda requisição devolve 500**, com o nome da variável no log e nunca o valor — `/api/saude` inclusive, que é justamente como se detecta isso.
- `TICKET_SERVICE_FAILURE_RATE` continua em `0.08`: o sistema legado falha de vez em quando de propósito, porque o desafio pede tratamento de indisponibilidade. Para uma demonstração ao vivo sem sustos, defina `0` nas variáveis da Vercel.

## Visão geral da arquitetura

Um app Next.js único, separado em camadas pela direção das dependências. O princípio foi isolar só onde há ganho real, sem camadas pelo nome.

```
 Navegador ──► Next.js (app/, components/)
                  │   Server Components, Server Actions e /api/chat (NDJSON)
                  ▼
              application/        casos de uso: orquestram domínio + ports
                  │
        ┌─────────┼───────────────┐
        ▼         ▼               ▼
     domain/    ports/        agent/  (Mastra + Gemini)
     regras     conversas,       │  só enxerga o serviço pelo cliente MCP
     puras      chamados,        ▼
                central       infrastructure/mcp  ──HTTP──►  /api/mcp
                              (cliente)                     (servidor MCP)
                                                               │
                                              infrastructure/ticket-repo
                                              sistema de chamados simulado
                                              (SQLite, com indisponibilidade
                                               simulada e retry com backoff)
```

| Pasta                 | Responsabilidade                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `domain/`             | Regras do Anexo A como funções puras: prioridade, prazo em horas úteis, vencimento, duplicidade, transferência  |
| `application/`        | Casos de uso (responder mensagem, confirmar rascunho, transferir, console do analista) e os ports que eles usam |
| `agent/`              | Implementação do port `Assistente` com Mastra: instruções, ferramentas, saída estruturada                       |
| `infrastructure/`     | SQLite (Drizzle), repositórios, servidor e cliente MCP, configuração do modelo, composição de produção          |
| `app/`, `components/` | Telas (Atomic Design), Server Actions e a rota de streaming                                                     |
| `tests/`              | Unidade, integração com o servidor MCP real em memória, e `eval/` com o modelo de verdade                       |

**Interface, agent e serviço são separados de verdade.** O serviço de chamados é um servidor MCP (`/api/mcp`) com seis ferramentas; o agent só o enxerga como cliente MCP, nunca importando o repositório. Trocar o sistema legado por um real é trocar o que está atrás do servidor. O agent, por sua vez, só aparece para a aplicação pelo port `Assistente`: os casos de uso não sabem que existe Mastra nem Gemini, e os testes deles usam um assistente falso.

Decisões justificadas, uma a uma, em [`Desenvolvimento/stack-arquitetura.md`](Desenvolvimento/stack-arquitetura.md).

## Como o agent decide o que fazer

**O modelo entende; o código decide as regras.** É a ideia que organiza o agent.

1. **A cada mensagem**, o agent recebe as últimas 20 mensagens da conversa e instruções geradas a partir das constantes do domínio (categorias, tabela de prioridades, prazos, expediente, janela de reabertura). Mudou a regra, mudou o prompt: não há duas cópias para divergirem.
2. **Ele escolhe entre seis ferramentas** e as usa em loop (até 6 passos): consultar os chamados da pessoa, consultar um chamado em detalhe, buscar na central de ajuda, propor um chamado, propor uma atualização ou reabertura, e escrever o resumo para o analista.
3. **Ele termina com uma decisão estruturada**: o que entendeu, a intenção (dúvida, consulta, abertura, complemento, falar com analista, fora do escopo), a segurança de 0 a 1, a justificativa e respostas rápidas. O texto da resposta chega em tempo real, enquanto o JSON ainda está sendo gerado.

O fluxo que o prompt manda seguir: dúvida vai primeiro para a central de ajuda; status de chamado consulta a lista e, ao saber qual, o detalhe; problema novo consulta os chamados antes, para não duplicar (aberto sobre o mesmo problema vira atualização, resolvido há até 7 dias vira reabertura, senão é chamado novo); assunto que não é de TI é redirecionado.

### O que o modelo não decide

| O modelo                                                           | O código                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Quem é afetado e se há urgência (com o trecho da pessoa que prova) | **Prioridade** (`definirPrioridade`) e **prazo** (`calcularPrazo`) |
| Se o artigo da central resolve o caso                              | Quais campos faltam no rascunho (`validarRascunho`)                |
| A segurança que sente (0 a 1)                                      | **Se a conversa vai para um analista** (`avaliarTransferencia`)    |
| O resumo do caso para o analista                                   | Se o chamado pode ser reaberto (janela de 7 dias)                  |

**A confirmação é garantida pela estrutura, não pelo prompt.** As ferramentas do agent só _propõem_: `propor_chamado` e `propor_atualizacao` montam um rascunho. Criar, atualizar e reabrir acontecem no caso de uso `confirmarProposta`, disparado pelo clique do funcionário. `criar_chamado` e `atualizar_chamado` nem estão entre as ferramentas que o modelo vê. Por mais que o modelo erre, ele não tem como pular a confirmação.

**Evidência obrigatória.** Para dizer quem é afetado e qual é a urgência, o modelo precisa citar o trecho literal do que a pessoa escreveu. O código confere o trecho nas mensagens dela; sem trecho válido, o campo é descartado e volta como "falta perguntar". Isso impede o modelo de inventar "equipe parada" a partir de "a impressora do meu andar parou".

### Quando a conversa vai para um analista

Pelos gatilhos do Anexo A, avaliados pelo código na ordem: a pessoa pediu, caso crítico, chamado vencido; e, como decisão própria, limite de 30 mensagens e segurança abaixo de 70%. Vão para o analista na hora todos, **exceto o chamado vencido, que apenas oferece** (o protótipo mostra o agent perguntando "quer que eu chame um analista?"). A transferência leva um resumo do caso, muda o estado do chamado e pausa o agent: enquanto a conversa não está com o agent, as mensagens do funcionário são gravadas, mas o modelo nem é chamado.

### Transparência

Acima de cada resposta ficam as ações **que realmente aconteceram** ("consultou seus chamados", "classificou a prioridade"), inclusive as que falharam. O botão **Como decidi** abre, junto da resposta: o que o agent entendeu, a decisão tomada, a segurança contra o mínimo de 70%, o porquê, cada ação com o que encontrou ("7 chamados no total, 4 em aberto, 2 vencidos"; "afetados: somente você, urgência: trabalho parado → prioridade alta pela tabela do Anexo A"), as fontes da central de ajuda e a recomendação de analista. O analista vê o mesmo painel, de cada resposta, na transcrição.

## Como a qualidade das decisões foi garantida

Em três camadas, da mais barata e determinística para a mais cara.

**1. Regras de negócio como funções puras, com testes.** Prioridade, prazo em horas úteis (com fim de semana, virada de expediente e crítica em hora corrida), vencimento, reabertura em 7 dias, privacidade e gatilhos de transferência. É o que o modelo não pode errar, então não está nas mãos dele.

**2. Testes do loop real do agent sem chave de API.** O Mastra traz um modelo simulado que aceita um stream por passo. Os testes roteirizam "chama ferramenta, chama outra, responde JSON" e exercitam o loop de verdade, com o servidor MCP real em memória por trás. Cobrem também respostas fora do formato, privacidade (injetar o id de outro funcionário na entrada é ignorado) e a recusa de evidência fraca. São cerca de 220 testes em `npm test`, rápidos e determinísticos.

**3. Conjunto de avaliação com o modelo de verdade** (`npm run eval`). 14 casos, cobrindo os dois critérios do PRD:

- _Qualidade das decisões_: dúvida resolvida pela central; artigo que não se aplica (erro 809 no Windows 11); não duplicar chamado aberto; reabrir resolvido há 4 dias; não reabrir o de 20 dias; chamado vencido com oferta de analista; caso crítico indo direto ao analista; pedido explícito de pessoa; assunto fora de TI; privacidade (pedir o chamado de outra pessoa).
- _Condução da conversa_: não presumir impacto nem urgência; completar um pedido de equipamento; achar o chamado sem o número; não adivinhar quando a pessoa é vaga.

Cada caso roda pelo caso de uso real e verifica a **decisão gravada**, a mesma que a tela mostra. Quatro verificações valem para toda rodada (uma pergunta por vez, sem markdown, nunca dizer que já abriu o chamado, sempre registrar o que entendeu e por quê), e uma vale para o caso inteiro: nenhum chamado foi criado sem confirmação.

O eval já se pagou. Rodando contra o Gemini, encontrou três problemas que viraram correção: uma resposta em texto puro, sem o JSON, derrubava a conversa; uma palavra solta ("meu") passava como evidência de "só eu sou afetado"; e o modelo fazia duas perguntas na mesma mensagem e presumia urgência. Placar ao longo dos ajustes: 10 de 14, depois 11, depois 13.

**Estado atual: 13 de 14 casos passam, e a limitação que sobrou está marcada no próprio caso** (`falhaConhecida`). Em "preciso de um segundo monitor para o home office", o modelo cita a frase inteira da pessoa como prova de quem é afetado e monta o rascunho sem perguntar. A regra literal prova que as palavras existem, não que elas digam aquilo. O estrago é pequeno (requisição fica com prioridade baixa, o rascunho mostra "afetados: somente você" e nada é criado sem confirmação), mas é presunção, e está medida. O eval fica fora do `npm test` porque depende da API, gasta chamadas e varia entre execuções; caso marcado como falha conhecida passa a reclamar quando começar a funcionar.

## Escolha do modelo

**Gemini, pelo modelo `gemini-3.5-flash-lite`.** O PRD aceita qualquer provedor. Escolhi o Gemini porque tem plano gratuito real, sem cartão vinculado, o que deixa qualquer pessoa rodar o projeto, e o `flash-lite` por latência e custo: responde em cerca de 1 segundo e conduziu um fluxo completo de abertura de chamado em 6 segundos. Os modelos flash maiores estavam sobrecarregados no teste real (erro 503 e respostas de até 56 s para um "oi").

O custo dessa escolha é um modelo menor com menos julgamento. A resposta de engenharia foi **não confiar no julgamento dele onde dá para não confiar**: prioridade e prazo vêm do domínio, a confirmação é estrutural, a evidência é conferida pelo código e o eval mede o que sobra. O modelo é uma variável de ambiente (`GEMINI_MODEL`), e trocar de provedor é trocar `infrastructure/llm/modelo.ts`.

**Eficiência.** Uma chamada de modelo por rodada (com o loop de ferramentas), histórico limitado a 20 mensagens, temperatura 0,2 e teto de 45 s. Confirmar e cancelar rascunho são texto montado pelo código, com zero tokens. O limite de 30 mensagens por sessão conta só as do funcionário, porque cada uma é uma chamada ao modelo, e é bloqueado **no servidor**: a 31ª nem chega ao modelo.

## Segurança e privacidade

- **Chaves fora do código.** Tudo vem do ambiente, validado em `lib/env.ts`. Nenhuma variável tem o prefixo `NEXT_PUBLIC_`, então nenhum segredo vai para o navegador; conferido no build, a chave do Gemini não aparece em nenhum arquivo gerado.
- **Chamados de um funcionário nunca chegam a outro.** O `funcionarioId` vem da sessão e é fechado na criação das ferramentas, a cada requisição; o modelo não tem esse campo. Dentro do servidor MCP, chamado de outra pessoa e chamado inexistente devolvem a mesma mensagem, para não confirmar que o dos outros existe. A rota de atualização ao vivo confere o dono da conversa. Há teste para cada uma dessas camadas.
- **O analista vê só os chamados do funcionário em atendimento**, a partir do id da conversa, nunca de uma busca livre.
- **Limite de uso por pessoa.** Além do teto de 30 mensagens por sessão, `/api/chat` aceita no máximo 15 mensagens por minuto por funcionário (`lib/limite-de-uso.ts`), para que uma aba em laço não consuma a cota do Gemini. Passando disso, a conversa continua de onde parou depois de um minuto. A contagem é em memória, o que basta para uma instância só.
- **Sessão** em cookie assinado com HMAC-SHA256, `httpOnly`, `sameSite=lax`, `secure` em produção, comparação em tempo constante. Logout é navegação completa (`POST /sair`): no Next 16 a página guardava em memória a conversa do usuário anterior, e o logout por navegação completa descarta isso. Foi um bug real, achado no teste manual.

## Principais trade-offs

- **Regras no código, modelo para entender.** Mais código e mais ferramentas, menos flexibilidade para o modelo "improvisar" uma prioridade. Em troca, a regra do Anexo A é testável e o modelo não consegue violá-la.
- **MCP sobre HTTP para o próprio app.** A fronteira entre agent e serviço é real (protocolo, não só pasta), mas custa um salto de rede dentro do mesmo processo e exige `MCP_SERVER_URL` apontando para o próprio servidor. Aceitei porque é exatamente a separação que o PRD pede, e porque trocar o sistema legado por um real fica de graça.
- **SQLite/libSQL.** Simples e persistente, e o mesmo código serve arquivo local em desenvolvimento e Turso em produção, porque o driver é o mesmo. O preço é que o preparo do banco deixa de ser automático quando ele é remoto, e que o limite de uso em memória perde força com várias instâncias (ver `stack-arquitetura.md`).
- **Atualização ao vivo por consulta a cada 5 segundos**, em vez de SSE ou WebSocket. O streaming que importa (a resposta do agent) já acontece na própria requisição; manter conexão aberta por aba só para o lado humano custaria mais do que entrega. O preço é uma latência de até 5 s quando o analista responde.
- **A segurança (0 a 1) é autodeclarada pelo modelo**, não calibrada. Por isso é só um gatilho de último recurso: os gatilhos explícitos do Anexo A vêm antes, e o painel mostra o número ao lado do mínimo, para quem lê julgar.
- **Retry do sistema legado é invisível.** As três tentativas com backoff terminam em cerca de 600 ms no servidor. Na tela aparece o resultado: a ação com X e o motivo, e o rascunho que libera o botão para confirmar de novo. Expor cada tentativa exigiria um canal do repositório até o stream.
- **Dependência do plano gratuito do Gemini**: 15 chamadas por minuto e picos de indisponibilidade. O eval tem ritmo próprio e repete o caso quando a API devolve 503; na aplicação, o erro vira "tente de novo" e nunca perde a mensagem da pessoa.
- **Fuso fixo em −03:00 e feriados não modelados.** O Brasil não tem horário de verão desde 2019, então o offset é constante e dispensa biblioteca. Feriados são o próximo passo natural do cálculo de prazo.
- **Qualquer senha é aceita**, como o PRD pede para os usuários de exemplo.

## O que eu faria com mais tempo

- **Fechar a falha conhecida do eval**: validar semanticamente a evidência (uma segunda checagem barata de que o trecho citado _diz_ o que o modelo afirma), em vez de só conferir que ele existe.
- **Eval estatístico**: rodar cada caso várias vezes e medir a taxa de acerto, já que um modelo com temperatura não responde igual duas vezes; e um juiz de LLM para tom e clareza, que hoje só são verificados por regras simples.
- **Observabilidade**: rastreamento de cada decisão, tempo e tokens por conversa, para o custo por conversa ser um número e não uma estimativa.
- **Tempo real de verdade** (SSE) para o lado do analista, e notificação quando uma conversa entra na fila.
- **Editar o rascunho num formulário** com revalidação pela mesma regra de prioridade, em vez do "Editar" conversacional de hoje.
- **Feriados** no cálculo de prazos e fuso configurável.
- **Autenticação real** (hoje qualquer senha é aceita, como o PRD pede) e limite de uso compartilhado entre instâncias — o atual é por processo, o que em serverless significa um teto efetivo mais alto que o configurado.
- **Testes de ponta a ponta** com navegador (Playwright) para o fluxo funcionário → analista → funcionário, que hoje eu só validei à mão.
- **Presença e leitura** (contador de não lidas, ticks, "digitando…"): o protótipo mostra os três, mas não há modelo de presença nem de leitura, e inventar esses números seria mentir na tela. Ver Etapa 12.6 em `Desenvolvimento/plano-desenvolvimento.md`.

## Estrutura do repositório

Detalhada em [`Desenvolvimento/stack-arquitetura.md`](Desenvolvimento/stack-arquitetura.md), com as decisões de cada etapa. O plano de desenvolvimento e o histórico de etapas estão em [`Desenvolvimento/plano-desenvolvimento.md`](Desenvolvimento/plano-desenvolvimento.md), e o PRD do desafio em [`Documentacao/`](Documentacao/).
