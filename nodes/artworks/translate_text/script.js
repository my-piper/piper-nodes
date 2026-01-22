import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return { costs: 0.001, details: "en=Price is fixed;ru=Цена фиксирована" };
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 10;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { source = "auto", target = "en", text } = inputs;
    return await artworks.createTask({
      type: "translate-text",
      payload: {
        source,
        target,
        text,
      },
    });
  }

  const results = await artworks.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { text } = results;
  return next({
    outputs: { text },
    costs: costs({ env, inputs }),
  });
}
