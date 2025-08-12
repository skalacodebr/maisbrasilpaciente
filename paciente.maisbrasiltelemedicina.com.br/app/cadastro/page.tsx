import { Suspense } from "react";
import Cadastro from "./CadastroInner";

export default function CadastroWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
      <Cadastro />
    </Suspense>
  );
}
