/** Casos borde del motor de cruce. Corre sin base de datos: `npm run check`. */
import assert from "node:assert/strict";
import {
  calcularCoincidencias,
  coincidenciasEnCurso,
  ventanasDePresencia,
  type BloqueBase,
} from "@/lib/matching";
import { ahoraEnBogota, restarIntervalos } from "@/lib/time";
import { partirAula, reconocerSede, type SedeConAlias } from "@/lib/aula";
import { normalizarHora, parsearRango } from "@/lib/horas";

const clase = (
  dia: BloqueBase["dia"],
  horaInicio: string,
  horaFin: string,
  sedeId = "robledo",
  tipo: BloqueBase["tipo"] = "OCUPADO",
): BloqueBase => ({ titulo: "x", dia, horaInicio, horaFin, sedeId, sedeNombre: sedeId, tipo });

let pasaron = 0;
const test = (nombre: string, fn: () => void) => {
  try {
    fn();
    pasaron++;
    console.log(`  ok   ${nombre}`);
  } catch (e) {
    console.error(`  FALLO ${nombre}\n       ${(e as Error).message.split("\n")[0]}`);
    process.exitCode = 1;
  }
};

console.log("\ncruce de horarios\n");

test("yo salgo 10:00 y el entra 10:00 -> se cruzan en la puerta (corto)", () => {
  const r = calcularCoincidencias([clase("mar", "08:00", "10:00")], [clase("mar", "10:00", "12:00")]);
  assert.equal(r.length, 1);
  assert.equal(r[0].tipo, "corto");
  assert.equal(r[0].inicio, "09:45"); // su llegada, no su clase
  assert.equal(r[0].fin, "10:30"); // mi salida con holgura
  assert.equal(r[0].tramoLibre, null); // uno de los dos siempre esta en clase
});

test("hueco corto entre clases -> sigue siendo una sola ventana", () => {
  // 45 min entre clases: nadie se va a la casa por eso.
  const v = ventanasDePresencia([clase("mar", "08:00", "10:00"), clase("mar", "10:45", "12:00")]);
  assert.equal(v.length, 1);
  assert.equal(v[0].inicio, 8 * 60 - 15);
  assert.equal(v[0].fin, 12 * 60 + 30);
});

test("hueco largo entre clases -> dos ventanas, no una barra de 8 a 18", () => {
  const v = ventanasDePresencia([clase("mar", "08:00", "10:00"), clase("mar", "16:00", "18:00")]);
  assert.equal(v.length, 2);
  assert.equal(v[0].fin, 10 * 60 + 30); // se fue despues de la primera
  assert.equal(v[1].inicio, 16 * 60 - 15); // volvio para la segunda
});

test("el hueco de otro no genera encuentro falso", () => {
  // El clasico: el tiene clase temprano y en la tarde, yo voy a mediodia.
  const r = calcularCoincidencias(
    [clase("mar", "12:00", "14:00")],
    [clase("mar", "08:00", "10:00"), clase("mar", "16:00", "18:00")],
  );
  assert.equal(r.length, 0);
});

test("un DISPONIBLE en el hueco vuelve a unir las dos ventanas", () => {
  // "Me quedo estudiando de 10 a 16": lo dijo el, ya no es suposicion.
  const v = ventanasDePresencia([
    clase("mar", "08:00", "10:00"),
    clase("mar", "10:00", "16:00", "robledo", "DISPONIBLE"),
    clase("mar", "16:00", "18:00"),
  ]);
  assert.equal(v.length, 1);
  assert.equal(v[0].inicio, 8 * 60 - 15);
  assert.equal(v[0].fin, 18 * 60 + 30);
});

test("clases solapadas no cortan la tanda por el fin del ultimo bloque", () => {
  // La segunda termina antes que la primera; el corte debe medirse contra el
  // fin mayor, no contra el del bloque que se ley al final.
  const v = ventanasDePresencia([
    clase("mar", "08:00", "13:00"),
    clase("mar", "09:00", "10:00"),
    clase("mar", "14:00", "15:00"),
  ]);
  assert.equal(v.length, 1); // 13:00 -> 14:00 es una hora, no pasa el umbral
});

test("sedes distintas a la misma hora -> nada", () => {
  const r = calcularCoincidencias(
    [clase("mar", "08:00", "10:00", "robledo")],
    [clase("mar", "08:00", "10:00", "fraternidad")],
  );
  assert.equal(r.length, 0);
});

