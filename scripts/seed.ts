import { criarBancoDeDados, migrar } from "@/infrastructure/db/client";
import { semearBancoDeDados } from "@/infrastructure/db/seed";
import { urlDoBanco } from "@/lib/env";

async function main() {
  const banco = criarBancoDeDados();
  await migrar(banco);
  const semeou = await semearBancoDeDados(banco);

  console.log(
    semeou
      ? `Dados de exemplo gravados em ${urlDoBanco()}`
      : `O banco em ${urlDoBanco()} já tem dados; nada foi alterado.`,
  );
}

main().catch((erro: unknown) => {
  console.error(erro);
  process.exitCode = 1;
});
