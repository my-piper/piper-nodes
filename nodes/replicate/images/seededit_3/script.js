import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  return 0.03;
}

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 40;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { image, prompt, seed, guidance_scale } = inputs;

    return await replicate.createTask(
      "models/bytedance/seededit-3.0/predictions",
      {
        image,
        prompt,
        guidance_scale,
        seed,
      }
    );
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output } = results;

  return next({
    outputs: { image: output },
    costs: costs({ env }),
  });
}
