"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/copy";
import type { SedeRef } from "@/lib/aula";
import type { Dia } from "@/lib/generated/prisma/enums";

const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab"] as const;

type Editable = {
  titulo: string;
  dia: Dia;
  horaInicio: string;
  horaFin: string;
  sedeId: string;
  aula: string;
};

type Etapa = "elegir" | "leyendo" | "revisando" | "guardando";

export function SubirHorario({ sedes }: { sedes: SedeRef[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [etapa, setEtapa] = useState<Etapa>("elegir");
  const [bloques, setBloques] = useState<Editable[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function subir(archivo: File) {
    setError(null);
    setEtapa("leyendo");
    try {
      const form = new FormData();
      form.append("imagen", archivo);
      const r = await fetch("/api/schedules/extract", { method: "POST", body: form });
      const data = await r.json();

      if (!r.ok) {
        setError(data.error ?? copy.errores.servidor);
        return setEtapa("elegir");
      }
      if (data.bloques.length === 0) {
        setError(copy.horario.ilegible);
        return setEtapa("elegir");
      }

      setBloques(
        data.bloques.map((b: { titulo: string; dia: Dia; horaInicio: string; horaFin: string; aula: string | null; sede: SedeRef | null }) => ({
          titulo: b.titulo,
          dia: b.dia,
          horaInicio: b.horaInicio,
          horaFin: b.horaFin,
          // Si la IA no reconoció la sede queda vacía a propósito: el dropdown
          // la exige antes de guardar. Adivinarla saldría más caro.
          sedeId: b.sede?.id ?? "",
          aula: b.aula ?? "",
        })),
      );
      setEtapa("revisando");
    } catch {
      setError(copy.errores.red);
      setEtapa("elegir");
    }
  }

  async function guardar() {
    setError(null);
    setEtapa("guardando");
    try {
      const r = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloques: bloques.map((b) => ({ ...b, tipo: "OCUPADO" })) }),
      });
      if (!r.ok) {
        setError((await r.json()).error ?? copy.errores.servidor);
        return setEtapa("revisando");
      }
      router.push("/schedule/mine");
      router.refresh();
    } catch {
      setError(copy.errores.red);
      setEtapa("revisando");
    }
  }

  const cambiar = (i: number, campo: keyof Editable, valor: string) =>
    setBloques((bs) => bs.map((b, n) => (n === i ? { ...b, [campo]: valor } : b)));

  const sinSede = bloques.filter((b) => !b.sedeId).length;
  const campo = "h-11 w-full rounded-xl border-2 border-ink bg-cream px-2 text-sm outline-none focus:bg-yellow";

  return (
    <main className="mx-auto max-w-md space-y-4 p-6 pb-28">
      <h1 className="font-display text-3xl font-semibold">
        {etapa === "revisando" || etapa === "guardando"
          ? copy.horario.confirmar
          : copy.horario.vacio}
      </h1>

      {error && <p className="text-sm font-semibold">{error}</p>}

      {(etapa === "elegir" || etapa === "leyendo") && (
        <>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subir(f);
              e.target.value = ""; // permite reintentar con la misma foto
            }}
          />
          <button
            onClick={() => input.current?.click()}
            disabled={etapa === "leyendo"}
            className="h-14 w-full rounded-full border-2 border-ink bg-ink font-display font-semibold text-cream disabled:opacity-60"
          >
            {etapa === "leyendo" ? copy.horario.descifrando : copy.horario.elegirFoto}
          </button>
        </>
      )}

      {(etapa === "revisando" || etapa === "guardando") && (
        <>
          <p className="text-sm text-muted">{copy.horario.conservaManuales}</p>

          {bloques.map((b, i) => (
            <div
              key={i}
              className={`space-y-2 rounded-2xl border-2 border-ink p-3 ${b.sedeId ? "bg-mint" : "bg-yellow"}`}
            >
              <input
                value={b.titulo}
                onChange={(e) => cambiar(i, "titulo", e.target.value)}
                className={`${campo} font-display font-semibold`}
              />
              <div className="flex gap-2">
                <select value={b.dia} onChange={(e) => cambiar(i, "dia", e.target.value)} className={campo}>
                  {DIAS.map((d) => <option key={d} value={d}>{copy.dias[d]}</option>)}
                </select>
                <input type="time" value={b.horaInicio} onChange={(e) => cambiar(i, "horaInicio", e.target.value)} className={campo} />
                <input type="time" value={b.horaFin} onChange={(e) => cambiar(i, "horaFin", e.target.value)} className={campo} />
              </div>
              <div className="flex gap-2">
                <select
                  value={b.sedeId}
                  onChange={(e) => cambiar(i, "sedeId", e.target.value)}
                  aria-label={copy.horario.sede}
                  className={campo}
                >
                  <option value="" disabled>{copy.horario.sede}</option>
                  {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <input
                  value={b.aula}
                  placeholder="Aula"
                  onChange={(e) => cambiar(i, "aula", e.target.value)}
                  className={campo}
                />
                <button
                  onClick={() => setBloques((bs) => bs.filter((_, n) => n !== i))}
                  aria-label="Quitar bloque"
                  className="h-11 shrink-0 rounded-xl border-2 border-ink px-3 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {sinSede > 0 && <p className="text-sm font-semibold">{copy.horario.faltanSedes(sinSede)}</p>}

          <button
            onClick={guardar}
            disabled={sinSede > 0 || bloques.length === 0 || etapa === "guardando"}
            className="h-14 w-full rounded-full border-2 border-ink bg-ink font-display font-semibold text-cream disabled:opacity-50"
          >
            {copy.horario.guardarHorario}
          </button>
        </>
      )}
    </main>
  );
}
