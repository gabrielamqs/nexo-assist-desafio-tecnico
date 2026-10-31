export function BolhaDoFuncionario({ texto }: { texto: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-xl rounded-2xl rounded-br-sm bg-superficie-escura px-4 py-2.5 text-sm whitespace-pre-line text-tinta-invertida">
        {texto}
      </p>
    </div>
  );
}
