// Downscale + re-encode gambar di client sebelum diupload, biar payload kecil.
export function resizeImage(file: File, maxDim = 1024, type = "image/webp", quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(type, quality));
    };
    img.src = URL.createObjectURL(file);
  });
}
