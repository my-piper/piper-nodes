import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { number_of_images = 1 } = inputs;
  return 0.01 * number_of_images;
}

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 50;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      prompt,
      aspect_ratio,
      number_of_images,
      prompt_optimizer,
      character,
    } = inputs;

    return await replicate.createTask("models/minimax/image-01/predictions", {
      prompt,
      aspect_ratio,
      number_of_images,
      prompt_optimizer,
      subject_reference: character,
    });
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output } = results;

  return next({
    outputs: { images: output },
    costs: costs({ env, inputs }),
  });
}
