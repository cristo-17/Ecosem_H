import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import { ShellPublico } from "@/components/layout/ShellPublico";
import { SelectorRolDemo } from "@/components/layout/SelectorRolDemo";
import { ToastProvider } from "@/components/ui/Toast";
import { haySesionActiva, obtenerRolDemo } from "@/lib/auth/sesion";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const conSesion = await haySesionActiva();
  const rol = await obtenerRolDemo();

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
          <ShellPublico haySesion={conSesion} rol={rol}>
            {children}
          </ShellPublico>
        </ToastProvider>
        {/*
          Solo development (docs/prompts/16-navbar-por-rol.md): este `if`
          corre en un Server Component, así que en `next build` de
          producción nunca es verdadero y el componente (y su Server
          Action) quedan fuera del árbol — no es un `hidden` de CSS.
          Verificado con `npm run build` + grep sobre `.next/`.
        */}
        {process.env.NODE_ENV === "development" && (
          <SelectorRolDemo estadoActual={conSesion ? rol : "sin-sesion"} />
        )}
      </body>
    </html>
  );
}
