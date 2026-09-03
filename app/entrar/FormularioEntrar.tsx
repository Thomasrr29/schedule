"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinInput } from "@/components/ui/PinInput";
import { copy } from "@/lib/copy";

export function FormularioEntrar({ destino }: { destino: string }) {
  const router = useRouter();
  const [carnet, setCarnet] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [pideNombre, setPideNombre] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{4,15}$/.test(carnet)) return setError(copy.entrar.carnetMalo);
    if (pin.length !== 4) return setError(copy.entrar.pinCorto);
    if (pideNombre && !name.trim()) return setError(copy.entrar.nombreVacio);

    setEnviando(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carnet, pin, name: pideNombre ? name : undefined }),
      });
      const data = await res.json();

      if (data.needsName) return setPideNombre(true);
      if (data.ok) {
        router.push(destino);
        router.refresh();
        return;
      }
      if (res.status === 429) return setError(copy.entrar.bloqueado);
      if (res.status === 401) return setError(copy.entrar.pinMalo(data.intentosRestantes));
      setError(copy.errores.servidor);
    } catch {
      setError(copy.errores.red);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="font-display text-4xl font-semibold">{copy.entrar.titulo}</h1>

      <form onSubmit={enviar} className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm">{copy.entrar.carnet}</span>
          <input
            inputMode="numeric"
            value={carnet}
            // El carnet ya se confirmo; cambiarlo despues dejaria el nombre
            // pegado a un carnet distinto al que se mostro.
            disabled={pideNombre || enviando}
            onChange={(e) => setCarnet(e.target.value.replace(/\D/g, "").slice(0, 15))}
            className="h-14 w-full rounded-2xl border-2 border-ink bg-cream px-4 font-display text-xl outline-none focus:bg-yellow disabled:opacity-60"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm">{copy.entrar.pin}</span>
          <PinInput value={pin} onChange={setPin} disabled={pideNombre || enviando} />
        </div>

        {pideNombre && (
          <div className="space-y-3 rounded-2xl border-2 border-ink bg-lavender p-4">
            <p className="font-display text-lg font-semibold">{copy.entrar.nuevo(carnet)}</p>
            <label className="block space-y-2">
              <span className="text-sm">{copy.entrar.nombre}</span>
              <input
                autoFocus
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                className="h-14 w-full rounded-2xl border-2 border-ink bg-cream px-4 font-display text-xl outline-none"
              />
            </label>
          </div>
        )}

        {error && <p className="text-sm font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="h-14 w-full rounded-full border-2 border-ink bg-ink font-display text-lg font-semibold text-cream disabled:opacity-60"
        >
          {pideNombre ? "Crear cuenta" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
