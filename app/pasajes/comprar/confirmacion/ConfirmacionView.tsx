"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PurchaseSummary } from "@/components/pasajes/PurchaseSummary";
import { QrPlaceholder } from "@/components/pasajes/QrPlaceholder";
import { usePurchase } from "@/components/pasajes/PurchaseProvider";
import type { MetodoPago } from "@/components/pasajes/PurchaseProvider";
import {
  CheckIcon,
  DownloadIcon,
  InfoIcon,
  SearchOffIcon,
} from "@/components/ui/icons";
import { formatPrecio } from "@/lib/format";
import { descargarPdf, type LineaPdf } from "@/lib/pdf";
import { RUTAS } from "@/lib/routes";

const LABEL_METODO: Record<MetodoPago, string> = {
  yape: "Yape",
  plin: "Plin",
  tarjeta: "Tarjeta",
};

function etiquetaAsiento(id: string): string {
  return id.replace(/^P\d-/, "");
}

export function ConfirmacionView() {
  const router = useRouter();
  const purchase = usePurchase();
  const boleto = purchase.boleto;

  if (!boleto) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<SearchOffIcon />}
          title="No hay una compra confirmada"
          description="No encontramos un boleto para mostrar. Si ya pagaste, revisa Mi Perfil."
          actionLabel="Ir a Mi Perfil"
          onAction={() => router.push(RUTAS.miPerfil)}
        />
      </main>
    );
  }

  function descargarBoleto() {
    if (!boleto) return;
    const lineas: LineaPdf[] = [
      { texto: "Ecosem H", tamano: 20, negrita: true },
      { texto: "Boleto de viaje", tamano: 13, negrita: true, espacioAntes: 4 },
      { texto: `Código: ${boleto.codigo}`, espacioAntes: 12 },
      {
        texto: `Emitido: ${boleto.emitidoEn.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
      },
      {
        texto: `Ruta: ${boleto.viaje.origen} -> ${boleto.viaje.destino}`,
        espacioAntes: 10,
      },
      { texto: `Terminal de salida: ${boleto.viaje.terminalOrigen}` },
      { texto: `Asientos: ${boleto.asientos.map(etiquetaAsiento).join(", ")}` },
      { texto: "Pasajeros:", espacioAntes: 10, negrita: true },
      ...boleto.pasajeros.map((pasajero) => ({
        texto: `- ${pasajero.nombres} (${pasajero.tipoDocumento.toUpperCase()} ${pasajero.numeroDocumento})`,
      })),
      {
        texto: `Comprobante: ${boleto.comprobante.tipo === "factura" ? "Factura" : "Boleta"}`,
        espacioAntes: 10,
      },
      ...(boleto.comprobante.tipo === "factura"
        ? [
            {
              texto: `RUC ${boleto.comprobante.ruc} - ${boleto.comprobante.razonSocial}`,
            },
          ]
        : []),
      { texto: `Método de pago: ${LABEL_METODO[boleto.metodoPago]}` },
      {
        texto: `Total pagado: ${formatPrecio(boleto.total)}`,
        tamano: 13,
        negrita: true,
        espacioAntes: 8,
      },
    ];
    descargarPdf(`boleto-${boleto.codigo}.pdf`, lineas);
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-10 text-center sm:py-14">
      <span className="flex size-14 items-center justify-center rounded-full bg-success-fill">
        <CheckIcon className="!size-6 text-success-text" />
      </span>
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">
        ¡Compra confirmada!
      </h1>
      <p className="max-w-sm text-sm text-navy/70">
        Guarda tu código{" "}
        <span className="font-semibold text-navy">{boleto.codigo}</span>. Lo vas
        a necesitar para embarcar.
      </p>

      <Card className="mt-2 flex w-full flex-col items-center gap-3">
        <QrPlaceholder semilla={boleto.codigo} />
        <p className="text-xs text-navy/50">Muestra este código al embarcar</p>
      </Card>

      {/*
        bg-info-fill + text-info-text (no texto blanco sobre el fill, como en
        Toast): en v2 los fills son pasteles claros, así que el texto tiene
        que ser el tono oscuro del mismo par fill/text para pasar AA.
      */}
      <div className="flex w-full items-start gap-2 rounded-md bg-info-fill p-4 text-left text-sm text-info-text">
        <InfoIcon className="mt-0.5 !size-5 shrink-0" />
        <p>
          Llega 30 minutos antes con tu DNI físico. El equipaje de mano viaja
          contigo.
        </p>
      </div>

      <PurchaseSummary
        viaje={boleto.viaje}
        asientos={boleto.asientos}
        pasajeros={boleto.pasajeros}
        className="w-full text-left"
      />

      <Card className="w-full text-left text-sm text-navy/80">
        <p>
          Comprobante:{" "}
          <span className="font-medium text-navy">
            {boleto.comprobante.tipo === "factura" ? "Factura" : "Boleta"}
          </span>
        </p>
        {boleto.comprobante.tipo === "factura" && (
          <p className="mt-1">
            RUC {boleto.comprobante.ruc} — {boleto.comprobante.razonSocial}
          </p>
        )}
        <p className="mt-1">
          Método de pago:{" "}
          <span className="font-medium text-navy">
            {LABEL_METODO[boleto.metodoPago]}
          </span>
        </p>
      </Card>

      <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button onClick={descargarBoleto} className="w-full sm:w-auto">
          <DownloadIcon className="!text-white" />
          Descargar PDF
        </Button>
        <Button
          variant="terciario"
          onClick={() => router.push(RUTAS.inicio)}
          className="w-full sm:w-auto"
        >
          Volver al inicio
        </Button>
      </div>
    </main>
  );
}
