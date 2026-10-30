import type { ArtigoDaCentralDeAjuda } from "@/domain/types";

export type CentralDeAjuda = {
  buscar(termo: string, limite?: number): Promise<ArtigoDaCentralDeAjuda[]>;
  listarTodos(): Promise<ArtigoDaCentralDeAjuda[]>;
};
