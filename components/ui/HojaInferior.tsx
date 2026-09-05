"use client";

import { useEffect, type ReactNode } from "react";
import { copy } from "@/lib/copy";

/**
 * Panel que sube desde el borde inferior, como la ficha de un contacto en
 * WhatsApp o un perfil en Instagram. Es el gesto que la gente ya tiene en el
 * pulgar: se cierra tocando afuera, con Escape o con el botón — nunca toca
 * buscar una X en una esquina.
 *
 * El contenido hace scroll adentro del panel, no la página: un horario largo
 * se recorre sin perder de vista de quién es.
 */
export function HojaInferior({
  abierta,
  titulo,
  alCerrar,
  children,
}: {
  abierta: boolean;
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!abierta) return;
    // La página de atrás se queda quieta: si no, llegar al final de la lista
    // del panel sigue arrastrando lo que hay debajo.
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") alCerrar();
    };
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", tecla);
    };
  }, [abierta, alCerrar]);

  if (!abierta) return null;

  return (
    // z-20: por encima de la nav inferior, que es fija en z-10.
    <div className="fixed inset-0 z-20 flex items-end justify-center" role="presentation">
      <button
        aria-label={copy.ui.cerrar}
        onClick={alCerrar}
        className="absolute inset-0 animate-[oscurece_.2s_ease-out] bg-ink/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hoja-titulo"
        className="relative flex max-h-[85dvh] w-full max-w-md animate-[sube_.25s_ease-out] flex-col rounded-t-3xl border-2 border-b-0 border-ink bg-cream"
      >
        {/* La agarradera no arrastra (todavía): es la seña de que esto es un
            panel que se baja, no una pantalla nueva. */}
        <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-ink/25" />
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
          <h2 id="hoja-titulo" className="font-display text-2xl font-semibold">
            {titulo}
          </h2>
          <button
            autoFocus
            onClick={alCerrar}
            className="shrink-0 rounded-full border-2 border-ink px-3 py-1 text-xs"
          >
            {copy.ui.cerrar}
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
