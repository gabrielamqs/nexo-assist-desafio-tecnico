export const semAcentos = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const paraComparacao = (texto: string) =>
  semAcentos(texto)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
