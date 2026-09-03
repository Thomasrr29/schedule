"use client";

import { useEffect, useRef, useState } from "react";
import { copy } from "@/lib/copy";
import { TiltCard } from "@/components/ui/TiltCard";
import type { Dia } from "@/lib/generated/prisma/enums";

/** Una franja: un rato en que el otro esta en una sede y vos tambien. La
 *  misma persona puede tener varias el mismo dia, en sedes distintas. */
export type Franja = {
  sede: string;
  /** De cuando a cuando esta el, con las horas reales de sus bloques. */
  desde: string;
  hasta: string;
  /** El rato aprovechable: si hay tramo libre es ese, si no el solape pelado. */
  coincide: { inicio: string; fin: string };
  tipo: "largo" | "corto";
};

/** Lo que pinta la tarjeta, ya aplanado. El server component no puede pasar el
 *  objeto de Prisma tal cual: al cruzar al cliente solo viajan datos. */
export type TarjetaAmigo = {
  amigoId: string;
  amigo: string;
  /** La mejor de sus franjas, que es la que decide el color de la tarjeta. */
  tipo: "largo" | "corto";
  franjas: Franja[];
};

// Menos que esto es un toque mal dado, no un swipe.
const UMBRAL = 48;

export function SemanaPorDia({
  dias,
  filas,
  hoy,
}: {
  dias: readonly Dia[];
  filas: Record<string, TarjetaAmigo[]>;
  hoy: Dia | null;
}) {
  // Abre en hoy, que es la pregunta del 90% de las veces. Si hoy es domingo
  // no hay pestaña que abrir y arranca el lunes.
  const [i, setI] = useState(() => {
    const n = hoy ? dias.indexOf(hoy) : -1;
    return n >= 0 ? n : 0;
  });
  const [dx, setDx] = useState(0);
  const gesto = useRef<{ x: number; y: number; eje: "?" | "x" | "y" } | null>(null);

  const irA = (n: number) => setI(Math.min(dias.length - 1, Math.max(0, n)));

  // Flechas del teclado, para el que lo abra en el computador. El estado se
  // actualiza en funcion del anterior y no de `i`: asi el listener se registra
  // una sola vez en vez de volver a montarse con cada cambio de dia.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((n) => Math.min(dias.length - 1, n + 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [dias.length]);

  function alEmpezar(e: React.TouchEvent) {
    const t = e.touches[0];
    gesto.current = { x: t.clientX, y: t.clientY, eje: "?" };
  }

  function alMover(e: React.TouchEvent) {
    const g = gesto.current;
    if (!g) return;
    const t = e.touches[0];
    const ax = t.clientX - g.x;
    const ay = t.clientY - g.y;

    // Hasta no saber si el dedo va horizontal o vertical no se mueve nada: si
    // no, bajar la lista con el pulgar arrastraría el día de lado.
    if (g.eje === "?") {
      if (Math.abs(ax) < 10 && Math.abs(ay) < 10) return;
      g.eje = Math.abs(ax) > Math.abs(ay) ? "x" : "y";
    }
    if (g.eje !== "x") return;

    // En los extremos el arrastre pesa: se siente el tope sin trancarse.
    const tope = (ax > 0 && i === 0) || (ax < 0 && i === dias.length - 1);
    setDx(tope ? ax / 4 : ax);
  }

  function alSoltar() {
    const g = gesto.current;
    gesto.current = null;
    if (g?.eje === "x" && Math.abs(dx) > UMBRAL) irA(dx < 0 ? i + 1 : i - 1);
    setDx(0);
  }

  const dia = dias[i];
  const delDia = filas[dia] ?? [];

  return (
    <section className="space-y-3">
      <div className="flex gap-1">
        {dias.map((d, n) => (
          <button
            key={d}
            onClick={() => setI(n)}
            aria-current={n === i ? "true" : undefined}
            className={`flex-1 rounded-full border-2 border-ink py-1.5 text-xs font-display font-semibold transition-colors ${
              n === i ? "bg-ink text-cream" : "bg-transparent"
            }`}
          >
            {copy.diasCorto[d]}
          </button>
        ))}
      </div>

      <div
        onTouchStart={alEmpezar}
        onTouchMove={alMover}
        onTouchEnd={alSoltar}
        className="touch-pan-y select-none"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => irA(i - 1)}
            disabled={i === 0}
            aria-label="Día anterior"
            className="px-2 text-lg disabled:opacity-25"
          >
            ‹
          </button>
          <h3 className="font-display text-lg font-semibold">
            {copy.dias[dia]}
            {dia === hoy && <span className="text-muted"> · hoy</span>}
          </h3>
          <button
            onClick={() => irA(i + 1)}
            disabled={i === dias.length - 1}
            aria-label="Día siguiente"
            className="px-2 text-lg disabled:opacity-25"
          >
            ›
          </button>
        </div>

        <div
          key={dia}
          className="mt-2 animate-[entra_.18s_ease-out] space-y-2"
          style={{
            transform: `translateX(${dx}px)`,
            transition: dx === 0 ? "transform .2s ease-out" : "none",
          }}
        >
          {delDia.length === 0 ? (
            <TiltCard tipo="vacio" indice={0}>
              <p className="font-display font-semibold">{copy.semana.sinNadaDia}</p>
            </TiltCard>
          ) : (
            delDia.map((t, n) => (
              <TiltCard key={t.amigoId} tipo={t.tipo} indice={n}>
                <p className="font-display font-semibold">{t.amigo}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {t.franjas.map((fr) => (
                    <li key={`${fr.sede}-${fr.desde}`} className="text-sm">
                      {copy.semana.franja(fr.desde, fr.hasta, fr.sede)}
                      <span className="block text-xs text-ink/60">
                        {copy.semana.coinciden(fr.coincide.inicio, fr.coincide.fin)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm font-semibold">
                  {t.tipo === "largo" ? copy.semana.cierreLargo : copy.semana.cierreCorto}
                </p>
              </TiltCard>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
