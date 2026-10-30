import { MarcaNexoAssist } from "@/components/atoms/MarcaNexoAssist";
import { CartaoDoUsuario } from "@/components/molecules/CartaoDoUsuario";
import { exigirUsuario } from "@/lib/sessao-servidor";

export const instant = false;

export default async function PaginaDoChat() {
  const funcionario = await exigirUsuario("funcionario");

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between gap-4">
        <MarcaNexoAssist />
        <div className="w-64">
          <CartaoDoUsuario usuario={funcionario} />
        </div>
      </header>

      <section className="space-y-2 rounded-2xl border border-borda bg-papel p-8">
        <h1 className="font-serif text-2xl">Olá, {funcionario.nome}.</h1>
        <p className="text-sm text-tinta-media">
          O chat com o Nexo Assist entra aqui na próxima etapa.
        </p>
      </section>
    </main>
  );
}
