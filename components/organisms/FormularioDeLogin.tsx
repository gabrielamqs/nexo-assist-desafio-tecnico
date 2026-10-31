"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useActionState, useState } from "react";
import { entrar } from "@/app/login/acoes";
import { ESTADO_INICIAL_DO_LOGIN } from "@/app/login/estado";
import { Aviso } from "@/components/atoms/Aviso";
import { Botao } from "@/components/atoms/Botao";
import { CampoDeTexto } from "@/components/atoms/CampoDeTexto";
import { CampoDeFormulario } from "@/components/molecules/CampoDeFormulario";

export function FormularioDeLogin({
  emailSugerido,
}: {
  emailSugerido: string;
}) {
  const [estado, acao, enviando] = useActionState(
    entrar,
    ESTADO_INICIAL_DO_LOGIN,
  );
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [email, setEmail] = useState(emailSugerido);

  return (
    <form action={acao} className="space-y-5" noValidate>
      <CampoDeFormulario id="email" rotulo="E-mail corporativo">
        <CampoDeTexto
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          placeholder="nome.sobrenome@nexo.com.br"
          icone={<Mail className="h-4 w-4" aria-hidden="true" />}
        />
      </CampoDeFormulario>

      <CampoDeFormulario
        id="senha"
        rotulo="Senha"
        acao={
          <span className="text-sm text-tinta-fraca">
            Qualquer senha é aceita nesta demonstração
          </span>
        }
      >
        <CampoDeTexto
          id="senha"
          name="senha"
          type={senhaVisivel ? "text" : "password"}
          autoComplete="current-password"
          defaultValue="senha-de-demonstracao"
          icone={<Lock className="h-4 w-4" aria-hidden="true" />}
          acessorio={
            <button
              type="button"
              onClick={() => setSenhaVisivel((visivel) => !visivel)}
              aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
              className="rounded p-1.5 text-tinta-fraca hover:text-tinta-media focus-visible:outline-2 focus-visible:outline-primario"
            >
              {senhaVisivel ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          }
        />
      </CampoDeFormulario>

      <label className="flex items-center gap-2 text-sm text-tinta-media">
        <input
          type="checkbox"
          name="manterConectado"
          defaultChecked
          className="h-4 w-4 rounded border-borda text-primario focus-visible:outline-2 focus-visible:outline-primario"
        />
        Manter conectado neste computador
      </label>

      {estado.erro !== null && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <Botao type="submit" largura="total" disabled={enviando}>
        {enviando ? "Entrando..." : "Entrar"}
        {!enviando && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </Botao>
    </form>
  );
}
