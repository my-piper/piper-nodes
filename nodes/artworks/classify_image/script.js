import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.0001;
}

const CHECK_INTERVAL = 1_000;
const MAX_ATTEMPTS = 20;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { image, labels } = inputs;

    return await artworks.createTask({
      type: "classify-image",
      payload: {
        base64: false,
        image,
        model: "siglip-2",
        labels: Object.values(labels),
      },
    });
  }

  const results = await artworks.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { probs } = results;
  const { labels } = inputs;
  const tags = {};
  for (const key of Object.keys(labels)) {
    tags[key] = probs[labels[key]];
  }
  return next({
    outputs: { labels: tags },
    costs: costs({ env, inputs }),
  });
}
