import { KeyRound, Lock, Mail, RotateCcwKey } from "lucide-react";
import { Botao } from "@/components/atoms/Botao";
import { LayoutDoAtendimento } from "@/components/templates/LayoutDoAtendimento";
import { exigirUsuario } from "@/lib/sessao-servidor";

export const instant = false;

const SENHA_ALTERADA_HA_DO_PROTOTIPO = "Alterada há 42 dias";

export default async function PaginaDoPerfil() {
  const funcionario = await exigirUsuario("funcionario");

  return (
    <LayoutDoAtendimento usuario={funcionario} secao="Meu perfil">
      <div className="flex-1 overflow-y-auto px-10 py-12">
        <div className="mx-auto w-full max-w-xl space-y-8">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-tinta">
              Meu perfil
            </h1>
            <p className="text-sm text-tinta-fraca">
              Seus dados de acesso ao service desk de TI.
            </p>
          </div>

          <dl className="overflow-hidden rounded-2xl border border-borda-forte bg-superficie sombra-de-cartao">
            <div className="flex items-center gap-4 border-b border-borda px-6 py-5">
              <dt className="w-40 shrink-0 text-sm text-tinta-fraca">Nome</dt>
              <dd className="flex-1 text-sm font-medium text-tinta">
                {funcionario.nome}
              </dd>
            </div>
            <div className="flex flex-wrap items-center gap-4 px-6 py-5">
              <dt className="w-40 shrink-0 text-sm text-tinta-fraca">
                E-mail corporativo
              </dt>
              <dd className="flex-1 text-sm font-medium text-tinta">
                {funcionario.email}
              </dd>
              <p className="inline-flex items-center gap-1.5 text-xs text-tinta-fraca">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Gerenciado pela TI
              </p>
            </div>
          </dl>

          <section className="overflow-hidden rounded-2xl border border-borda-forte bg-superficie sombra-de-cartao">
            <div className="flex flex-wrap items-center gap-4 p-6">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-superficie-baixa text-tinta-media"
              >
                <KeyRound className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-tinta">Senha</h2>
                <p className="text-sm text-tinta-fraca">
                  {SENHA_ALTERADA_HA_DO_PROTOTIPO}
                </p>
              </div>
              <Botao variante="secundario" disabled>
                <RotateCcwKey className="h-4 w-4" aria-hidden="true" />
                Redefinir senha
              </Botao>
            </div>
            <p className="flex items-center gap-2 border-t border-borda bg-superficie-baixa px-6 py-3 text-xs text-tinta-fraca">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Enviaremos um link de redefinição para {funcionario.email}.
            </p>
          </section>
        </div>
      </div>
    </LayoutDoAtendimento>
  );
}
