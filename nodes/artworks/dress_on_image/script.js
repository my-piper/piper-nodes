import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.05;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { image, gender, prompt = "red swimsuit" } = inputs;

    return await artworks.createTask({
      type: "dress-on-image",
      payload: {
        base64: false,
        image,
        gender,
        prompt,
      },
    });
  }

  const results = await artworks.checkTask(state);
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
