import { getSessionUser } from "@/lib/auth";
import { coincidenciasDe } from "@/lib/coincidencias";
import { coincidenciasEnCurso } from "@/lib/matching";
import { ahoraEnBogota } from "@/lib/time";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  const todo = await coincidenciasDe(user.id);
  if (new URL(req.url).searchParams.get("live") !== "true") return Response.json(todo);

  const { dia, minutos } = ahoraEnBogota();
  return Response.json(
    todo
      .map((r) => ({ ...r, coincidencias: coincidenciasEnCurso(r.coincidencias, dia, minutos) }))
      .filter((r) => r.coincidencias.length > 0),
  );
}
