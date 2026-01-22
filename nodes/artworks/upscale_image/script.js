import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }

  const { upscalingResize } = inputs;
  return 0.005 * upscalingResize;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 20;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { image, upscalingResize } = inputs;

    return await artworks.createTask({
      type: "upscale-image",
      payload: {
        base64: false,
        image,
        upscalingResize,
      },
    });
  }

  const results = await artworks.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const {
    image: { url: image },
  } = results;
  return next({
    outputs: {
      image,
    },
    costs: costs({ env, inputs }),
  });
}
