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

const formatoDiaCurto = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  day: "2-digit",
  month: "short",
});

export const formatarHora = (data: Date) => formatoDaHora.format(data);

export const ehOutroDia = (uma: Date, outra: Date) =>
  formatoDoDia.format(uma) !== formatoDoDia.format(outra);

const formatoDoDiaPorExtenso = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  day: "numeric",
  month: "long",
});

export function formatarDiaDaConversa(data: Date, agora: Date): string {
  if (!ehOutroDia(data, agora)) return "Hoje";

  const ontem = new Date(agora.getTime() - MS_POR_DIA);
  if (!ehOutroDia(data, ontem)) return "Ontem";

  return formatoDoDiaPorExtenso.format(data);
}

export function formatarDiaCurto(data: Date): string {
  const partes = formatoDiaCurto.formatToParts(data);
  const dia = partes.find((parte) => parte.type === "day")?.value ?? "";
  const mes = partes.find((parte) => parte.type === "month")?.value ?? "";
  return `${dia} ${mes.replace(".", "")}`;
}

export const formatarDataHoraCurta = (data: Date) =>
  `${formatarDiaCurto(data)}, ${formatarHora(data)}`;

export function formatarTempoDecorrido(desde: Date, agora: Date): string {
  const minutos = Math.floor((agora.getTime() - desde.getTime()) / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}
