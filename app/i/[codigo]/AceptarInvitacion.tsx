"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/copy";
import { TiltCard } from "@/components/ui/TiltCard";

export function AceptarInvitacion({
  codigo,
  nombre,
  bienvenida = false,
}: {
  codigo: string;
  nombre: string;
  bienvenida?: boolean;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function aceptar() {
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/invitacion/aceptar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const data = await r.json();
      if (data.estado === "listo" || data.estado === "ya_eran") {
        // Recién creada la cuenta la amistad ya existe, pero todavía no hay
        // horario que cruzar: el arranque sigue donde iba.
        router.push(bienvenida ? "/schedule/upload?bienvenida=1" : "/friends");
        router.refresh();
        return;
      }
      setError(data.estado === "no_existe" ? copy.invitacion.noExiste : copy.errores.servidor);
    } catch {
      setError(copy.errores.red);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <TiltCard tipo="largo" indice={0}>
        <p className="font-display text-2xl font-semibold">{copy.invitacion.invita(nombre)}</p>
        <p className="mt-1 text-sm">{copy.invitacion.explica}</p>
      </TiltCard>

      {error && <p className="text-sm font-semibold">{error}</p>}

      <button
        onClick={aceptar}
        disabled={enviando}
        className="h-14 w-full rounded-full border-2 border-ink bg-ink font-display text-lg font-semibold text-cream disabled:opacity-60"
      >
        {copy.invitacion.aceptar}
      </button>
    </>
  );
}
