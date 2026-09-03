/**
 * Parseo de la celda "Aula" del horario del ITM. Sin dependencias: se puede
 * probar sin base de datos, que es donde vive el riesgo de esta lógica.
 */

export type SedeRef = { id: string; nombre: string };
export type SedeConAlias = SedeRef & { alias: string[] };

const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

// "C-308", "N-310", "M-203". El prefijo parece ser el bloque dentro de la sede.
const CODIGO_AULA = /^[A-Za-zÑñ]{1,3}-?\d{1,4}[A-Za-z]?$/;

/**
 * El horario del ITM mete todo en una celda: "N-310 FRATERNIDAD MEDELLÍN (MAÑANA)".
 * La jornada se descarta a propósito — la hora del bloque ya dice si es mañana
 * o noche, y guardarla sería un dato duplicado que se puede contradecir.
 */
export function partirAula(celda: string): { aula: string | null; resto: string } {
  const sinJornada = celda.replace(/\([^)]*\)/g, " ").trim();
  const tokens = sinJornada.split(/\s+/).filter(Boolean);
  const aula = tokens.length > 0 && CODIGO_AULA.test(tokens[0]) ? tokens[0].toUpperCase() : null;
  return { aula, resto: (aula ? tokens.slice(1) : tokens).join(" ") };
}

/** Busca la sede por alias, sin importar tildes ni mayúsculas. */
export function reconocerSede(texto: string, sedes: SedeConAlias[]): SedeRef | null {
  const t = normalizar(texto);
  if (!t) return null;

  // Alias más largo primero: si algún día hay una "Fraternidad Bello" como sede
  // aparte, tiene que ganarle a la coincidencia con "Fraternidad" a secas.
  const encontrada = sedes
    .flatMap((s) => s.alias.map((a) => ({ sede: s, alias: normalizar(a) })))
    .sort((a, b) => b.alias.length - a.alias.length)
    .find((c) => c.alias.length > 0 && t.includes(c.alias));

  return encontrada ? { id: encontrada.sede.id, nombre: encontrada.sede.nombre } : null;
}
