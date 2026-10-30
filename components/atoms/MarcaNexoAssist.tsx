type Props = {
  tom?: "claro" | "escuro";
};

export function MarcaNexoAssist({ tom = "escuro" }: Props) {
  const cor = tom === "claro" ? "text-white" : "text-tinta";

  return (
    <span className={`inline-flex items-center gap-2 ${cor}`}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6 text-azul"
        fill="currentColor"
      >
        <path d="M4 20V4l9 8.2V4h3.5v16l-9-8.2V20H4Z" />
        <circle cx="19" cy="6" r="2.4" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">
        Nexo Assist
      </span>
    </span>
  );
}
