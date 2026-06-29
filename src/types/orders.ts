export type OrdenEstado =
  | "pendiente"
  | "diagnosticado"
  | "en_progreso"
  | "reparado"
  | "finalizado"
  | "retirado";

export type OrdenBloqueoTipo = "none" | "pin" | "texto" | "patron";

export type OrdenFoto = {
  id?: number | string;
  uuid?: string;
  imagen?: string;
  imagen_url?: string;
  image?: string;
  image_url?: string;
  url?: string;
  public_url?: string;
  file_url?: string;
  src?: string;
  path?: string;
  ruta?: string;
  file_path?: string;
  filePath?: string;
  descripcion?: string;
  description?: string;
  desc?: string;
};

export type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  celular: string;
  direccion?: string;
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
  falla_reportada?: string;
  condicion_equipo?: string;
  accesorios_entregados?: string;
  observaciones?: string;
  presupuesto?: number | string | null;
  senia?: number | string | null;
  costo_final?: number | string | null;
  garantia_descuento?: number | string | null;
  garantia_dias?: number | string | null;
  observaciones_finales?: string;
  bloqueo_tipo?: OrdenBloqueoTipo;
  bloqueo_valor?: string;
  fotos?: Array<string | OrdenFoto>;

  fecha_finalizado: string | null;
  fecha_retirado: string | null;

  retirado_por_nombre: string;
  retirado_por_dni: string;
  observaciones_retiro: string;

  created_at: string;
  updated_at: string;
};
