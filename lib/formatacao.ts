const FUSO_HORARIO = "America/Sao_Paulo";
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const formatoDoDia = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const formatoDaHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  hour: "2-digit",
  minute: "2-digit",
});

const formatoDoDiaEMes = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  day: "2-digit",
  month: "2-digit",
});

const formatoCompleto = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatarDataHoraCompleta = (data: Date) =>
  formatoCompleto.format(data);

export function formatarPrazoDeResposta(prazo: Date, agora: Date): string {
  const horario = formatoDaHora.format(prazo);
  const diaDoPrazo = formatoDoDia.format(prazo);

  if (diaDoPrazo === formatoDoDia.format(agora)) return `hoje às ${horario}`;

  const amanha = new Date(agora.getTime() + MS_POR_DIA);
  if (diaDoPrazo === formatoDoDia.format(amanha)) {
    return `amanhã às ${horario}`;
  }

  return `em ${formatoDoDiaEMes.format(prazo)} às ${horario}`;
}
