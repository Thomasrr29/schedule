import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TERM_ACTUAL } from "@/lib/config";
import { coincidenciasDe } from "@/lib/coincidencias";
import { ahoraEnBogota, aMinutos } from "@/lib/time";
import { copy } from "@/lib/copy";
import { TiltCard } from "@/components/ui/TiltCard";
import { BottomNav } from "@/components/ui/BottomNav";
import { SemanaPorDia, type TarjetaAmigo } from "@/components/SemanaPorDia";

const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab"] as const;

export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");

  const [misBloques, porAmigo] = await Promise.all([
    prisma.timeBlock.count({ where: { schedule: { userId: user.id, termLabel: TERM_ACTUAL } } }),
    coincidenciasDe(user.id),
  ]);

  // Una fila por encuentro, no por amigo: la pregunta es "¿qué día me sirve?",
  // y agrupada por amigo esa respuesta hay que armarla en la cabeza.
  const filas = porAmigo.flatMap(({ amigo, coincidencias }) =>
    coincidencias.map((c) => ({ amigo, ...c })),
  );

  // El cliente recibe datos planos, no el objeto de Prisma: solo lo que la
  // tarjeta pinta. Todos los dias van, incluso los vacios — la pregunta
  // "¿quien cae el jueves?" tiene respuesta aunque sea "nadie".
  //
  // Y una tarjeta por persona, no por encuentro: si Juanchito cae en la mañana
  // en Fraternidad y en la noche en Robledo, sueltas parecen dos personas.
  const porDia: Record<string, TarjetaAmigo[]> = Object.fromEntries(
    DIAS.map((d) => {
      const tarjetas = new Map<string, TarjetaAmigo>();

      for (const f of filas.filter((x) => x.dia === d)) {
        const franja = {
          sede: f.sede.nombre,
          desde: f.amigoEnSede.inicio,
          hasta: f.amigoEnSede.fin,
          // El tramo libre es el rato de verdad aprovechable; cuando no hay,
          // el solape pelado es lo unico que se puede ofrecer.
          coincide:
            f.tipo === "largo" && f.tramoLibre
              ? { inicio: f.tramoLibre.inicio, fin: f.tramoLibre.fin }
              : { inicio: f.inicio, fin: f.fin },
          tipo: f.tipo,
        };

        const ya = tarjetas.get(f.amigo.id);
        if (ya) {
          ya.franjas.push(franja);
          // Basta una franja larga para que la tarjeta entera valga la pena.
          if (f.tipo === "largo") ya.tipo = "largo";
        } else {
          tarjetas.set(f.amigo.id, {
            amigoId: f.amigo.id,
            amigo: f.amigo.name,
            tipo: f.tipo,
            franjas: [franja],
          });
        }
      }

      for (const t of tarjetas.values()) {
        t.franjas.sort((a, b) => a.desde.localeCompare(b.desde));
      }
      return [d, [...tarjetas.values()]];
    }),
  );

  const { dia: hoy, minutos } = ahoraEnBogota();
  const ahora = filas.filter(
    (f) => f.dia === hoy && aMinutos(f.inicio) <= minutos && minutos < aMinutos(f.fin),
  );

  return (
    <>
      <main className="mx-auto max-w-md space-y-5 p-6 pb-28">
        <h1 className="font-display text-3xl font-semibold">¿Qué más, {user.name}?</h1>

        {misBloques === 0 ? (
          <Link href="/schedule/mine" className="block">
            <TiltCard tipo="largo" indice={0}>
              <p className="font-display text-xl font-semibold">{copy.semana.sinHorario}</p>
              <p className="mt-1 text-sm">{copy.semana.sinHorarioSub}</p>
            </TiltCard>
          </Link>
        ) : porAmigo.length === 0 ? (
          <p className="text-sm text-muted">{copy.semana.sinAmigos}</p>
        ) : filas.length === 0 ? (
          <p className="text-sm text-muted">{copy.semana.sinNada}</p>
        ) : (
          <>
            {ahora.length > 0 && (
              <section className="space-y-2">
                <h2 className="font-display text-lg font-semibold">{copy.semana.ahora}</h2>
                {ahora.map((f, i) => (
                  <TiltCard key={`${f.amigo.id}-${f.inicio}`} tipo="largo" indice={i}>
                    <p className="font-display text-xl font-semibold">
                      {f.amigo.name} está en {f.sede.nombre}
                    </p>
                    <p className="mt-1 text-sm">Hasta las {f.fin}</p>
                  </TiltCard>
                ))}
              </section>
            )}

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold">{copy.semana.titulo}</h2>
              <SemanaPorDia dias={DIAS} filas={porDia} hoy={hoy} />
            </section>
          </>
        )}

        <form action="/api/auth/logout" method="post">
          <button className="text-sm underline" type="submit">Salir</button>
        </form>
      </main>
      <BottomNav />
    </>
  );
}
