import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TERM_ACTUAL } from "@/lib/config";
import { coincidenciasDe } from "@/lib/coincidencias";
import { ahoraEnBogota, aMinutos, duracionHumana } from "@/lib/time";
import { copy } from "@/lib/copy";
import { TiltCard } from "@/components/ui/TiltCard";
import { BottomNav } from "@/components/ui/BottomNav";
import type { Dia } from "@/lib/generated/prisma/enums";

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

            <section className="space-y-4">
              <h2 className="font-display text-lg font-semibold">{copy.semana.titulo}</h2>
              {DIAS.filter((d) => filas.some((f) => f.dia === d)).map((dia) => (
                <div key={dia} className="space-y-2">
                  <h3 className="text-sm text-muted">
                    {copy.dias[dia]}
                    {dia === hoy && " · hoy"}
                  </h3>
                  {filas
                    .filter((f) => f.dia === dia)
                    .map((f, i) => (
                      <TiltCard
                        key={`${f.amigo.id}-${f.inicio}`}
                        tipo={f.tipo === "largo" ? "largo" : "corto"}
                        indice={i}
                      >
                        <p className="font-display font-semibold">
                          {f.tipo === "largo" && f.tramoLibre
                            ? copy.semana.largo(duracionHumana(f.tramoLibre.minutos), f.amigo.name)
                            : copy.semana.corto(f.amigo.name)}
                        </p>
                        <p className="mt-1 text-sm">
                          {f.tramoLibre
                            ? `${f.tramoLibre.inicio}–${f.tramoLibre.fin}`
                            : `${f.inicio}–${f.fin}`}{" "}
                          · {f.sede.nombre}
                        </p>
                      </TiltCard>
                    ))}
                </div>
              ))}
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
