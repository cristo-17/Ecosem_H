"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { SkeletonShape } from "@/components/ui/Skeleton";

export interface QrBoletoProps {
  /** El contenido firmado tal como lo devolvió el backend (`EH1....`). No se altera. */
  contenido: string;
  asiento: string;
  className?: string;
}

/** QR real del boleto, para la app de embarque. Sin datos personales dentro. */
export function QrBoleto({ contenido, asiento, className }: QrBoletoProps) {
  const [imagen, setImagen] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    QRCode.toDataURL(contenido, { margin: 1, width: 240, errorCorrectionLevel: "M" }).then(
      (url) => vigente && setImagen(url),
      () => vigente && setImagen(null),
    );
    return () => {
      vigente = false;
    };
  }, [contenido]);

  if (!imagen) return <SkeletonShape variant="card" className={cn("size-48", className)} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URL generada en el cliente
    <img
      src={imagen}
      alt={`Código QR del boleto, asiento ${asiento}`}
      width={192}
      height={192}
      className={cn("size-48", className)}
    />
  );
}
