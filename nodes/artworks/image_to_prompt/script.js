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
    const { image, type = "photo" } = inputs;

    return await artworks.createTask({
      type: "image-to-prompt",
      payload: {
        base64: false,
        image,
        type,
      },
    });
  }

  const results = await artworks.checkState(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { prompt } = results;
  return next({
    outputs: { prompt },
    costs: costs({ env, inputs }),
  });
}
