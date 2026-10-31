const MINUTO_EM_MS = 60_000;
const MARGEM_EM_MS = 1_000;

const esperar = (ms: number) =>
  new Promise((resolver) => setTimeout(resolver, Math.max(ms, 0)));

export type Ritmo = {
  aguardarVaga(chamadasPrevistas: number): Promise<void>;
  registrar(chamadasFeitas: number): void;
};

export function criarRitmo(limitePorMinuto: number): Ritmo {
  const momentos: number[] = [];

  const noUltimoMinuto = () => {
    const corte = Date.now() - MINUTO_EM_MS;
    return momentos.filter((momento) => momento > corte);
  };

  return {
    async aguardarVaga(chamadasPrevistas) {
      const vagasNecessarias = Math.min(chamadasPrevistas, limitePorMinuto);
      let janela = noUltimoMinuto();

      while (janela.length + vagasNecessarias > limitePorMinuto) {
        const maisAntigo = janela[0] ?? Date.now();
        await esperar(maisAntigo + MINUTO_EM_MS + MARGEM_EM_MS - Date.now());
        janela = noUltimoMinuto();
      }
    },

    registrar(chamadasFeitas) {
      const momento = Date.now();
      for (let feita = 0; feita < chamadasFeitas; feita += 1) {
        momentos.push(momento);
      }
    },
  };
}
