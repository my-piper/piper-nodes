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
    const {
      prompt,
      aspect_ratio,
      seed,
      image_reference,
      style_reference,
      character_reference,
      image_reference_weight,
      style_reference_weight,
    } = inputs;

    return await replicate.createTask("models/luma/photon/predictions", {
      prompt,
      aspect_ratio,
      seed,
      image_reference,
      style_reference,
      character_reference,
      image_reference_weight,
      style_reference_weight,
    });
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
