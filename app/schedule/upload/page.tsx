import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listarSedes } from "@/lib/sedes";
import { BottomNav } from "@/components/ui/BottomNav";
import { SubirHorario } from "./SubirHorario";

export default async function Subir() {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");

  return (
    <>
      <SubirHorario sedes={await listarSedes()} />
      <BottomNav />
    </>
  );
}
