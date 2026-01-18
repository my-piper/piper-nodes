export async function run({ inputs }) {
  const { download, next } = require("@piper/node");
  const { createCanvas, loadImage } = require("canvas");

  const { config } = inputs;

  const dpr = 2;
  const canvas = createCanvas(config.canvas.width * dpr, config.canvas.height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, config.canvas.width, config.canvas.height);

  ctx.scale(dpr, dpr);

  const sortedKeys = Object.keys(config.layers).sort((a, b) => {
    const orderA = config.layers[a].order || 0;
    const orderB = config.layers[b].order || 0;
    return orderA - orderB;
  });

  for (const key of sortedKeys) {
    const layer = config.layers[key];
    const value = inputs[key];
    if (!value) {
      continue;
    }

    switch (layer.type) {
      case "image":
        const { data: buffer } = await download(value);
        const img = await loadImage(buffer);
        const w = Math.round(layer.width || img.width);
        const h = Math.round(layer.height || img.height);
        ctx.drawImage(
          img,
          Math.round(layer.x || 0),
          Math.round(layer.y || 0),
          w,
          h
        );
        break;
      case "text":
        const text = value || "-";
        const fontSize = layer.fontSize ?? 24;
        const fontFamily = layer.fontFamily ?? "Arial, sans-serif";
        const fontWeight = layer.fontWeight ?? "normal";
        const color = layer.color ?? "#000000";
        const bg =
          layer.backgroundColor === undefined ? null : layer.backgroundColor;
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textBaseline = "top";
        const x = Math.round(layer.x || 0);
        const y = Math.round(layer.y || 0);
        const metrics = ctx.measureText(text);
        const textWidth = Math.ceil(metrics.width);
        const lineHeight = Math.round(fontSize * 1.2);
        if (bg !== null) {
          ctx.fillStyle = bg;
          ctx.fillRect(x, y, textWidth, lineHeight);
        }
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        break;
    }
  }

  const image = canvas.toBuffer("image/png");
  return next({ outputs: { image } });
}
