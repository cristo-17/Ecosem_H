import type { DetectorDeCodigos } from "./tiposNavegador";

/** JS local: sin eval, WASM, workers ni solicitudes a terceros. */
export async function crearLector(): Promise<DetectorDeCodigos> {
  if (window.BarcodeDetector) return new window.BarcodeDetector({ formats: ["qr_code"] });
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const contexto = canvas.getContext("2d", { willReadFrequently: true });
  if (!contexto) throw new Error("No se pudo iniciar el lector QR");
  return {
    async detect(fuente) {
      const video = fuente as HTMLVideoElement;
      if (!video.videoWidth || !video.videoHeight) return [];
      const escala = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * escala);
      canvas.height = Math.round(video.videoHeight * escala);
      contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pixeles = contexto.getImageData(0, 0, canvas.width, canvas.height);
      const codigo = jsQR(pixeles.data, pixeles.width, pixeles.height);
      return codigo ? [{ rawValue: codigo.data }] : [];
    },
  };
}
