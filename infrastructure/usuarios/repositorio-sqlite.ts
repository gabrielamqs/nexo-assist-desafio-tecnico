import { eq, sql } from "drizzle-orm";
import type { RepositorioDeUsuarios } from "@/application/ports/usuarios";
import type { BancoDeDados } from "@/infrastructure/db/client";
import { usuarios } from "@/infrastructure/db/schema";

export function criarRepositorioDeUsuarios(
  banco: BancoDeDados,
): RepositorioDeUsuarios {
  return {
    async buscarPorEmail(email) {
      const [usuario] = await banco
        .select()
        .from(usuarios)
        .where(sql`lower(${usuarios.email}) = ${email.trim().toLowerCase()}`)
        .limit(1);
      return usuario ?? null;
    },

    async buscarPorId(id) {
      const [usuario] = await banco
        .select()
        .from(usuarios)
        .where(eq(usuarios.id, id))
        .limit(1);
      return usuario ?? null;
    },
  };
}
