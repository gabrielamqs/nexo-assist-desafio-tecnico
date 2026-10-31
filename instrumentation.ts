export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { ambiente } = await import("@/lib/env");
  ambiente();

  const { prepararBancoDeDados } = await import("@/infrastructure/db/client");
  await prepararBancoDeDados();
}
