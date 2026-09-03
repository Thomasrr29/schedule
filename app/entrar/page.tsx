import { FormularioEntrar } from "./FormularioEntrar";

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  const { volver } = await searchParams;

  // Solo rutas internas: sin esto, /entrar?volver=https://otro-sitio convierte
  // la pantalla de login en un redirector abierto.
  const destino = volver?.startsWith("/") && !volver.startsWith("//") ? volver : "/";

  return <FormularioEntrar destino={destino} />;
}
