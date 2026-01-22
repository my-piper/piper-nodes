import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import { next } from "../../../utils/node.js";
import { ArtWorks, fitSize } from "../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }

  const { performance } = inputs;

  switch (performance) {
    case "express":
      return 0.0032;
    case "speed":
      return 0.0043;
    case "quality":
      return 0.0054;
    default:
      throw new Error("Unknown performance type");
  }
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

export async function run({ inputs, state, env }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      image,
      prompt = "change image area",
      checkpoint,
      negativePrompt,
      imageSize,
      denoisingStrength = 1,
      cfgScale = 7,
      performance,
      batchSize,
      seed = -1,
      // mask
      mask,
      maskMargin,
      // SDXL
      invertMask,
    } = inputs;

    return await artworks.createTask({
      type: "inpaint-on-image",
      payload: {
        base64: false,
        image,
        prompt,
        checkpoint,
        negativePrompt,
        ...(!!imageSize
          ? await (async () => {
              const response = await fetch(image);
              const imageData = new Uint8Array(await response.arrayBuffer());
              const img = await Image.decode(imageData);
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
        ...(batchSize > 1 ? { batchSize } : {}),
        ...(seed > 0 ? { seed } : {}),
        // mask
        mask,
        maskMargin,
        // SDXL
        invertMask,
      },
    });
  }

  const results = await artworks.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const images = results.images.map((i) => i.url);
  return next({
    outputs: { images },
    costs: costs({ env, inputs }),
  });
}
