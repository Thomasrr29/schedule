import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TERM_ACTUAL } from "@/lib/config";
import { TiltCard } from "@/components/ui/TiltCard";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");

  const bloques = await prisma.timeBlock.count({
    where: { schedule: { userId: user.id, termLabel: TERM_ACTUAL } },
  });

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="font-display text-3xl font-semibold">¿Qué más, {user.name}?</h1>

      {/* Placeholder: acá van las coincidencias reales en la fase 3. */}
      {bloques === 0 ? (
        <Link href="/schedule/mine" className="block">
          <TiltCard tipo="largo" indice={0}>
            <p className="font-display text-xl font-semibold">Cargá tu horario</p>
            <p className="mt-1 text-sm">Sin él no hay con quién cruzarte</p>
          </TiltCard>
        </Link>
      ) : (
        <Link href="/schedule/mine" className="block">
          <TiltCard tipo="vacio" indice={0}>
            <p className="font-display text-lg font-semibold">
              Tenés {bloques} {bloques === 1 ? "bloque" : "bloques"} cargados
            </p>
            <p className="mt-1 text-sm">Faltan los parceros</p>
          </TiltCard>
        </Link>
      )}

      <form action="/api/auth/logout" method="post">
        <button className="text-sm underline" type="submit">Salir</button>
      </form>
    </main>
  );
}
