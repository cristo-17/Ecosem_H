import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

// latin-ext asegura tildes y ñ. IBM Plex Sans no es variable font en Google
// Fonts: hay que declarar cada peso que usa el skill (400/500/600/700).
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ecosem H",
  description: "Pasajes y encomiendas — Lima, Cerro de Pasco, Huancayo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${ibmPlexSans.variable} antialiased`}>
      <head>
        {/*
          Algunas extensiones de navegador (antivirus/antitracking, p. ej.
          las que dejan bis_skin_checked) inyectan atributos en el DOM antes
          de que React hidrate, en cualquier elemento del árbol — no solo
          <body>, así que suppressHydrationWarning (que no es recursivo) no
          alcanza. Este script corre antes de la hidratación y los limpia;
          el MutationObserver sigue limpiando si la extensión los reinyecta
          después. Ver https://react.dev/link/hydration-mismatch.
          React 19 exige que un <script> síncrono declarado fuera de <head>
          tenga async, o vaya dentro de <head> — de ahí el <head> explícito.
        */}
        <Script id="strip-extension-attrs" strategy="beforeInteractive">
          {`
            (function () {
              var ATTR = "bis_skin_checked";
              function strip(root) {
                if (root.hasAttribute && root.hasAttribute(ATTR)) root.removeAttribute(ATTR);
              }
              document.querySelectorAll("[" + ATTR + "]").forEach(strip);
              if (typeof MutationObserver === "undefined") return;
              new MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                  if (m.type === "attributes" && m.target.hasAttribute(ATTR)) {
                    m.target.removeAttribute(ATTR);
                  }
                });
              }).observe(document.documentElement, {
                attributes: true,
                attributeFilter: [ATTR],
                subtree: true,
              });
            })();
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <ToastProvider>
          <TopBar />
          <div className="flex-1">{children}</div>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
