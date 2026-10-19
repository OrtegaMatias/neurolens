/**
 * Reduce una imagen a una miniatura JPEG (lado mayor = `lado` px) y la devuelve
 * como data URL. Así el historial ocupa pocos KB en localStorage.
 */
export async function crearMiniatura(imagen: Blob, lado = 96): Promise<string> {
  const bitmap = await createImageBitmap(imagen);
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.75);
}
