import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { copy } from "@/lib/copy";
import { TiltCard } from "@/components/ui/TiltCard";
import { AceptarInvitacion } from "./AceptarInvitacion";

export default async function Invitacion({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  const { codigo } = await params;
  const { bienvenida } = await searchParams;
  const user = await getSessionUser();

  // Sin sesión, primero entra o se crea la cuenta y después vuelve acá.
  if (!user) redirect(`/entrar?volver=/i/${encodeURIComponent(codigo)}`);

  const inv = await prisma.invitacion.findUnique({
    where: { codigo },
    select: { emisor: { select: { id: true, name: true } } },
  });

  // El link no crea la amistad al abrirlo: primero se ve quién invita. Es
  // compartir tu horario, así que la decisión es explícita.
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
      {!inv ? (
        <TiltCard tipo="vacio" indice={0}>
          <p className="font-display text-lg font-semibold">{copy.invitacion.noExiste}</p>
        </TiltCard>
      ) : inv.emisor.id === user.id ? (
        <TiltCard tipo="estado" indice={0}>
          <p className="font-display text-lg font-semibold">{copy.invitacion.vosMismo}</p>
        </TiltCard>
      ) : (
        <AceptarInvitacion
          codigo={codigo}
          nombre={inv.emisor.name}
          bienvenida={bienvenida === "1"}
        />
      )}

      <Link href="/" className="text-center text-sm underline">
        Ir a mi semana
      </Link>
    </main>
  );
}
