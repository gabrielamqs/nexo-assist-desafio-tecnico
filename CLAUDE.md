# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Nexo Assist: chat agent for an IT service desk (Next.js 16 App Router, Mastra + Gemini, MCP, Drizzle + SQLite). Code, identifiers, UI text and docs are in Brazilian Portuguese; keep new names in Portuguese to match. The source of truth for requirements is `Documentacao/Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf`; `Desenvolvimento/stack-arquitetura.md` records every design decision and `Desenvolvimento/plano-desenvolvimento.md` is the stage checklist.

## Commands

```bash
npm run dev                 # needs the server up: the agent calls its own /api/mcp over HTTP (MCP_SERVER_URL)
npm test                    # Vitest, deterministic, no API key
npx vitest run tests/domain/prazos.test.ts          # single file
npx vitest run -t "nome do teste"                   # single test by name
npm run eval                # 14 cases against the real Gemini (needs GEMINI_API_KEY in .env, takes ~4 min)
npm run typecheck && npm run lint && npm run format:check && npm run build
npm run conversar           # chat with the agent in the terminal (dev server must be running)
```

`npm test` only picks up `tests/**/*.test.ts`; eval files are `tests/eval/*.eval.ts` and run through `vitest.eval.config.mts`.

## Working convention

At the end of each stage: `git add` the specific files (never `git add -A`), propose a commit message, and **do not commit** — the owner reviews and commits. Commit trailer: use the attribution given in the session reminder.

## Code rules (enforced by the owner)

- **No comments** unless a hidden invariant needs one short line.
- **No literal design values**: no hex, no default Tailwind palette colors, no `text-white`/`bg-white`. Use semantic tokens from `app/globals.css` (`primario`, `superficie`, `tinta`, `borda`, `critica`/`alta`/`media`/`baixa`/`resolvido`, …). Layout widths are tokens too (`--largura-da-fila`); no arbitrary-value classes.
- **No `process.env` outside `lib/env.ts`** (only exception: `NEXT_RUNTIME` in `instrumentation.ts`). Read through `ambiente()` / `chaveDoGemini()`.
- DRY/SOLID only where it earns something; no abstraction layers for their own sake.

## Architecture

Dependencies point inward: `app/` + `components/` → `application/` → `domain/`; `infrastructure/` and `agent/` implement the ports declared in `application/ports/`.

- `domain/`: pure Anexo A rules (priority from impact+urgency, business-hours deadlines at fixed −03:00, reopen window, transfer triggers, conversation states/queue filters). No framework imports.
- `application/usecases/`: one function per use case taking its dependencies explicitly. `responder-mensagem.ts` is the core round: persist user message → call `Assistente` → build the recorded `DecisaoDoAgent` → evaluate transfer → maybe transfer.
- `application/acoes-do-agent.ts`: turns recorded tool calls into the actions/proposal/card data shown in the UI. The UI renders from this stored decision, never from a fresh query.
- `agent/`: the `Assistente` port implemented with Mastra. A new `Agent` is built **per request** so `funcionarioId` is closed over in the tools. `ferramentas.ts` (tools the model sees), `instrucoes.ts` (prompt generated from domain constants), `saida.ts` (structured-output zod schema with `.catch()` defaults; plain-text replies without JSON are salvaged with confidence 0, which triggers analyst transfer).
- `infrastructure/mcp/`: the ticket service is an MCP server at `app/api/mcp/route.ts`; the agent only reaches it through the MCP client (tool names arrive prefixed, e.g. `chamados_consultar_chamados`). Composition root: `infrastructure/dependencias.ts` (memoized factories).
- `infrastructure/ticket-repo/`: the simulated legacy system. Random unavailability is rolled **before** any write (so retry is safe), wrapped by `comTentativas` (exponential backoff).
- Persistence: libsql/SQLite via Drizzle; migrations and seed run at startup from `instrumentation.ts` (not at build). Dev DB is `data/nexo-assist.db`.

### Invariants that are easy to break

- **The model never picks priority or deadline, and never creates/updates tickets.** Its tools only _propose_ (`propor_chamado`, `propor_atualizacao`); creation happens in `confirmar-proposta.ts` on the user's click. `criar_chamado`/`atualizar_chamado` exist in MCP but are deliberately not given to the model.
- `propor_chamado` requires a **literal evidence quote** from the employee's own messages for "who is affected" and "urgency" (`foiDitoPeloFuncionario`; ≥2 words or the whole message). Without it the field is dropped and reported as missing.
- **Privacy**: employees see only their own tickets; the id comes from the session, never from model input; another person's ticket and a nonexistent one return the same message. Analyst console loads tickets by the conversation's employee id only.
- While a conversation is not `com_agent`, `responderMensagem` stores the message and returns without calling the model. Expired-deadline tickets only _offer_ an analyst; the other triggers transfer immediately (`transfereImediatamente`).
- The 30-message limit counts only employee messages and is enforced server-side.
- Chat streaming is NDJSON from `POST /api/chat`; `GET /api/chat?conversa=&desde=` is polled every 5 s for human-side updates and checks conversation ownership.

### Next.js 16 specifics (`cacheComponents: true`)

- Routes reading cookies need `export const instant = false`, and session reads call `connection()` first.
- No `export const runtime` in route files. Files with `"use server"` may export only async functions (initial form state lives in separate files like `app/login/estado.ts`).
- Server Actions must be `async function`; Server Components cannot pass functions to Client Components.
- Logout is `POST /sair` → 303 (full navigation) on purpose: Next preserves page state between logins in the same tab and would show the previous user's conversation.

## Testing notes

- Agent loop tests use Mastra's `MastraLanguageModelV2Mock` scripted per step (`tests/agent/modelo-roteirizado.ts`) with the real MCP server on an in-memory DB (`tests/agent/servico-em-memoria.ts`).
- The eval runner (`tests/eval/executar.ts`) paces calls to Gemini's free-tier 15 req/min and reruns a case if the API returns 503. A case marked `falhaConhecida` runs as `it.fails`: it goes red when it starts passing, so remove the mark then.
- `npm run eval` loads `.env` itself; `npm test` does not.
