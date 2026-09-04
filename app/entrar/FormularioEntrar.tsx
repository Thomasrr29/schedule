"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinInput } from "@/components/ui/PinInput";
import { EncabezadoPaso } from "@/components/ui/EncabezadoPaso";
import { copy } from "@/lib/copy";

/**
 * Un dato por pantalla. Antes el carnet, el PIN y a veces el nombre caian todos
 * juntos en el mismo formulario: tres cosas que explicar al tiempo y ninguna
 * explicada. Partido, cada paso puede decir para que sirve lo que pide.
 *
 * El servidor sigue recibiendo todo de un golpe — no hay estado de registro a
 * medias en la base, solo en este componente.
 */
type Paso = "carnet" | "pin" | "nombre";

export function FormularioEntrar({ destino }: { destino: string }) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("carnet");
  const [carnet, setCarnet] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ir = (p: Paso) => {
    setError(null);
    setPaso(p);
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (paso === "carnet") {
      if (!/^\d{4,15}$/.test(carnet)) return setError(copy.entrar.carnetMalo);
      return ir("pin");
    }
    if (pin.length !== 4) return setError(copy.entrar.pinCorto);
    if (paso === "nombre" && !name.trim()) return setError(copy.entrar.nombreVacio);

    setEnviando(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carnet, pin, name: paso === "nombre" ? name : undefined }),
      });
      const data = await res.json();

      // Carnet que nadie ha usado: recien acá sabemos que hay que crear cuenta.
      // Preguntarlo antes obligaría a consultar si el carnet existe, y eso deja
      // averiguar quién está registrado con solo probar números.
      if (data.needsName) return ir("nombre");
      if (data.ok) {
        // Cuenta nueva: sigue el arranque. Si ya existía, va a lo suyo.
        router.push(paso === "nombre" ? "/schedule/upload?bienvenida=1" : destino);
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

  const encabezado = {
    carnet: { paso: 1, titulo: copy.entrar.pasoCarnet, porque: copy.entrar.pasoCarnetPorque },
    pin: { paso: 2, titulo: copy.entrar.pasoPin, porque: copy.entrar.pasoPinPorque },
    nombre: { paso: 2, titulo: copy.entrar.pasoNombre, porque: copy.entrar.pasoNombrePorque },
  }[paso];

  const boton = { carnet: copy.entrar.seguir, pin: copy.entrar.accion, nombre: copy.entrar.crear }[paso];
  const campo =
    "h-14 w-full rounded-2xl border-2 border-ink bg-cream px-4 font-display text-xl outline-none focus:bg-yellow disabled:opacity-60";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <EncabezadoPaso arte="astronauta" {...encabezado} />

      <form onSubmit={enviar} className="space-y-5">
        {paso === "carnet" && (
          <input
            autoFocus
            inputMode="numeric"
            aria-label={copy.entrar.carnet}
            value={carnet}
            onChange={(e) => setCarnet(e.target.value.replace(/\D/g, "").slice(0, 15))}
            className={campo}
          />
        )}

        {paso === "pin" && (
          <div className="space-y-2">
            <PinInput value={pin} onChange={setPin} disabled={enviando} />
            <p className="text-xs text-muted">{copy.entrar.carnet}: {carnet}</p>
          </div>
        )}

        {paso === "nombre" && (
          <input
            autoFocus
            aria-label={copy.entrar.nombre}
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            className={campo}
          />
        )}

        {error && <p className="text-sm font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="h-14 w-full rounded-full border-2 border-ink bg-ink font-display text-lg font-semibold text-cream disabled:opacity-60"
        >
          {boton}
        </button>

        {paso !== "carnet" && (
          <button
            type="button"
            onClick={() => ir(paso === "nombre" ? "pin" : "carnet")}
            disabled={enviando}
            className="mx-auto block text-sm underline disabled:opacity-60"
          >
            {copy.entrar.atras}
          </button>
        )}
      </form>
    </main>
  );
}
