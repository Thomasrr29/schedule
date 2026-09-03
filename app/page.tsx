import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { TiltCard } from "@/components/ui/TiltCard";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="font-display text-3xl font-semibold">¿Qué más, {user.name}?</h1>
      <p className="text-sm text-muted">
        Ya entraste. Falta cargar tu horario para ver con quién coincidís.
      </p>

      {/* Placeholder: se reemplaza con las coincidencias reales en la fase 3. */}
      <TiltCard tipo="vacio" indice={0}>
        <p className="font-display text-lg font-semibold">Todavía no tenés horario</p>
      </TiltCard>

      <form action="/api/auth/logout" method="post">
        <button className="text-sm underline" type="submit">Salir</button>
      </form>
    </main>
  );
}
