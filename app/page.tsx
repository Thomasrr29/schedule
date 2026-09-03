import { TiltCard } from "@/components/ui/TiltCard";

// Placeholder: prueba los tokens de diseño. Se reemplaza con el dashboard real
// cuando existan /api/matches y la sesion.
export default function Home() {
  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="font-display text-3xl font-semibold">¿Qué más?</h1>
      <p className="text-sm text-muted">Andamiaje listo. Faltan las pantallas.</p>

      <TiltCard tipo="largo" indice={0}>
        <p className="font-display text-xl font-semibold">
          Tenés 2 horas con Camila, parchen pues
        </p>
        <p className="mt-1 text-sm">Hoy 11:00 — 13:00 · Robledo</p>
      </TiltCard>

      <TiltCard tipo="corto" indice={1}>
        <p className="font-display text-lg font-semibold">Salen juntos a las 10:00</p>
        <p className="mt-1 text-sm">Robledo</p>
      </TiltCard>

      <TiltCard tipo="vacio" indice={2}>
        <p className="font-display text-lg font-semibold">Julián no cayó hoy</p>
      </TiltCard>
    </main>
  );
}
