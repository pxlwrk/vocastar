/** Verkleinert ein Foto im Browser und liefert JPEG als Base64 (ohne Prefix). */
export async function downscaleImage(file: File, maxSize = 1600, quality = 0.85): Promise<{ base64: string; dataUrl: string }> {
  const bitmap = await createImageBitmap(file).catch(async () => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    URL.revokeObjectURL(url);
    return img;
  });
  const w = "width" in bitmap ? bitmap.width : 0;
  const h = "height" in bitmap ? bitmap.height : 0;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const c2d = canvas.getContext("2d")!;
  c2d.fillStyle = "#fff";
  c2d.fillRect(0, 0, canvas.width, canvas.height);
  c2d.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl, base64: dataUrl.split(",")[1] };
}
