const CONTAS = [
  { papel: "Funcionária", email: "ana.souza@nexo.com.br" },
  { papel: "Analista", email: "rafael.lima@nexo.com.br" },
] as const;

export function ContasDeDemonstracao() {
  return (
    <section
      aria-label="Contas de demonstração"
      className="rounded-lg border border-borda bg-superficie-baixa p-4 text-xs"
    >
      <h3 className="font-medium text-tinta-media">Contas de demonstração</h3>

      <dl className="mt-2 space-y-1">
        {CONTAS.map(({ papel, email }) => (
          <div
            key={email}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="text-tinta-fraca">{papel}</dt>
            <dd className="text-tinta-media">{email}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-2 text-tinta-fraca">
        Qualquer senha é aceita, como o desafio pede.
      </p>
    </section>
  );
}
