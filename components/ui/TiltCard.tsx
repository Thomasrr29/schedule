import type { ReactNode } from "react";

const FONDOS = {
  largo: "bg-yellow", // alcanza para sentarse
  corto: "bg-mint", // cruce en la frontera de un bloque
  estado: "bg-lavender", // esta en la U pero no coincide con vos
  vacio: "bg-neutral-card text-muted border-dashed", // no cayo hoy
} as const;

// La rotacion alterna por posicion para que la pila no se lea como una tabla.
const GIROS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export function TiltCard({
  tipo,
  indice = 0,
  children,
}: {
  tipo: keyof typeof FONDOS;
  indice?: number;
  children: ReactNode;
}) {
  return (
    <div
      className={`${FONDOS[tipo]} ${GIROS[indice % GIROS.length]} rounded-2xl border-2 border-ink p-4 transition-transform hover:rotate-0`}
    >
      {children}
    </div>
  );
}
