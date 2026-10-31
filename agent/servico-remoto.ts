export type FerramentaDoServicoDeChamados =
  "consultar_chamados" | "consultar_chamado" | "buscar_central_ajuda";

export type ServicoDeChamadosRemoto = (
  ferramenta: FerramentaDoServicoDeChamados,
  entrada: Record<string, unknown>,
) => Promise<unknown>;

export function mensagemDoErro(erro: unknown): string {
  const bruta = erro instanceof Error ? erro.message : String(erro);

  try {
    const dados: unknown = JSON.parse(bruta);
    if (
      typeof dados === "object" &&
      dados !== null &&
      "message" in dados &&
      typeof dados.message === "string"
    ) {
      return dados.message;
    }
    return bruta;
  } catch {
    return bruta;
  }
}
