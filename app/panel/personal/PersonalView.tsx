"use client";
import { useEffect, useRef, useState } from "react";
import type { CreateStaffRequest, StaffListResponse, StaffRole } from "@/lib/types/contratos-panel";
import { listarPersonal, crearPersonal, editarPersonal, bajaPersonal, mensajePersonal } from "@/lib/api/personal";
import { obtenerCatalogo } from "@/lib/api/ventas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TicketIcon } from "@/components/ui/icons";

type Persona = StaffListResponse["staff"][number];
const VACIO: CreateStaffRequest = { email: "", firstName: "", lastName: "", role: "counter", terminal: "" };
const ROLES = [{ value: "counter", label: "Counter" }, { value: "embarque", label: "Embarque" }, { value: "supervisor", label: "Supervisor" }];

export default function PersonalView() {
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [agencias, setAgencias] = useState<SelectOption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ReturnType<typeof mensajePersonal> | null>(null);
  const [errorModal, setErrorModal] = useState<ReturnType<typeof mensajePersonal> | null>(null);
  const [modal, setModal] = useState<"alta" | "editar" | "baja" | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [form, setForm] = useState(VACIO);
  const [ocupado, setOcupado] = useState(false);
  const bloqueo = useRef(false);
  const [aviso, setAviso] = useState("");

  async function cargar() {
    setCargando(true); setError(null);
    try {
      const [lista, catalogo] = await Promise.all([listarPersonal(), obtenerCatalogo()]);
      setPersonal(lista.staff);
      setAgencias(catalogo.terminals.map(t => ({ value: t.code, label: t.name })));
    } catch (e) { setError(mensajePersonal(e)); }
    finally { setCargando(false); }
  }
  useEffect(() => {
    let vigente = true;
    Promise.all([listarPersonal(), obtenerCatalogo()]).then(([lista, catalogo]) => {
      if (!vigente) return;
      setPersonal(lista.staff);
      setAgencias(catalogo.terminals.map(t => ({ value: t.code, label: t.name })));
    }).catch(e => { if (vigente) setError(mensajePersonal(e)); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  function abrir(tipo: "alta" | "editar" | "baja", p: Persona | null = null) {
    setPersona(p); setForm(p ? { email: "", firstName: p.firstName, lastName: p.lastName, role: p.role, terminal: p.terminal ?? "" } : VACIO);
    setErrorModal(null); setModal(tipo); setAviso("");
  }
  async function confirmar() {
    if (bloqueo.current) return;
    if (modal !== "baja" && form.role !== "supervisor" && !form.terminal) {
      setErrorModal({ titulo: "Selecciona una agencia", descripcion: "Counter y embarque necesitan una agencia para operar. Elige la agencia de esta persona antes de confirmar." }); return;
    }
    if (modal !== "baja" && (!form.firstName.trim() || !form.lastName.trim() || (form.role !== "supervisor" && !form.terminal) || (modal === "alta" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())))) {
      setErrorModal({ titulo: "Completa los datos", descripcion: "Ingresa nombres, apellidos, un correo válido para el alta y agencia para counter o embarque." }); return;
    }
    bloqueo.current = true; setOcupado(true); setErrorModal(null);
    try {
      if (modal === "alta") await crearPersonal({ ...form, email: form.email.trim(), firstName: form.firstName.trim(), lastName: form.lastName.trim(), terminal: form.role === "supervisor" ? null : form.terminal });
      else if (persona && modal === "editar") await editarPersonal(persona.userId, { role: form.role, terminal: form.role === "supervisor" ? null : form.terminal, firstName: form.firstName.trim(), lastName: form.lastName.trim() });
      else if (persona && modal === "baja") await bajaPersonal(persona.userId);
      setModal(null); setAviso("Cambio guardado."); await cargar();
    } catch (e) { setErrorModal(mensajePersonal(e)); }
    finally { bloqueo.current = false; setOcupado(false); }
  }
  return <div className="flex flex-col gap-6">
    <div><h1 className="text-2xl font-semibold text-navy">Personal</h1><p className="text-sm text-text-secondary">La persona debe registrarse primero con su correo. El alta concede acceso a esa cuenta existente.</p></div>
    <Button className="self-start" onClick={() => abrir("alta")} disabled={cargando || !!error}>Dar de alta por correo</Button>
    {aviso && <p role="status">{aviso}</p>}
    {cargando && <div role="status" aria-label="Cargando personal"><Skeleton variant="card" className="h-48 w-full" /></div>}
    {error && <Card><div role="alert"><h2>{error.titulo}</h2><p>{error.descripcion}</p></div><Button variant="secundario" onClick={cargar}>Reintentar</Button></Card>}
    {!cargando && !error && personal.length === 0 && <EmptyState icon={<TicketIcon />} title="Todavía no hay personal" description="Da de alta a una persona que ya tenga cuenta." actionLabel="Dar de alta" onAction={() => abrir("alta")} />}
    {!cargando && !error && personal.map(p => <Card key={p.userId} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-navy">{p.firstName} {p.lastName}</h2><p className="text-sm text-text-secondary">{ROLES.find(r => r.value === p.role)?.label} · {agencias.find(a => a.value === p.terminal)?.label ?? "Sin agencia"} · {p.active ? "Activo" : "De baja"}</p></div><div className="flex flex-wrap gap-2"><Button variant="secundario" onClick={() => abrir("editar", p)}>Editar</Button>{p.active && <Button variant="destructivo" onClick={() => abrir("baja", p)}>Dar de baja</Button>}</div></Card>)}
    <Modal open={modal !== null} onClose={() => { if (!ocupado) setModal(null); }} preventDismiss={ocupado} title={modal === "alta" ? "Dar de alta por correo" : modal === "baja" ? "Dar de baja" : "Editar personal"} footer={<><Button variant="terciario" disabled={ocupado} onClick={() => setModal(null)}>Cancelar</Button><Button variant={modal === "baja" ? "destructivo" : "principal"} isLoading={ocupado} onClick={confirmar}>Confirmar</Button></>}>
      <div className="flex flex-col gap-4">
        {modal === "baja" ? <p>Se quitará el acceso de {persona?.firstName} {persona?.lastName} y se cerrarán sus sesiones. Tendrá que volver a iniciar sesión.</p> : <>
          {modal === "alta" && <Input label="Correo de la cuenta registrada" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} helperText="Si no tiene cuenta, debe registrarse primero. Verifica el correo antes de confirmar." />}
          <Input label="Nombres" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Apellidos" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          <Select label="Rol" options={ROLES} value={form.role} onChange={role => setForm({ ...form, role: role as StaffRole })} />
          <p className="text-sm text-text-secondary">{form.role === "embarque" ? "Solo puede entrar a /embarque: descargar el paquete del viaje, escanear y sincronizar. No puede vender ni acceder a caja, tarifas, personal o manifiestos." : form.role === "supervisor" ? "Puede administrar personal, tarifas y operaciones. No exige agencia." : "Puede vender y operar caja y viajes de su agencia."}</p>
          {form.role !== "supervisor" && <Select label="Agencia (obligatoria)" options={agencias} value={form.terminal || null} onChange={terminal => setForm({ ...form, terminal })} />}
          {modal === "editar" && <p className="rounded-md bg-warning-fill p-4 text-sm text-warning-text">Cambiar el rol cierra las sesiones de esta persona. Tendrá que volver a iniciar sesión. Confirma los permisos antes de guardar.</p>}
        </>}
        {errorModal && <div role="alert" className="text-error-text"><h3>{errorModal.titulo}</h3><p>{errorModal.descripcion}</p></div>}
      </div>
    </Modal>
  </div>;
}
