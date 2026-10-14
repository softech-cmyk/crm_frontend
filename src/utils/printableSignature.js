const INK_COLOR = { r: 30, g: 41, b: 59 };

// Signatures drawn on the black pad are white ink on a transparent background,
// which would vanish on a white page. In pictures with transparency, light
// pixels are recoloured to dark ink; opaque pictures are left as-is.
export function toPrintableSignature(dataUrl) {
  if (!dataUrl) return Promise.resolve("");
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let hasTransparency = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255) {
          hasTransparency = true;
          break;
        }
      }
      if (!hasTransparency) {
        resolve(dataUrl);
        return;
      }
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] === 0) continue;
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        if (brightness < 200) continue;
        pixels[i] = INK_COLOR.r;
        pixels[i + 1] = INK_COLOR.g;
        pixels[i + 2] = INK_COLOR.b;
      }
      context.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}
