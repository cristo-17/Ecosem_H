import { PaginaEnConstruccion } from "@/components/layout/PaginaEnConstruccion";
import { HeadsetIcon } from "@/components/ui/icons";

export default function AyudaPage() {
  return (
    <PaginaEnConstruccion
      titulo="Ayuda"
      icon={<HeadsetIcon />}
      descripcion="Aquí vas a encontrar preguntas frecuentes y formas de contactarte con nosotros."
    />
  );
}
