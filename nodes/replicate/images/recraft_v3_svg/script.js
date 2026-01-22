import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env }) {
  if (Replicate.userScope(env)) {
    return 0;
  }
  return 0.08;
}

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 40;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { prompt, aspect_ratio, style } = inputs;

    return await replicate.createTask(
      "models/recraft-ai/recraft-v3-svg/predictions",
      {
        prompt,
        aspect_ratio,
        style,
      }
    );
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output } = results;

  return next({
    outputs: { svg: output },
    costs: costs({ env, inputs }),
  });
}
