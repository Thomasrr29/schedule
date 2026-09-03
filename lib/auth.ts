import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const COOKIE = "session";
const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;

/** El token de la cookie tiene 256 bits de entropia, asi que sha256 basta y es
 *  instantaneo. bcrypt se reserva para el PIN, que solo tiene 10.000 opciones. */
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const hashPin = (pin: string) => bcrypt.hash(pin, 10);
export const verificarPin = (pin: string, hash: string) => bcrypt.compare(pin, hash);

export async function crearSesion(userId: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.deviceToken.create({ data: { userId, tokenHash: hashToken(token) } });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true, // fuera del alcance de cualquier JS de la pagina
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // un semestre; nadie quiere reloguearse cada semana
  });
}

export async function getSessionUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const device = await prisma.deviceToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  return device?.user ?? null;
}

export async function cerrarSesion() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await prisma.deviceToken.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(COOKIE);
}

/**
 * Un carnet del ITM es predecible y un PIN son 10.000 combinaciones: lo unico
 * que hace viable un PIN de 4 digitos es el bloqueo. Va en la DB y no en un Map
 * en memoria porque un redeploy de Railway reiniciaria el contador a cero.
 */
export function estaBloqueado(user: { bloqueadoHasta: Date | null }) {
  return !!user.bloqueadoHasta && user.bloqueadoHasta > new Date();
}

export async function registrarFallo(userId: string, intentosPrevios: number) {
  const intentos = intentosPrevios + 1;
  const bloquear = intentos >= MAX_INTENTOS;

  await prisma.user.update({
    where: { id: userId },
    data: {
      intentosFallidos: bloquear ? 0 : intentos,
      bloqueadoHasta: bloquear ? new Date(Date.now() + BLOQUEO_MIN * 60_000) : null,
    },
  });

  return { bloqueado: bloquear, intentosRestantes: Math.max(0, MAX_INTENTOS - intentos) };
}

export async function limpiarIntentos(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { intentosFallidos: 0, bloqueadoHasta: null },
  });
}
