import { MarcaNexoAssist } from "@/components/atoms/MarcaNexoAssist";
import { CartaoDoUsuario } from "@/components/molecules/CartaoDoUsuario";
import { exigirUsuario } from "@/lib/sessao-servidor";

export const instant = false;

export default async function PaginaDoAnalista() {
  const analista = await exigirUsuario("analista");

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between gap-4">
        <MarcaNexoAssist />
        <div className="w-64">
          <CartaoDoUsuario usuario={analista} />
        </div>
      </header>

      <section className="space-y-2 rounded-2xl border border-borda bg-papel p-8">
        <h1 className="font-serif text-2xl">Console do analista</h1>
        <p className="text-sm text-tinta-media">
          A lista de conversas e o painel de chamados entram aqui na Etapa 8.
        </p>
      </section>
    </main>
  );
}
