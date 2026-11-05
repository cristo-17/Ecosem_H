import type { StaffListResponse, CreateStaffRequest, CreateStaffResponse, AssignStaffRoleRequest, TicketPrintResponse, TicketPrintLogResponse } from "@/lib/types/contratos-panel";
import { conCuenta } from "./cuenta";
import { ApiError } from "./cliente";
import { mensajeCompra } from "./compra";

export const listarPersonal = () => conCuenta<StaffListResponse>("/v1/personal");
export const crearPersonal = (cuerpo: CreateStaffRequest) => conCuenta<CreateStaffResponse>("/v1/personal", { metodo: "POST", cuerpo });
export const editarPersonal = (id: string, cuerpo: AssignStaffRoleRequest) => conCuenta<void>(`/v1/personal/${encodeURIComponent(id)}`, { metodo: "PUT", cuerpo });
export const bajaPersonal = (id: string) => conCuenta<void>(`/v1/personal/${encodeURIComponent(id)}`, { metodo: "DELETE" });
const impresiones = (codigo: string) => `/v1/caja/ventas/${encodeURIComponent(codigo)}/impresiones`;
export const imprimirVenta = (codigo: string) => conCuenta<TicketPrintResponse>(impresiones(codigo), { metodo: "POST" });
export const historialImpresiones = (codigo: string) => conCuenta<TicketPrintLogResponse>(impresiones(codigo));

export function mensajePersonal(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.codigo) {
      case "STAFF_TERMINAL_REQUIRED": return { titulo: "Selecciona una agencia", descripcion: "Counter y embarque necesitan una agencia para operar. Elige la agencia de esta persona antes de confirmar." };
      case "STAFF_ACCOUNT_NOT_FOUND": return { titulo: "Esa persona todavía no tiene cuenta", descripcion: "Debe registrarse primero con ese correo. Verifica la dirección: no creamos cuentas automáticamente para evitar conceder acceso a otra persona." };
      case "STAFF_ALREADY_ACTIVE": return { titulo: "Ya es personal activo", descripcion: "Busca a la persona en la lista y elige Editar para cambiar su rol o agencia." };
      case "REPRINT_SHIFT_CLOSED": return { titulo: "El turno de esa venta ya cerró", descripcion: "Pide la reimpresión a un supervisor." };
      case "PURCHASE_VOIDED": return { titulo: "Esa compra fue anulada", descripcion: "No se pueden imprimir sus boletos." };
      case "NOT_FOUND": return { titulo: "No encontramos el registro", descripcion: "Revisa el código de compra o actualiza la lista de personal. Solo el vendedor autorizado o un supervisor pueden imprimir." };
      case "FORBIDDEN": return { titulo: "No tienes permiso para esta acción", descripcion: "Consulta con tu supervisor." };
      case "UNAUTHENTICATED": return { titulo: "Tu sesión terminó", descripcion: "Vuelve a iniciar sesión para continuar." };
      case "VALIDATION": return { titulo: "Revisa los datos", descripcion: error.message };
    }
  }
  return mensajeCompra(error);
}
