// Compresses an image file in the browser before upload.
// Large original photos (e.g. a 10-15MB phone photo) are accepted, resized to
// a reasonable max dimension, and re-encoded as JPEG at decreasing quality
// until the result fits under the target size — so uploads stay fast and
// Supabase Storage doesn't fill up with unnecessarily huge files.

export interface CompressResult {
  dataUrl: string;
  fileName: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

const MAX_INPUT_BYTES = 15 * 1024 * 1024; // 15MB hard cap on what we'll even attempt
const TARGET_MAX_BYTES = 2 * 1024 * 1024; // Try to get compressed output under 2MB
const MAX_DIMENSION = 1920; // Max width/height in pixels after resize
const MIN_QUALITY = 0.4; // Don't degrade quality below this even if still over target

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(blob);
  });
}

export async function compressImage(file: File): Promise<CompressResult> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(
      `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please choose a photo under ${MAX_INPUT_BYTES / 1024 / 1024}MB.`
    );
  }

  // Skip resizing/re-encoding for formats that don't play well with canvas
  // (SVG is already tiny/vector, GIF may be animated) or files already small.
  if (file.type === "image/svg+xml" || file.type === "image/gif" || file.size <= TARGET_MAX_BYTES) {
    const dataUrl = await readAsDataUrl(file);
    return {
      dataUrl,
      fileName: file.name,
      originalSizeBytes: file.size,
      compressedSizeBytes: file.size
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load image for compression"));
      image.src = objectUrl;
    });

    let { width, height } = img;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser");
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.85;
    let blob: Blob | null = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) break;
      if (blob.size <= TARGET_MAX_BYTES || quality <= MIN_QUALITY) break;
      quality -= 0.15;
    }

    if (!blob) {
      throw new Error("Failed to compress image");
    }

    const dataUrl = await readAsDataUrl(blob);
    const compressedFileName = file.name.replace(/\.[^.]+$/, "") + ".jpg";

    return {
      dataUrl,
      fileName: compressedFileName,
      originalSizeBytes: file.size,
      compressedSizeBytes: blob.size
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
