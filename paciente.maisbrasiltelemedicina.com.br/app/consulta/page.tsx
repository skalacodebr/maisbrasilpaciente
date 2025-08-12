// app/consulta/page.tsx
import { Suspense } from "react";
import ConsultaInner from "./ConsultaInner";

export default function ConsultaWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando consulta...</div>}>
      <ConsultaInner />
    </Suspense>
  );
}
