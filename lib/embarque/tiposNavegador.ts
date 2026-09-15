/**
 * `BarcodeDetector` es una API nativa del navegador (Chrome/Edge/Android
 * WebView — exactamente el runtime de una PWA instalada en un Android en el
 * andén), pero todavía no forma parte de los tipos DOM estándar de
 * TypeScript. Se declara acá para no usar `any` (regla del prompt) al
 * acceder a `window.BarcodeDetector`.
 */
export interface CodigoDetectado {
  rawValue: string;
}

export interface DetectorDeCodigos {
  detect(fuente: CanvasImageSource): Promise<CodigoDetectado[]>;
}

export interface OpcionesDetectorDeCodigos {
  formats?: string[];
}

export interface ConstructorDetectorDeCodigos {
  new (opciones?: OpcionesDetectorDeCodigos): DetectorDeCodigos;
}

declare global {
  interface Window {
    BarcodeDetector?: ConstructorDetectorDeCodigos;
  }
}

export {};
