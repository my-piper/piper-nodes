import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.0013;
}

const CHECK_INTERVAL = 5_000;
const MAX_ATTEMPTS = 150;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { image, prompt, details } = inputs;

    return await artworks.createTask({
      type: "caption-image",
      payload: {
        base64: false,
        image,
        prompt,
        details,
      },
    });
  }

  const results = await artworks.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { caption, text, description } = results;
  return next({
    outputs: {
      text: caption || text || description,
    },
    costs: costs({ env }),
  });
}
