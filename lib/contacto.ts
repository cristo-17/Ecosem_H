/** Central publicada en Ayuda y Footer. Mantener una sola fuente para el número. */
const numero = "953249763";
export const CENTRAL = {
  telefono: numero.replace(/(\d{3})(?=\d)/g, "$1 "),
  href: `tel:+51${numero}`,
};
