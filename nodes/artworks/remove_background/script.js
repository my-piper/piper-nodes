import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.005;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 20;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { image } = inputs;

    return await artworks.createTask({
      type: "remove-image-background",
      payload: {
        base64: false,
        image,
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
    outputs: { image },
    costs: costs({ env, inputs }),
  });
}
