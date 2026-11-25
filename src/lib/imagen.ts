const MAX_LADO = 1000
const CALIDAD = 0.82
const MAX_BYTES = 15 * 1024 * 1024

function leerArchivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error('No se pudo procesar la imagen.'))
    imagen.src = src
  })
}

/**
 * Achica y comprime una imagen para guardarla dentro del producto como data URL.
 * Evita que el catálogo y los backups crezcan de más.
 */
export async function optimizarImagen(src: string): Promise<string> {
  const imagen = await cargarImagen(src)
  if (!imagen.width || !imagen.height) {
    throw new Error('La imagen no es válida.')
  }

  const escala = Math.min(1, MAX_LADO / Math.max(imagen.width, imagen.height))
  const ancho = Math.max(1, Math.round(imagen.width * escala))
  const alto = Math.max(1, Math.round(imagen.height * escala))

  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const contexto = canvas.getContext('2d')
  if (!contexto) return src

  const soportaWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  if (!soportaWebp) {
    contexto.fillStyle = '#ffffff'
    contexto.fillRect(0, 0, ancho, alto)
  }
  contexto.drawImage(imagen, 0, 0, ancho, alto)

  return canvas.toDataURL(soportaWebp ? 'image/webp' : 'image/jpeg', CALIDAD)
}

export async function prepararImagen(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo tiene que ser una imagen.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('La imagen es muy pesada (máximo 15 MB).')
  }

  const original = await leerArchivo(file)
  return optimizarImagen(original)
}
