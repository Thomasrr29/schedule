import { copy } from "@/lib/copy";
import type { Dia, TipoBloque } from "@/lib/generated/prisma/enums";

/** Lo que hace falta para pintar un bloque. Es un subconjunto del modelo de
 *  Prisma, ya plano, para que el horario de un parcero cruce al cliente. */
export type BloqueVista = {
  id: string;
  titulo: string;
  dia: Dia;
  horaInicio: string;
  horaFin: string;
  sedeNombre: string;
  aula: string | null;
  tipo: TipoBloque;
};

export const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab"] as const;

// Un color por día para que la lista se lea como calendario y no como tabla.
// Vive acá y no en el editor porque el horario de un parcero se pinta con la
// misma paleta: dos mapas iguales en dos archivos se desincronizan solos.
export const COLOR_DIA: Record<Dia, string> = {
  lun: "bg-yellow", mar: "bg-mint", mie: "bg-lavender",
  jue: "bg-yellow", vie: "bg-mint", sab: "bg-lavender",
};

/** El horario en solo lectura: el mismo dibujo del editor, sin los botones. */
export function ListaHorario({ bloques }: { bloques: BloqueVista[] }) {
  return (
    <div className="space-y-5">
      {DIAS.filter((d) => bloques.some((b) => b.dia === d)).map((dia) => (
        <section key={dia} className="space-y-2">
          <h3 className="font-display text-lg font-semibold">{copy.dias[dia]}</h3>
          {bloques
            .filter((b) => b.dia === dia)
            .map((b) => (
              <div key={b.id} className={`${COLOR_DIA[dia]} rounded-2xl border-2 border-ink p-3`}>
                <p className="font-display font-semibold">{b.titulo}</p>
                <p className="text-sm">
                  {b.horaInicio}–{b.horaFin} · {b.aula ? `${b.aula} · ` : ""}{b.sedeNombre}
                  {b.tipo === "DISPONIBLE" && " · libre"}
                </p>
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
