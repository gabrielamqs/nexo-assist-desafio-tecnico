export class SistemaDeChamadosIndisponivelError extends Error {
  constructor() {
    super("O sistema de chamados está indisponível no momento.");
    this.name = "SistemaDeChamadosIndisponivelError";
  }
}

export type VerificacaoDeDisponibilidade = () => void;

export const sempreDisponivel: VerificacaoDeDisponibilidade = () => {};

export const criarVerificacaoDeDisponibilidade =
  (taxaDeFalha: number, sortear: () => number = Math.random) =>
  () => {
    if (sortear() < taxaDeFalha) {
      throw new SistemaDeChamadosIndisponivelError();
    }
  };
