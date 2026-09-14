import { cn } from "@/lib/cn";

// Iconos internos compartidos entre componentes de components/ui.
// Todos decorativos (aria-hidden) porque el significado ya lo da el texto
// o los atributos aria del control que los usa.

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5 text-navy/50", className)}
    >
      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5 text-navy/60 transition-transform", className)}
    >
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5 text-navy", className)}
    >
      <path d="m12.5 5-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5 text-navy", className)}
    >
      <path d="m7.5 5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5 text-navy/60", className)}
    >
      <rect x="3.5" y="4.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 8h13M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-4 text-navy/60", className)}
    >
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SearchOffIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      className={cn("pointer-events-none size-12 text-navy/30", className)}
    >
      <circle cx="21" cy="21" r="12" stroke="currentColor" strokeWidth="2" />
      <path d="m30 30 9 9M8 8l32 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-4", className)}
    >
      <circle cx="10" cy="6" r="1" fill="currentColor" />
      <path d="M10 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-4", className)}
    >
      <path d="M10 5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

export function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-6 text-navy", className)}
    >
      <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-6 text-navy", className)}
    >
      <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 17c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BoxIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-8 text-secondary", className)}
    >
      <path
        d="M3.5 7.5 12 3l8.5 4.5L12 12 3.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 7.5V16l8.5 4.5m0 0L20.5 16V7.5M12 20.5V12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-4 text-secondary", className)}
    >
      <path d="m4 10.5 4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Pareja pequeña para las pestañas Pasajes/Encomiendas (pastillas): sin
// clase de color propia, heredan currentColor del botón que las envuelve
// para poder cambiar de tono junto con el texto al seleccionar la pestaña.
export function PasajesTabIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-4", className)}
    >
      <path
        d="M2.5 8a1.5 1.5 0 0 0 0 3v2.5A1 1 0 0 0 3.5 14.5h13a1 1 0 0 0 1-1V11a1.5 1.5 0 0 1 0-3V5.5a1 1 0 0 0-1-1h-13a1 1 0 0 0-1 1V8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 5v10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.5 2" strokeLinecap="round" />
    </svg>
  );
}

export function EncomiendasTabIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-4", className)}
    >
      <path d="M3 6.5 10 3l7 3.5-7 3.5-7-3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 6.5v7l7 3.5m0 0 7-3.5v-7M10 17v-7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5 text-navy/60", className)}
    >
      <path
        d="M10 17.5s6-5.2 6-9.7A6 6 0 0 0 4 7.8c0 4.5 6 9.7 6 9.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="7.8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5", className)}
    >
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function MinusIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5", className)}
    >
      <path d="M4 10h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

// Familia de íconos grandes para pantallas vacías/placeholder: mismo molde
// que SearchOffIcon (viewBox 48, size-12, text-navy/30) para que todas las
// pantallas "todavía no construidas" se lean como un mismo lenguaje visual.
export function TicketIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      className={cn("pointer-events-none size-12 text-navy/30", className)}
    >
      <path
        d="M6 18a4 4 0 0 0 0 8v6a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2v-6a4 4 0 0 1 0-8v-6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M20 12v24" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" />
    </svg>
  );
}

export function HeadsetIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      className={cn("pointer-events-none size-12 text-navy/30", className)}
    >
      <path d="M10 26v-2a14 14 0 0 1 28 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="6" y="24" width="8" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
      <rect x="34" y="24" width="8" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M42 34v2a6 6 0 0 1-6 6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TrackIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      className={cn("pointer-events-none size-12 text-navy/30", className)}
    >
      <circle cx="9" cy="30" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 29c8 0 6-11 14-11s5 11 13 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 6"
      />
      <path
        d="M39 12.5c0 5.2-6 10.5-6 10.5s-6-5.3-6-10.5a6 6 0 0 1 12 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="33" cy="12.5" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SendPackageIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      className={cn("pointer-events-none size-12 text-navy/30", className)}
    >
      <path
        d="M8 17 24 9l16 8-16 8-16-8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 17v14l16 8m0-8 16-8v-6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 25v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 6v10m0-10-4 4m4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SignpostIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      className={cn("pointer-events-none size-12 text-navy/30", className)}
    >
      <path d="M20 42V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M20 16h16l-4 5 4 5H20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M20 24H6l4-4.5L6 15h14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M13 42h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Íconos de la fila de confianza del Home (tamaño medio, color secundario).
