/**
 * El encabezado comun de las cuatro pantallas del arranque: en donde vas, que
 * te estamos pidiendo y para que sirve. El "para que" no es decorativo — pedir
 * un carnet y un PIN sin decir por que es lo que hace que la gente se salga.
 *
 * Las ilustraciones van como background-image y no como <img>: si algun dia
 * falta el archivo queda un hueco limpio en vez del icono de imagen rota.
 *
 * Son JPEG con fondo blanco, no PNG recortados, asi que sobre el crema de la
 * app se verian como una tarjeta blanca pegada encima. mix-blend-multiply lo
 * resuelve sin tener que retocarlas: el blanco desaparece contra el fondo y
 * el dibujo queda flotando en la pagina. El crema es tan claro que
 * multiplicar apenas les mueve el color.
 */
const ARTE = {
  astronauta: "/onboarding/astronauta.jpeg",
  celular: "/onboarding/celular.jpeg",
  parceros: "/onboarding/parceros.jpeg",
} as const;

const TOTAL = 4;

function Progreso({ paso }: { paso: number }) {
  return (
    <div className="flex gap-1.5" role="img" aria-label={`Paso ${paso} de ${TOTAL}`}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full ${i < paso ? "bg-ink" : "bg-ink/15"}`}
        />
      ))}
    </div>
  );
}

export function EncabezadoPaso({
  arte,
  paso,
  titulo,
  porque,
}: {
  arte?: keyof typeof ARTE;
  paso: number;
  titulo: string;
  porque: string;
}) {
  return (
    <header className="space-y-4">
      <Progreso paso={paso} />

      {arte && (
        <div
          aria-hidden
          className="h-44 bg-contain bg-center bg-no-repeat mix-blend-multiply"
          style={{ backgroundImage: `url(${ARTE[arte]})` }}
        />
      )}

      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold">{titulo}</h1>
        <p className="text-sm text-muted">{porque}</p>
      </div>
    </header>
  );
}
