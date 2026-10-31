# Nexo Assist

Agent de atendimento do service desk de TI da Nexo. O funcionário descreve o problema num chat, e o agent consulta os chamados dele, busca na central de ajuda, abre ou atualiza chamados e transfere a conversa para um analista quando necessário.

> Em desenvolvimento. As seções de arquitetura, decisões do agent, qualidade das decisões, trade-offs e próximos passos serão preenchidas ao longo do projeto.

## Stack

Next.js (App Router) · TypeScript · Mastra · Google Gemini · MCP · Drizzle + SQLite · Tailwind CSS · Vitest

## Como rodar

Pré-requisitos: Node.js 22 ou superior e npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Preencha o `.env` (ao menos `GEMINI_API_KEY` e `SESSION_SECRET`). A aplicação sobe em http://localhost:3000.

O agent consome o serviço de chamados por MCP no endereço `MCP_SERVER_URL` (padrão `http://localhost:3000/api/mcp`). Se rodar em outra porta, ajuste essa variável.

O banco SQLite é criado, migrado e populado com os dados de exemplo na primeira vez que a aplicação sobe — não há passo manual. Ele fica em `data/nexo-assist.db` (fora do versionamento); apagar essa pasta devolve o projeto ao estado inicial.

### Como entrar

Qualquer senha é aceita para os usuários de exemplo. O login roteia conforme o papel:

| E-mail                      | Papel       | Vai para    |
| --------------------------- | ----------- | ----------- |
| `ana.souza@nexo.com.br`     | Funcionária | `/chat`     |
| `bruno.tavares@nexo.com.br` | Funcionário | `/chat`     |
| `carla.mendes@nexo.com.br`  | Funcionária | `/chat`     |
| `diego.ramos@nexo.com.br`   | Funcionário | `/chat`     |
| `rafael.lima@nexo.com.br`   | Analista    | `/analista` |

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
| `npm test`             | Testes com Vitest                                                      |
| `npm run test:watch`   | Testes em modo watch                                                   |
| `npm run eval`         | Casos de avaliação das decisões do agent, com o Gemini real            |
| `npm run db:generate`  | Gera a migration a partir do schema                                    |
| `npm run db:seed`      | Popula o banco com os dados de exemplo                                 |
| `npm run conversar`    | Conversa com o agent no terminal, mostrando a decisão de cada resposta |
