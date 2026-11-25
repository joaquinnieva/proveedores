export type ID = string

export const ESTADOS_PROVEEDOR = ['activo', 'pausado'] as const
export type EstadoProveedor = (typeof ESTADOS_PROVEEDOR)[number]

export const ESTADOS_PEDIDO = [
  'interesado',
  'por_pedir',
  'pedido',
  'confirmado',
  'recibido',
  'cancelado',
] as const
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number]

export const CANALES = ['web', 'whatsapp', 'email', 'feria', 'otro'] as const
export type CanalPedido = (typeof CANALES)[number]

export const PRIORIDADES = ['baja', 'media', 'alta'] as const
export type PrioridadPedido = (typeof PRIORIDADES)[number]

export interface Proveedor {
  id: ID
  nombre: string
  rubro?: string
  etiquetas: string[]
  estado: EstadoProveedor
  whatsapp?: string
  email?: string
  telefono?: string
  web?: string
  instagram?: string
  direccion?: string
  zona?: string
  condicionesPago?: string
  pedidoMinimo?: number
  costoEnvio?: number
  envioGratisDesde?: number
  plazoEntrega?: string
  notas?: string
  ultimoContacto?: string
  createdAt: string
  updatedAt: string
}

export type ProveedorInput = Omit<Proveedor, 'id' | 'createdAt' | 'updatedAt'>

export interface Contacto {
  id: ID
  proveedorId: ID
  nombre: string
  rol?: string
  telefono?: string
  email?: string
  notas?: string
}

export type ContactoInput = Omit<Contacto, 'id'>

export interface Producto {
  id: ID
  proveedorId: ID
  nombre: string
  codigo?: string
  categoria?: string
  costo?: number
  unidad?: string
  moq?: number
  link?: string
  imagen?: string
  notas?: string
  createdAt: string
}

export type ProductoInput = Omit<Producto, 'id' | 'createdAt'>

export interface Pedido {
  id: ID
  proveedorId: ID
  referencia?: string
  estado: EstadoPedido
  canal?: CanalPedido
  prioridad?: PrioridadPedido
  fecha: string
  fechaDeseada?: string
  notas?: string
  createdAt: string
  updatedAt: string
}

export type PedidoInput = Omit<Pedido, 'id' | 'createdAt' | 'updatedAt'>

export interface PedidoItem {
  id: ID
  pedidoId: ID
  productoId?: ID
  descripcion: string
  cantidad: number
  precioUnitario: number
  unidad?: string
  notas?: string
}

export interface Settings {
  id: 'app'
  nombreNegocio: string
  moneda: string
  locale: string
  margenGanancia?: number
}

export const MONEDAS = ['ARS', 'USD', 'EUR', 'MXN', 'CLP', 'COP', 'UYU', 'BRL', 'PEN'] as const
