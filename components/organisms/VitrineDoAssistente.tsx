import { Check } from "lucide-react";
import { MarcaNexoAssist } from "@/components/atoms/MarcaNexoAssist";

const NUMEROS = [
  { valor: "8 s", legenda: "primeira resposta, em média" },
  { valor: "72%", legenda: "resolvidos sem fila" },
  { valor: "6", legenda: "analistas online agora" },
];

const ACOES_DO_EXEMPLO = ["consultou seus chamados", "criou um chamado"];

export function VitrineDoAssistente() {
  return (
    <div className="flex h-full min-h-fit flex-col justify-between gap-6 bg-superficie-escura px-8 py-7 text-tinta-invertida xl:px-12 xl:py-10">
      <MarcaNexoAssist tom="claro" tamanho="grande" />

      <div className="space-y-5">
        <p className="text-sm font-medium text-tinta-invertida-fraca">
          Service desk de TI da Nexo
        </p>
        <h1 className="font-serif text-4xl leading-tight text-balance xl:text-5xl">
          Seu problema de TI, resolvido em uma conversa.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-tinta-invertida-media">
          Descreva o que está acontecendo. O assistente consulta seus chamados,
          busca na central de ajuda e chama um analista quando precisa.
        </p>

        <div className="max-w-md space-y-3 rounded-2xl border border-borda-escura bg-superficie-escura-alta p-4">
          <p className="ml-auto w-fit rounded-xl rounded-br bg-superficie px-3 py-2 text-sm text-tinta">
            Meu notebook não conecta na VPN. Erro 809.
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-invertida-fraca">
            <span className="font-medium text-tinta-invertida">
              Nexo Assist
            </span>
            {ACOES_DO_EXEMPLO.map((acao) => (
              <span key={acao} className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-resolvido" aria-hidden="true" />
                {acao}
              </span>
            ))}
          </div>

          <p className="w-fit rounded-xl rounded-tl bg-superficie-escura-mais-alta px-3 py-2 text-sm">
            Pronto: abri o chamado com prioridade alta. Um analista fala com
            você em até 4 h úteis.
          </p>

          <p className="inline-flex items-center gap-2 rounded-xl bg-superficie px-3 py-1.5 text-xs">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-alta"
            />
            <span className="font-semibold text-tinta">INC-20517</span>
            <span className="text-tinta-fraca">
              Rede e VPN · Alta · em até 4 h
            </span>
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-borda-escura border-t border-borda-escura pt-5">
        {NUMEROS.map(({ valor, legenda }) => (
          <div key={legenda} className="px-5 first:pl-0 last:pr-0">
            <dt className="font-serif text-3xl xl:text-4xl">{valor}</dt>
            <dd className="mt-1 text-xs text-tinta-invertida-fraca">
              {legenda}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
