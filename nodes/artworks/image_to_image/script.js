import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import { next } from "../../../utils/node.js";
import { ArtWorks, fitSize } from "../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }

  const { performance = "speed", batchSize = 1 } = inputs;
  const imageCost = (() => {
    switch (performance) {
      case "express":
        return 0.005;
      case "quality":
        return 0.015;
      case "speed":
      default:
        return 0.01;
    }
  })();

  return batchSize * imageCost;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      image,
      prompt = "cat walking on the Mars",
      checkpoint,
      negativePrompt,
      imageSize,
      denoisingStrength,
      cfgScale,
      performance,
      batchSize,
      seed,
      // SDXL
      sharpness,
    } = inputs;

    return await artworks.createTask({
      type: "image-to-image",
      payload: {
        base64: false,
        image,
        prompt,
        checkpoint,
        negativePrompt,
        ...(imageSize
          ? await (async () => {
              const response = await fetch(image);
              const arrayBuffer = await response.arrayBuffer();
              const buffer = new Uint8Array(arrayBuffer);
              const img = await Image.decode(buffer);
              const { width, height } = img;
              if (imageSize !== "auto:auto") {
                const { width: w, height: h } = fitSize(
                  imageSize,
                  height / width
                );
                return { size: `${w}x${h}` };
              }

              return {};
            })()
          : {}),
        denoisingStrength,
        cfgScale,
        performance,
        batchSize,
        seed,
        // SDXL
        sharpness,
      },
    });
  }

  const results = await artworks.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const images = results.images.map((i) => i.url);
  return next({
    outputs: {
      images,
    },
    costs: costs({ env, inputs }),
  });
}
