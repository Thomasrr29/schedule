"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Semana" },
  { href: "/schedule/mine", label: "Horario" },
  { href: "/friends", label: "Parceros" },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto mb-4 flex w-[min(24rem,calc(100%-3rem))] gap-1 rounded-full bg-ink p-1.5">
      {ITEMS.map(({ href, label }) => {
        const activo = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 rounded-full py-3 text-center font-display text-sm font-semibold ${
              activo ? "bg-yellow text-ink" : "text-cream"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
