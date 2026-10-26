/**
 * Browser-side image processing using the Canvas API.
 * Everything runs locally — no network requests are made.
 *
 * Pipeline model:
 *   transformCanvas / cropImage  -> produce lossless PNG-backed "working images"
 *   resizeImage                   -> final encode in the chosen format + quality
 */

/** Load an HTMLImageElement from a src (object URL or data URL). */
export function createImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image failed to load'))
    img.src = src
  })
}

/** Convert a canvas to a lossless PNG-backed object URL plus a decoded image element. */
async function canvasToImage(canvas) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas encoding failed'))),
      'image/png',
    )
  })
  const url = URL.createObjectURL(blob)
  const imageEl = await createImage(url)
  return { url, imageEl, width: canvas.width, height: canvas.height }
}

/**
 * Apply rotation (degrees) and/or horizontal/vertical flip to an image.
 * Returns a new lossless image. Rotation by 90° swaps width/height.
 *
 * @param {HTMLImageElement} image
 * @param {number} rotation degrees (e.g. 90, -90, 180)
 * @param {boolean} flipH
 * @param {boolean} flipV
 */
export async function transformCanvas(image, rotation, flipH, flipV) {
  const rad = (rotation * Math.PI) / 180
  const w = image.naturalWidth
  const h = image.naturalHeight
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const bw = Math.round(w * cos + h * sin)
  const bh = Math.round(w * sin + h * cos)

  const canvas = document.createElement('canvas')
  canvas.width = bw
  canvas.height = bh
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(bw / 2, bh / 2)
  ctx.rotate(rad)
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
  ctx.drawImage(image, -w / 2, -h / 2)

  return canvasToImage(canvas)
}

/**
 * Crop an image to the given pixel area {x, y, width, height} in source pixels.
 * Returns a new lossless image.
 */
export async function cropImage(image, area) {
  const cw = Math.max(1, Math.round(area.width))
  const ch = Math.max(1, Math.round(area.height))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, cw, ch,
  )
  return canvasToImage(canvas)
}

/**
 * Resize a decoded image to the given dimensions and return a Blob in the chosen
 * format. This is the only lossy step in the pipeline.
 *
 * @param {HTMLImageElement} image
 * @param {number} width target width
 * @param {number} height target height
 * @param {string} mimeType image/jpeg | image/png | image/webp
 * @param {number} [quality=0.92] 0..1 for lossy formats
 * @returns {Promise<{blob: Blob, url: string, width: number, height: number, size: number}>}
 */
export async function resizeImage(image, width, height, mimeType, quality = 0.92) {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, w, h)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas encoding failed'))),
      mimeType,
      quality,
    )
  })

  return { blob, url: URL.createObjectURL(blob), width: w, height: h, size: blob.size }
}

/** Format a byte count as a human-readable string (e.g. "1.2 MB"). */
export function formatBytes(bytes) {
  if (bytes == null) return '—'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/** Pick a sensible output MIME type from the source file type, defaulting to JPEG. */
export function mimeForType(type) {
  if (type === 'image/png') return 'image/png'
  if (type === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

/** File extension for a MIME type. */
export function extensionFor(mimeType) {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}
