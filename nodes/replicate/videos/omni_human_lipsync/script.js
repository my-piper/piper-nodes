import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

const COST_PER_SECOND = 0.14;

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
    return 0;
  }
  // TODO: fetch actual video length
  return COST_PER_SECOND * 5;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 120;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { image, audio } = inputs;

    return await replicate.createTask(
      "models/bytedance/omni-human/predictions",
      {
        image,
        audio,
      }
    );
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output: video } = results;

  return next({
    outputs: { video },
    costs: costs({ env, inputs }),
  });
}
