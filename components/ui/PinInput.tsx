"use client";

import { useRef } from "react";

/** Cuatro casillas que se comportan como un solo campo: avanzan solas, el
 *  backspace devuelve, y pegar el PIN completo llena las cuatro. */
export function PinInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const escribir = (i: number, digito: string) => {
    const limpio = digito.replace(/\D/g, "").slice(-1);
    const siguiente = (value.padEnd(4, " ").slice(0, i) + (limpio || " ") + value.padEnd(4, " ").slice(i + 1))
      .trimEnd()
      .replace(/ /g, "");
    onChange(siguiente.slice(0, 4));
    if (limpio && i < 3) refs.current[i + 1]?.focus();
  };

  return (
    <div className="flex gap-3" onPaste={(e) => {
      const pegado = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
      if (pegado) {
        e.preventDefault();
        onChange(pegado);
        refs.current[Math.min(pegado.length, 3)]?.focus();
      }
    }}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          aria-label={`Dígito ${i + 1} del PIN`}
          value={value[i] ?? ""}
          onChange={(e) => escribir(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          className="h-16 w-full rounded-2xl border-2 border-ink bg-cream text-center font-display text-2xl font-semibold outline-none focus:bg-yellow disabled:opacity-50"
        />
      ))}
    </div>
  );
}
