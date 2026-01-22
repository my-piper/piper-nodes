import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

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

const CHECK_INTERVAL = 5_000;
const MAX_ATTEMPTS = 100;

export async function run({ inputs, state, env }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      image,
      prompt = "extend image",
      checkpoint,
      negativePrompt,
      denoisingStrength,
      cfgScale,
      performance,
      batchSize,
      seed,
      // distance
      distanceTop = 50,
      distanceRight = 50,
      distanceBottom = 50,
      distanceLeft = 50,
    } = inputs;

    return await artworks.createTask({
      type: "outpaint-on-image",
      payload: {
        base64: false,
        image,
        prompt,
        checkpoint,
        negativePrompt,
        denoisingStrength,
        cfgScale,
        performance,
        batchSize,
        seed,
        // distance
        distanceTop,
        distanceRight,
        distanceBottom,
        distanceLeft,
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