test("robledo 8-10 + fraternidad 14-16 no es una ventana de 8 a 16", () => {
  const mios = [clase("mar", "08:00", "10:00", "robledo"), clase("mar", "14:00", "16:00", "fraternidad")];
  const r = calcularCoincidencias(mios, [clase("mar", "11:00", "13:00", "robledo")]);
  assert.equal(r.length, 0); // a las 12 yo voy en camino, no en el campus
});

test("me voy 15 min antes de que llegue -> no alcanza", () => {
  const r = calcularCoincidencias([clase("mie", "08:00", "10:00")], [clase("mie", "11:00", "13:00")]);
  assert.equal(r.length, 0);
});

test("bloque DISPONIBLE no se resta -> encuentro largo", () => {
  const suyos = [clase("mie", "12:00", "16:00", "robledo", "DISPONIBLE")];
  const r = calcularCoincidencias([clase("mie", "14:00", "16:00")], suyos);
  assert.equal(r.length, 1);
  assert.equal(r[0].tipo, "largo");
  assert.equal(r[0].tramoLibre?.minutos, 30); // 16:00 a 16:30, ya libre yo
});

test("hueco compartido largo -> no se asume que los dos se quedaron", () => {
  // Antes esto daba un solo encuentro largo de 11:00 a 14:00, dando por hecho
  // que ninguno se movio del campus en tres horas. Ahora son dos ratos cortos,
  // uno por cada tanda de clases.
  const r = calcularCoincidencias(
    [clase("jue", "08:00", "10:00"), clase("jue", "14:00", "16:00")],
    [clase("jue", "09:00", "11:00"), clase("jue", "15:00", "17:00")],
  );
  assert.equal(r.length, 2);
  assert.deepEqual(
    r.map((c) => c.tipo),
    ["corto", "corto"],
  );
  assert.equal(r[0].inicio, "08:45");
  assert.equal(r[1].inicio, "14:45");
});

test("si los dos declaran que se quedan, vuelve el encuentro largo", () => {
  // Mismo horario que el caso anterior, pero cada uno marco su parche fijo en
  // el hueco. Ya no es una suposicion de la app: lo dijeron ellos.
  const r = calcularCoincidencias(
    [
      clase("jue", "08:00", "10:00"),
      clase("jue", "10:00", "14:00", "robledo", "DISPONIBLE"),
      clase("jue", "14:00", "16:00"),
    ],
    [
      clase("jue", "09:00", "11:00"),
      clase("jue", "11:00", "15:00", "robledo", "DISPONIBLE"),
      clase("jue", "15:00", "17:00"),
    ],
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].tipo, "largo");
  assert.equal(r[0].tramoLibre?.inicio, "11:00");
  assert.equal(r[0].tramoLibre?.fin, "14:00");
});

test("solape de menos de 15 min no se reporta", () => {
  // el sale 10:00 (+30 = 10:30), yo entro 10:20 (-15 = 10:05): 25 min, si pasa.
  // subiendo mi entrada a 10:40 (-15 = 10:25) quedan 5 min: no pasa.
  const suyos = [clase("vie", "08:00", "10:00")];
  assert.equal(calcularCoincidencias([clase("vie", "10:20", "12:00")], suyos).length, 1);
  assert.equal(calcularCoincidencias([clase("vie", "10:40", "12:00")], suyos).length, 0);
});

test("dias distintos no cruzan", () => {
  assert.equal(calcularCoincidencias([clase("lun", "08:00", "10:00")], [clase("mar", "08:00", "10:00")]).length, 0);
});

test("restarIntervalos tolera cortes desordenados y solapados", () => {
  const libres = restarIntervalos({ inicio: 0, fin: 100 }, [
    { inicio: 60, fin: 80 },
    { inicio: 10, fin: 30 },
    { inicio: 20, fin: 40 }, // se solapa con el anterior
  ]);
  assert.deepEqual(libres, [
    { inicio: 0, fin: 10 },
    { inicio: 40, fin: 60 },
    { inicio: 80, fin: 100 },
  ]);
});

console.log("\nhora local y modo ahora\n");

test("el server corre en UTC pero el dia es el de Medellin", () => {
  // 03/sep 02:00 UTC son las 21:00 del 02/sep en Bogota. Con el getDay() del
  // server esto diria jueves, y el dashboard cambiaria de dia a las 7pm.
  const t = ahoraEnBogota(new Date("2026-09-03T02:00:00Z"));
  assert.equal(t.dia, "mie");
  assert.equal(t.minutos, 21 * 60);
});

