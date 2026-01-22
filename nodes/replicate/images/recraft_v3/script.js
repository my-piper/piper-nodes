import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env }) {
  if (Replicate.userScope(env)) {
    return 0;
  }
  return { costs: 0.04, details: "en=Price is fixed;ru=Цена фиксированна" };
}

const CHECK_INTERVAL = 1_000;
const MAX_ATTEMPTS = 20;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { prompt, style, aspect_ratio, image_size } = inputs;

    return await replicate.createTask(
      "models/recraft-ai/recraft-v3/predictions",
      {
        prompt,
        size: image_size,
        style,
        aspect_ratio,
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
    costs: costs({ env, inputs }),
  });
}
