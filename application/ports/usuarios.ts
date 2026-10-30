import type { Usuario } from "@/domain/types";

export type RepositorioDeUsuarios = {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
};
