export const JANELA_DO_LIMITE_EM_MS = 60_000;
export const MAXIMO_DE_MENSAGENS_POR_JANELA = 15;

type Janela = { abertaEm: number; usos: number };

const janelas = new Map<string, Janela>();

function descartarJanelasVencidas(agora: number) {
  for (const [chave, janela] of janelas) {
    if (agora - janela.abertaEm >= JANELA_DO_LIMITE_EM_MS)
      janelas.delete(chave);
  }
}

export function registrarUso(chave: string, agora = Date.now()): boolean {
  descartarJanelasVencidas(agora);

  const janela = janelas.get(chave);
  if (janela === undefined) {
    janelas.set(chave, { abertaEm: agora, usos: 1 });
    return true;
  }

  if (janela.usos >= MAXIMO_DE_MENSAGENS_POR_JANELA) return false;

  janela.usos += 1;
  return true;
}

export function esquecerUsos() {
  janelas.clear();
}
