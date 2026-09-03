"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/copy";
import { TiltCard } from "@/components/ui/TiltCard";

type Amigo = { id: string; amigo: { id: string; name: string } };

export function Parceros({ link, amigos }: { link: string; amigos: Amigo[] }) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function compartir() {
    // En el celular esto abre WhatsApp directo, que es donde va a terminar
    // el link igual. En escritorio no existe y cae al portapapeles.
    if (navigator.share) {
      try {
        await navigator.share({ title: "¿Quién cayó?", text: "Mirá cuándo coincidimos en la U", url: link });
        return;
      } catch {
        // Canceló el diálogo: no es un error, seguimos al portapapeles.
      }
    }
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function regenerar() {
    if (!confirmando) return setConfirmando(true);
    setOcupado(true);
    await fetch("/api/invitacion", { method: "POST" });
    setConfirmando(false);
    setOcupado(false);
    router.refresh();
  }

  async function quitar(id: string) {
    setOcupado(true);
    await fetch(`/api/friendships/${id}`, { method: "DELETE" });
    setOcupado(false);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md space-y-5 p-6 pb-28">
      <h1 className="font-display text-3xl font-semibold">{copy.parceros.titulo}</h1>

      <TiltCard tipo="corto" indice={0}>
        <p className="font-display font-semibold">{copy.parceros.tuLink}</p>
        <p className="mt-1 break-all font-mono text-xs">{link}</p>
        <p className="mt-2 text-sm">{copy.parceros.explica}</p>
        <button
          onClick={compartir}
          className="mt-3 h-11 w-full rounded-full border-2 border-ink bg-ink font-display font-semibold text-cream"
        >
          {copiado ? copy.parceros.copiado : copy.parceros.copiar}
        </button>
      </TiltCard>

      <section className="space-y-2">
        {amigos.length === 0 ? (
          <p className="text-sm text-muted">{copy.parceros.vacio}</p>
        ) : (
          amigos.map((f, i) => (
            <div
              key={f.id}
              className={`flex items-center gap-3 rounded-2xl border-2 border-ink p-3 ${
                i % 2 === 0 ? "bg-mint" : "bg-lavender"
              }`}
            >
              <p className="flex-1 font-display font-semibold">{f.amigo.name}</p>
              <button
                onClick={() => quitar(f.id)}
                disabled={ocupado}
                className="rounded-full border-2 border-ink px-3 py-1 text-xs disabled:opacity-60"
              >
                {copy.parceros.quitar}
              </button>
            </div>
          ))
        )}
      </section>

      <div className="space-y-2 pt-2">
        <button
          onClick={regenerar}
          disabled={ocupado}
          className="text-sm underline disabled:opacity-60"
        >
          {confirmando ? copy.parceros.regenerarAviso : copy.parceros.regenerar}
        </button>
        {confirmando && (
          <button onClick={() => setConfirmando(false)} className="block text-sm underline">
            Mejor no
          </button>
        )}
      </div>
    </main>
  );
}
