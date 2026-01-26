import {
  next,
  throwError,
} from "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/utils/node.js";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

async function download(url, timeout = 30000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throwError.fatal(
        `Failed to fetch ${url}: ${res.status} ${res.statusText}`
      );
    }

    return new Uint8Array(await res.arrayBuffer());
  } catch (error) {
    if (error.name === "AbortError") {
      throwError.fatal(`Timeout downloading ${url} after ${timeout}ms`);
    }
    throwError.fatal(`Failed to download ${url}: ${error.message}`);
  }
}

// Helper function to parse hex color to RGBA (RGBA format for imagescript)
function hexToRGBA(hex) {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  const a = cleaned.length === 8 ? parseInt(cleaned.substring(6, 8), 16) : 255;
  return (r << 24) | (g << 16) | (b << 8) | a;
}

export async function run({ inputs }) {
  const { config } = inputs;

  const dpr = 2;
  const width = config.canvas.width * dpr;
  const height = config.canvas.height * dpr;

  // Create base canvas with white background
  const canvas = new Image(width, height);
  canvas.fill(0xffffffff);

  const sortedKeys = Object.keys(config.layers).sort((a, b) => {
    const orderA = config.layers[a].order || 0;
    const orderB = config.layers[b].order || 0;
    return orderA - orderB;
  });

  // Process layers sequentially to maintain correct compositing order
  for (const key of sortedKeys) {
    const layer = config.layers[key];
    const value = inputs[key];
    if (!value) {
      continue;
    }

    if (layer.type === "image") {
      // Sequential processing required for correct layer compositing
      // deno-lint-ignore no-await-in-loop
      const buffer = await download(value);
      // deno-lint-ignore no-await-in-loop
      const img = await Image.decode(buffer);

      const w = Math.round((layer.width || img.width) * dpr);
      const h = Math.round((layer.height || img.height) * dpr);
      const x = Math.round((layer.x || 0) * dpr);
      const y = Math.round((layer.y || 0) * dpr);

      // Resize image if needed
      let resizedImg = img;
      if (w !== img.width || h !== img.height) {
        resizedImg = img.resize(w, h);
      }

      // Composite onto canvas
      canvas.composite(resizedImg, x, y);
    } else if (layer.type === "text") {
      // Note: imagescript doesn't support custom fonts or text rendering
      // This is a simplified implementation that creates a colored rectangle
      const text = value || "-";
      const fontSize = (layer.fontSize ?? 24) * dpr;
      const _color = hexToRGBA(layer.color ?? "#000000");
      const bg =
        layer.backgroundColor === undefined ? null : layer.backgroundColor;
      const x = Math.round((layer.x || 0) * dpr);
      const y = Math.round((layer.y || 0) * dpr);

      // Approximate text dimensions (rough estimate)
      const textWidth = Math.ceil(text.length * fontSize * 0.6);
      const lineHeight = Math.round(fontSize * 1.2);

      // Draw background if specified
      if (bg !== null) {
        const bgColor = hexToRGBA(bg);
        const bgRect = new Image(textWidth, lineHeight);
        bgRect.fill(bgColor);
        canvas.composite(bgRect, x, y);
      }

      // Note: Actual text rendering is not supported by imagescript
      // You would need to use a different library or pre-rendered text images
      console.warn(
        `Text rendering not fully supported in imagescript. Text: "${text}"`
      );
    }
  }

  const image = await canvas.encode();
  return next({ outputs: { image } });
}
