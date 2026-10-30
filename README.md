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

### Scripts

| Comando                | O que faz                              |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento            |
| `npm run build`        | Build de produção                      |
| `npm start`            | Servidor de produção (após o build)    |
| `npm run lint`         | ESLint                                 |
| `npm run typecheck`    | Checagem de tipos do TypeScript        |
| `npm run format`       | Formata o código com Prettier          |
| `npm run format:check` | Verifica a formatação sem alterar nada |
| `npm test`             | Testes com Vitest                      |
| `npm run test:watch`   | Testes em modo watch                   |
