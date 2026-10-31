import { existsSync } from "node:fs";

const ARQUIVO_DE_AMBIENTE = ".env";

if (existsSync(ARQUIVO_DE_AMBIENTE)) process.loadEnvFile(ARQUIVO_DE_AMBIENTE);
