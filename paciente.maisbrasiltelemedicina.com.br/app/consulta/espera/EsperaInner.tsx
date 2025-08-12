"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function EsperaConsulta() {
  const params = useSearchParams();
  const router = useRouter();

  const beneficiaryUuid = params.get("beneficiaryUuid");
  const specialtyUuid   = params.get("specialtyUuid");

  // estados de controle
  const [tentativa, setTentativa] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!beneficiaryUuid || !specialtyUuid) {
      setErro("Parâmetros ausentes.");
      return;
    }

    const intervalId = setInterval(async () => {
      setTentativa((t) => t + 1);

      const resp = await fetch("/api/telemedicina/consulta-imediata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaryUuid, specialtyUuid }),
      });

      const txt = await resp.text();
      let data: any;
      try { data = JSON.parse(txt); } catch { data = { message: txt }; }

      if (!resp.ok) {
        setErro(data.message || "Erro inesperado.");
        clearInterval(intervalId);
        return;
      }

      if (data.url) {
        window.location.href = data.url;   // redireciona para a WebView
        clearInterval(intervalId);
        return;
      }

      if (!data.pending) {
        // algo diferente de { pending: true }
        setErro(data.message || "Resposta inesperada.");
        clearInterval(intervalId);
      }

      if (tentativa >= 11) {  // 12 tentativas (≈1 min)
        setErro("Tempo de espera excedido. Tente novamente.");
        clearInterval(intervalId);
      }
    }, 5000); // 5 s

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativa]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      {!erro ? (
        <>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mb-6" />
          <h1 className="text-xl font-semibold mb-2 text-green-700">
            Encontrando médico disponível…
          </h1>
          <p className="text-gray-500 text-sm">
            Tentativa {tentativa + 1}/12. Esta página atualizará automaticamente.
          </p>
        </>
      ) : (
        <div className="text-center">
          <h1 className="text-red-600 text-xl font-semibold mb-2">Ops!</h1>
          <p className="text-gray-600 mb-4">{erro}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Voltar
          </button>
        </div>
      )}
    </div>
  );
}
