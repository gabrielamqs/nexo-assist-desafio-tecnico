import { sql } from "drizzle-orm";
import { banco } from "@/infrastructure/db/client";

export async function GET(requisicao: Request): Promise<Response> {
  const detalhado = new URL(requisicao.url).searchParams.has("detalhado");

  try {
    await banco().run(sql`select 1`);
  } catch {
    return Response.json(
      { estado: "indisponivel", banco: "sem resposta" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    detalhado ? { estado: "ok", banco: "ok" } : { estado: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
