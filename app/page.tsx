import { redirect } from "next/navigation";
import { ROTA_DE_LOGIN, rotaInicialPara } from "@/lib/rotas";
import { sessaoAtual } from "@/lib/sessao-servidor";

export const instant = false;

export default async function Home() {
  const sessao = await sessaoAtual();

  redirect(sessao === null ? ROTA_DE_LOGIN : rotaInicialPara(sessao.papel));
}
