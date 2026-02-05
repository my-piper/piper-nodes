import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

// model - https://replicate.com/google/nano-banana-pro

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
    return 0;
  }

  const { resolution = "2K" } = inputs;
  switch (resolution) {
    case "4K":
      return 0.3;
    case "1K":
    case "2K":
    default:
      return 0.15;
  }
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      prompt,
      images,
      aspect_ratio,
      resolution,
      output_format,
      safety_filter_level,
    } = inputs;

    return await replicate.createTask(
      "models/google/nano-banana-pro/predictions",
      {
        prompt,
        image_input: images,
        aspect_ratio,
        resolution,
        output_format,
        safety_filter_level,
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
