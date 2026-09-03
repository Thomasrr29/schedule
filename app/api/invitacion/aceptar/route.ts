import { getSessionUser } from "@/lib/auth";
import { aceptarInvitacion } from "@/lib/invitaciones";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const codigo = typeof body?.codigo === "string" ? body.codigo.trim() : "";
  if (!codigo) return Response.json({ error: "Falta el código" }, { status: 400 });

  return Response.json(await aceptarInvitacion(codigo, user.id));
}
