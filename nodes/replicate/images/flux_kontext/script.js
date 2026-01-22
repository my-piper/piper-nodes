import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
    return 0;
  }

  const { model = "fast" } = inputs;
  const PRICES = {
    fast: 0.01,
    dev: 0.032,
    pro: 0.04,
    max: 0.08,
  };
  return PRICES[model];
}

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 90;

const MODEL_PATHS = {
  fast: "prunaai/flux-kontext-fast",
  dev: "black-forest-labs/flux-kontext-dev-lora",
  pro: "black-forest-labs/flux-kontext-pro",
  max: "black-forest-labs/flux-kontext-max",
};

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      model = "fast",
      prompt,
      image,
      aspect_ratio,
      seed,
      safety_tolerance,
      prompt_upsampling,
      output_format,
      output_quality,
    } = inputs;

    return await replicate.createTask(
      `models/${MODEL_PATHS[model]}/predictions`,
      {
        prompt,
        img_cond_path: image,
        aspect_ratio,
        seed,
        safety_tolerance,
        prompt_upsampling,
        output_format,
        output_quality,
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
