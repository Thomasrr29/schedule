/** Casos borde del motor de cruce. Corre sin base de datos: `npm run check`. */
import assert from "node:assert/strict";
import { calcularCoincidencias, type BloqueBase } from "@/lib/matching";
import { restarIntervalos } from "@/lib/time";

const clase = (
  dia: BloqueBase["dia"],
  horaInicio: string,
  horaFin: string,
  sede: BloqueBase["sede"] = "ROBLEDO",
  tipo: BloqueBase["tipo"] = "OCUPADO",
): BloqueBase => ({ titulo: "x", dia, horaInicio, horaFin, sede, tipo });

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

test("sedes distintas a la misma hora -> nada", () => {
  const r = calcularCoincidencias(
    [clase("mar", "08:00", "10:00", "ROBLEDO")],
    [clase("mar", "08:00", "10:00", "FRATERNIDAD")],
  );
  assert.equal(r.length, 0);
});

test("robledo 8-10 + fraternidad 14-16 no es una ventana de 8 a 16", () => {
  const mios = [clase("mar", "08:00", "10:00", "ROBLEDO"), clase("mar", "14:00", "16:00", "FRATERNIDAD")];
  const r = calcularCoincidencias(mios, [clase("mar", "11:00", "13:00", "ROBLEDO")]);
  assert.equal(r.length, 0); // a las 12 yo voy en camino, no en el campus
});

test("me voy 15 min antes de que llegue -> no alcanza", () => {
  const r = calcularCoincidencias([clase("mie", "08:00", "10:00")], [clase("mie", "11:00", "13:00")]);
  assert.equal(r.length, 0);
});

test("bloque DISPONIBLE no se resta -> encuentro largo", () => {
  const suyos = [clase("mie", "12:00", "16:00", "ROBLEDO", "DISPONIBLE")];
  const r = calcularCoincidencias([clase("mie", "14:00", "16:00")], suyos);
  assert.equal(r.length, 1);
  assert.equal(r[0].tipo, "largo");
  assert.equal(r[0].tramoLibre?.minutos, 30); // 16:00 a 16:30, ya libre yo
});

test("hueco compartido de 2h entre clases -> largo", () => {
  const r = calcularCoincidencias(
    [clase("jue", "08:00", "10:00"), clase("jue", "14:00", "16:00")],
    [clase("jue", "09:00", "11:00"), clase("jue", "15:00", "17:00")],
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

console.log(`\n${pasaron}/9 casos\n`);
