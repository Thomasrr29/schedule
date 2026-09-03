"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/copy";
import type { Dia, Sede, TipoBloque } from "@/lib/generated/prisma/enums";

export type Bloque = {
  id: string;
  titulo: string;
  dia: Dia;
  horaInicio: string;
  horaFin: string;
  sede: Sede;
  tipo: TipoBloque;
};

const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab"] as const;
const VACIO = {
  titulo: "", dia: "lun" as Dia, horaInicio: "08:00", horaFin: "10:00",
  sede: "ROBLEDO" as Sede, tipo: "OCUPADO" as TipoBloque,
};

// Un color por día para que la lista se lea como calendario y no como tabla.
const COLOR_DIA: Record<Dia, string> = {
  lun: "bg-yellow", mar: "bg-mint", mie: "bg-lavender",
  jue: "bg-yellow", vie: "bg-mint", sab: "bg-lavender",
};

export function EditorHorario({ bloques }: { bloques: Bloque[] }) {
  const router = useRouter();
  const [form, setForm] = useState<typeof VACIO>(VACIO);
  const [editando, setEditando] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => { setAbierto(false); setEditando(null); setForm(VACIO); setError(null); };

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const r = await fetch(editando ? `/api/blocks/${editando}` : "/api/blocks", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) return setError((await r.json()).error ?? copy.errores.servidor);
      cerrar();
      // Los bloques vienen del servidor: le pedimos a Next que rehaga la
      // pagina en vez de mantener una copia en estado del cliente.
      router.refresh();
    } catch {
      setError(copy.errores.red);
    } finally {
      setEnviando(false);
    }
  }

  async function borrar(id: string) {
    setEnviando(true);
    await fetch(`/api/blocks/${id}`, { method: "DELETE" });
    cerrar();
    router.refresh();
    setEnviando(false);
  }

  const editar = (b: Bloque) => {
    setForm({ titulo: b.titulo, dia: b.dia, horaInicio: b.horaInicio, horaFin: b.horaFin, sede: b.sede, tipo: b.tipo });
    setEditando(b.id);
    setAbierto(true);
  };

  const campo = "h-12 w-full rounded-xl border-2 border-ink bg-cream px-3 outline-none focus:bg-yellow";

  return (
    <main className="mx-auto max-w-md space-y-5 p-6 pb-28">
      <h1 className="font-display text-3xl font-semibold">{copy.horario.titulo}</h1>

      {bloques.length === 0 ? (
        <p className="text-sm text-muted">{copy.horario.vacioManual}</p>
      ) : (
        DIAS.filter((d) => bloques.some((b) => b.dia === d)).map((dia) => (
          <section key={dia} className="space-y-2">
            <h2 className="font-display text-lg font-semibold">{copy.dias[dia]}</h2>
            {bloques.filter((b) => b.dia === dia).map((b) => (
              <button
                key={b.id}
                onClick={() => editar(b)}
                className={`${COLOR_DIA[dia]} block w-full rounded-2xl border-2 border-ink p-3 text-left`}
              >
                <p className="font-display font-semibold">{b.titulo}</p>
                <p className="text-sm">
                  {b.horaInicio}–{b.horaFin} · {copy.sedes[b.sede]}
                  {b.tipo === "DISPONIBLE" && " · libre"}
                </p>
              </button>
            ))}
          </section>
        ))
      )}

      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          className="h-14 w-full rounded-full border-2 border-ink bg-ink font-display font-semibold text-cream"
        >
          {copy.horario.añadir}
        </button>
      )}

      {abierto && (
        <form onSubmit={guardar} className="space-y-3 rounded-2xl border-2 border-ink bg-cream p-4">
          <input
            autoFocus
            placeholder="Cálculo III, bachata, estudiar…"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className={campo}
          />

          <select value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value as Dia })} className={campo}>
            {DIAS.map((d) => <option key={d} value={d}>{copy.dias[d]}</option>)}
          </select>

          <div className="flex gap-3">
            <input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} className={campo} />
            <input type="time" value={form.horaFin} onChange={(e) => setForm({ ...form, horaFin: e.target.value })} className={campo} />
          </div>

          <select
            value={form.sede}
            onChange={(e) => setForm({ ...form, sede: e.target.value as Sede })}
            aria-label={copy.horario.sede}
            className={campo}
          >
            <option value="ROBLEDO">Robledo</option>
            <option value="FRATERNIDAD">Fraternidad</option>
          </select>

          {/* En lenguaje llano: "ocupado / disponible" no le dice nada a nadie. */}
          <div className="flex gap-2">
            {(["OCUPADO", "DISPONIBLE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, tipo: t })}
                className={`flex-1 rounded-full border-2 border-ink p-2 text-sm ${form.tipo === t ? "bg-ink text-cream" : "bg-cream"}`}
              >
                {t === "OCUPADO" ? copy.horario.ocupado : copy.horario.disponible}
              </button>
            ))}
          </div>

          {error && <p className="text-sm font-semibold">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={enviando} className="h-12 flex-1 rounded-full border-2 border-ink bg-yellow font-display font-semibold disabled:opacity-60">
              Guardar
            </button>
            <button type="button" onClick={cerrar} className="h-12 rounded-full border-2 border-ink px-4 text-sm">
              {copy.horario.cancelar}
            </button>
            {editando && (
              <button type="button" onClick={() => borrar(editando)} disabled={enviando} className="h-12 rounded-full border-2 border-ink px-4 text-sm disabled:opacity-60">
                {copy.horario.borrar}
              </button>
            )}
          </div>
        </form>
      )}
    </main>
  );
}
