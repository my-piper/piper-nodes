import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

// model - https://replicate.com/prunaai/z-image-turbo

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
    return 0;
  }

  const { target_resolution = 1, width = 1024, height = 1024 } = inputs ?? {};

  const w = Number(width) || 1024;
  const h = Number(height) || 1024;
  const megapixels = (w * h) / 1_000_000;

  const PRICE_PER_MP = {
    0.5: 0.0025,
    1: 0.005,
    2: 0.01,
    3: 0.015,
    4: 0.02,
  };

  const perMp = PRICE_PER_MP[target_resolution] ?? PRICE_PER_MP[1];
  const cost = megapixels * perMp;
  return Number(cost.toFixed(6));
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