export function YearsBadgeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-6 text-secondary", className)}
    >
      <circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="m9.5 8.5 2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14.5 7.5 21l4.5-2.5 4.5 2.5-1.5-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function GpsIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-6 text-secondary", className)}
    >
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SeatIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-6 text-secondary", className)}
    >
      <path d="M7 4v8a2 2 0 0 0 2 2h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4h4M17 12v6a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 12h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function BusIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 80"
      fill="none"
      className={cn("pointer-events-none", className)}
    >
      <rect x="6" y="14" width="100" height="46" rx="10" stroke="currentColor" strokeWidth="2.5" />
      <path d="M6 34h100" stroke="currentColor" strokeWidth="2.5" />
      <path d="M22 20v10M40 20v10M58 20v10M76 20v10M94 20v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 60v6a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-6M86 60v6a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30" cy="66" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="90" cy="66" r="7" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

// Encabezan las Card de Misión/Visión en /nosotros: mismo tratamiento que
// los íconos de acento de EncomiendaPromo (secondary, dentro de un círculo
// bg-secondary/10), no la familia grande de pantallas vacías.
export function FlagIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-6 text-secondary", className)}
    >
      <path d="M6 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M6 4.5 18 8l-4 4.5 4 4.5-12 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-6 text-secondary", className)}
    >
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Placeholder de imagen en /nosotros (galería de flota): mismo molde que la
// familia grande de pantallas vacías (viewBox 48, text-navy/30) para que un
// slot sin archivo se lea como "intencional", no como un ícono roto.
export function ImagePlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      className={cn("pointer-events-none size-10 text-navy/30", className)}
    >
      <rect x="5" y="9" width="38" height="30" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="19" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="m8 33 9.5-9.5 6.5 6.5 6-6L38 32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Íconos sociales del footer: trazo simple a 1.5px, mismo tratamiento que
// el resto (currentColor), pensados para verse sobre fondo navy.
export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-5", className)}
    >
      <path
        d="M15 8.5h2.5V5H15c-2.2 0-4 1.8-4 4v2H9v3.5h2V21h3.5v-6.5H17l.5-3.5h-3V9c0-.6.4-1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-5", className)}
    >
      <rect x="4" y="4" width="16" height="16" rx="4.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="16.5" cy="7.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-5", className)}
    >
      <path
        d="M14 4v10.2a2.8 2.8 0 1 1-2.5-2.78"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 4a4.2 4.2 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5", className)}
    >
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4.5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-6", className)}
    >
      <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 9.5h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 14.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-6", className)}
    >
      <rect x="6" y="3" width="12" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 17.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5", className)}
    >
      <path d="M10 3v10m0 0-3.5-3.5M10 13l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v1.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SteeringWheelIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("pointer-events-none size-5 text-navy/40", className)}
    >
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="1.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 3.5v5M4.6 13.2l4.2-2.4M15.4 13.2l-4.2-2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-6 text-secondary", className)}
    >
      <path d="M12 3v18M7 21h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 6 5 8m7-2 7 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 8.5a3 3 0 0 0 6 0L5 8Zm10 0a3 3 0 0 0 6 0l-3-.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("pointer-events-none size-5", className)}
    >
      <path
        d="M6 18.5 4.5 20l1.5-3.9a7.5 7.5 0 1 1 3 2.9L6 18.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 9.3c.2-.5.4-.5.7-.5h.4c.2 0 .4 0 .5.35.2.5.6 1.5.6 1.6.1.1.1.3 0 .4-.1.2-.1.3-.3.4-.1.15-.3.3-.4.4-.15.15-.3.3-.15.6.2.3.7 1.1 1.5 1.7.9.7 1.6.9 1.9 1 .3.1.4.1.55-.1.15-.2.6-.7.75-.9.15-.2.3-.15.5-.1.2.1 1.4.65 1.6.75.2.1.35.15.4.25.05.1.05.6-.15 1.15-.2.55-1.1 1.05-1.55 1.1-.4.05-.9.1-3-.85-2.55-1.1-4.15-3.7-4.28-3.9-.1-.15-.9-1.25-.9-2.35 0-1.1.55-1.65.75-1.85Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
