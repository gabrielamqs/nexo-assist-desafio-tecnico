"use client";

import { useEffect, useRef } from "react";

export function RolarParaOFim({ gatilho }: { gatilho: string }) {
  const marca = useRef<HTMLDivElement>(null);

  useEffect(() => {
    marca.current?.scrollIntoView({ block: "end" });
  }, [gatilho]);

  return <div ref={marca} />;
}