test("domingo no es dia de U", () => {
  assert.equal(ahoraEnBogota(new Date("2026-09-06T15:00:00Z")).dia, null);
});

test("ahora solo deja lo que esta pasando en este momento", () => {
  const c = calcularCoincidencias(
    [clase("mie", "12:00", "16:00", "robledo", "DISPONIBLE")],
    [clase("mie", "14:00", "16:00")],
  );
  assert.equal(c.length, 1); // ventana 13:45-16:30
  assert.equal(coincidenciasEnCurso(c, "mie", 14 * 60).length, 1); // adentro
  assert.equal(coincidenciasEnCurso(c, "mie", 13 * 60 + 30).length, 0); // antes
  assert.equal(coincidenciasEnCurso(c, "mie", 16 * 60 + 30).length, 0); // el fin no cuenta
  assert.equal(coincidenciasEnCurso(c, "jue", 14 * 60).length, 0); // otro dia
  assert.equal(coincidenciasEnCurso(c, null, 14 * 60).length, 0); // domingo
});

console.log("");
console.log("sedes y aulas");
console.log("");

// Las mismas cuatro que siembra prisma/seed.ts.
const SEDES: SedeConAlias[] = [
  { id: "robledo", nombre: "Robledo", alias: ["ROBLEDO"] },
  { id: "fraternidad", nombre: "Fraternidad", alias: ["FRATERNIDAD"] },
  { id: "cata", nombre: "CATA", alias: ["CATA"] },
  { id: "floresta", nombre: "Floresta", alias: ["FLORESTA", "LA FLORESTA"] },
];

test("celda real del ITM: saca el aula y la sede, y bota la jornada", () => {
  const r = partirAula("N-310 FRATERNIDAD MEDELLIN (MANANA)");
  assert.equal(r.aula, "N-310");
  assert.equal(reconocerSede(r.resto, SEDES)?.id, "fraternidad");
});

test("el sufijo de ciudad no estorba", () => {
  const r = partirAula("C-308 ROBLEDO (NOCHE)");
  assert.equal(r.aula, "C-308");
  assert.equal(reconocerSede(r.resto, SEDES)?.id, "robledo");
});

test("tildes y minusculas dan igual", () => {
  assert.equal(reconocerSede("la floresta medellin", SEDES)?.id, "floresta");
  assert.equal(reconocerSede("FLORESTA", SEDES)?.id, "floresta");
});

test("una sede que no conocemos no se inventa", () => {
  assert.equal(reconocerSede("BELLO", SEDES), null);
  assert.equal(reconocerSede("", SEDES), null);
});

test("celda sin codigo de aula", () => {
  const r = partirAula("CATA (MANANA)");
  assert.equal(r.aula, null);
  assert.equal(reconocerSede(r.resto, SEDES)?.id, "cata");
});

console.log("");
console.log("horas del horario del ITM");
console.log("");

test("celdas reales: 8:0-9:59 es de 8 a 10", () => {
  assert.deepEqual(parsearRango("8:0-9:59"), { inicio: "08:00", fin: "10:00" });
  assert.deepEqual(parsearRango("18:0-19:59"), { inicio: "18:00", fin: "20:00" });
  assert.deepEqual(parsearRango("6:0-7:59"), { inicio: "06:00", fin: "08:00" });
  assert.deepEqual(parsearRango("10:0-11:59"), { inicio: "10:00", fin: "12:00" });
});

test("sin cero a la izquierda, que es como viene", () => {
  assert.equal(normalizarHora("8:0"), "08:00");
  assert.equal(normalizarHora("6:5"), "06:05");
  assert.equal(normalizarHora("18:0"), "18:00");
});

test("un fin que no termina en :59 se respeta tal cual", () => {
  assert.deepEqual(parsearRango("8:00-10:00"), { inicio: "08:00", fin: "10:00" });
  assert.deepEqual(parsearRango("14:00-15:30"), { inicio: "14:00", fin: "15:30" });
});

test("basura no pasa", () => {
  assert.equal(parsearRango("25:00-26:00"), null);
  assert.equal(parsearRango("8:0"), null);
  assert.equal(parsearRango("10:0-9:0"), null); // fin antes que inicio
  assert.equal(normalizarHora("ocho"), null);
});

console.log(`\n${pasaron} casos, ${process.exitCode ? "con fallos" : "todos bien"}\n`);
