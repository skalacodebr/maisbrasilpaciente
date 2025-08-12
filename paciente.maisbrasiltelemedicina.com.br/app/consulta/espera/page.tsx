// app/consulta/espera/page.tsx
import { Suspense } from "react";
import EsperaInner from "./EsperaInner";

export default function EsperaWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando consulta...</div>}>
      <EsperaInner />
    </Suspense>
  );
}
