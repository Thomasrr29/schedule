import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listarSedes } from "@/lib/sedes";
import { BottomNav } from "@/components/ui/BottomNav";
import { SubirHorario } from "./SubirHorario";

export default async function Subir({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");

  const { bienvenida } = await searchParams;

  return (
    <>
      <SubirHorario sedes={await listarSedes()} bienvenida={bienvenida === "1"} />
      <BottomNav />
    </>
  );
}
