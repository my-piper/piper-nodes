import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.001;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 20;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      image,
      type = "yolo",
      model = "deepfashion2_yolov8s-seg.pt",
      prompt,
      threshold,
      applyConvexHull,
    } = inputs;

    return await artworks.createTask({
      type: "image-to-mask",
      payload: {
        base64: false,
        image,
        type,
        model,
        prompt,
        threshold,
        applyConvexHull,
      },
    });
  }

  const results = await artworks.checkState(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { masks: detected } = results;
  const { image } = inputs;

  // Download the original image to get dimensions
  const response = await fetch(image);
  const imageData = new Uint8Array(await response.arrayBuffer());
  const img = await Image.decode(imageData);
  const { width: imageWidth, height: imageHeight } = img;

  // Process masks and create merged mask
  const masks = [];
  let mergedImg = new Image(imageWidth, imageHeight);
  mergedImg.fill(0x000000ff); // Black background

  for (const m of detected) {
    const {
      mask,
      confidence,
      className,
      coordinates: [left, top],
    } = m;

    // Decode base64 mask to get dimensions
    const maskBuffer = Uint8Array.from(atob(mask), (c) => c.charCodeAt(0));
    const maskImg = await Image.decode(maskBuffer);

    masks.push({
      top,
      left,
      width: maskImg.width,
      height: maskImg.height,
      className,
      confidence,
    });

    // Composite mask onto merged image
    mergedImg.composite(maskImg, left, top);
  }

  return next({
    outputs: {
      masks,
      merged: await mergedImg.encode(),
    },
    costs: costs({ env, inputs }),
  });
}
