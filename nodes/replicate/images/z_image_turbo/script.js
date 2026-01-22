import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  return 0.01;
}

const CHECK_INTERVAL = 1_000;
const MAX_ATTEMPTS = 30;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      prompt,
      width,
      height,
      num_inference_steps,
      guidance_scale,
      seed,
      output_format,
      output_quality,
    } = inputs;

    return await replicate.createTask(
      "models/prunaai/z-image-turbo/versions/7ea16386290ff5977c7812e66e462d7ec3954d8e007a8cd18ded3e7d41f5d7cf/predictions",
      {
        prompt,
        width,
        height,
        num_inference_steps,
        guidance_scale,
        output_format,
        output_quality,
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
