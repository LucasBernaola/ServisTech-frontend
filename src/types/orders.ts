export type OrdenEstado =
  | "pendiente"
  | "diagnosticado"
  | "en_progreso"
  | "reparado"
  | "finalizado"
  | "retirado";

export type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  celular: string;
  created_at: string;
  updated_at: string;
};

export type Orden = {
  id: number;
  public_token: string;

  estado: OrdenEstado;
  estado_display: string;

  cliente: Cliente | null;

  dispositivo_tipo: string;
  marca: string;
  modelo: string;
  imei_serial: string;

  fecha_finalizado: string | null;
  fecha_retirado: string | null;

  retirado_por_nombre: string;
  retirado_por_dni: string;
  observaciones_retiro: string;

  created_at: string;
  updated_at: string;
};