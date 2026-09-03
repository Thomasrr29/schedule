import { cerrarSesion } from "@/lib/auth";

export async function POST(req: Request) {
  await cerrarSesion();
  // 303 para que el navegador convierta el POST del form en un GET a /entrar.
  // Sin esto, salir deja al usuario mirando el JSON de la respuesta.
  return Response.redirect(new URL("/entrar", req.url), 303);
}
