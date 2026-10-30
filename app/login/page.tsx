import { redirect } from "next/navigation";
import { MarcaNexoAssist } from "@/components/atoms/MarcaNexoAssist";
import { FormularioDeLogin } from "@/components/organisms/FormularioDeLogin";
import { VitrineDoAssistente } from "@/components/organisms/VitrineDoAssistente";
import { TelaDividida } from "@/components/templates/TelaDividida";
import { rotaInicialPara } from "@/lib/rotas";
import { sessaoAtual } from "@/lib/sessao-servidor";

export const instant = false;

const EMAIL_SUGERIDO = "ana.souza@nexo.com.br";

export default async function PaginaDeLogin() {
  const sessao = await sessaoAtual();
  if (sessao !== null) redirect(rotaInicialPara(sessao.papel));

  return (
    <TelaDividida apresentacao={<VitrineDoAssistente />}>
      <div className="flex items-center justify-end p-6 text-sm text-tinta-media">
        <span>
          Problema para entrar?{" "}
          <span className="font-medium text-primario">Ligue no ramal 4000</span>
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-4">
        <div className="w-full max-w-sm space-y-7">
          <div className="lg:hidden">
            <MarcaNexoAssist />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-3xl">Entrar</h2>
            <p className="text-sm text-tinta-media">
              Use seu e-mail corporativo e a senha da rede Nexo.
            </p>
          </div>

          <FormularioDeLogin emailSugerido={EMAIL_SUGERIDO} />
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 p-6 text-xs text-tinta-fraca">
        <span>© 2026 Nexo · Service desk de TI</span>
        <span>Privacidade e uso de dados</span>
      </footer>
    </TelaDividida>
  );
}
