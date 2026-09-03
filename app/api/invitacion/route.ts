import { getSessionUser } from "@/lib/auth";
import { miCodigo, regenerarCodigo } from "@/lib/invitaciones";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });
  return Response.json({ codigo: await miCodigo(user.id) });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });
  return Response.json({ codigo: await regenerarCodigo(user.id) });
}
