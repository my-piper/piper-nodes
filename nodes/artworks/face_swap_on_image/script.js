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
    const { face, image } = inputs;

    return await artworks.createTask({
      type: "faceswap-on-image",
      payload: {
        base64: false,
        face,
        image,
      },
    });
  }

  const results = await artworks.checkState(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const {
    images: [{ url: image }],
  } = results;
  return next({
    outputs: { image },
    costs: costs({ env, inputs }),
  });
}
