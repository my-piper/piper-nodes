import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
    return 0;
  }
  const { model = "imagen-4" } = inputs;
  switch (model) {
    case "imagen-4-fast":
      return 0.02;
    case "imagen-4-ultra":
      return 0.06;
    case "imagen-4":
    default:
      return 0.04;
  }
}

const CHECK_INTERVAL = 1_000;
const MAX_ATTEMPTS = 40;

const MODEL_PATHS = {
  "imagen-4-fast": "google/imagen-4-fast",
  "imagen-4": "google/imagen-4",
  "imagen-4-ultra": "google/imagen-4-ultra",
};

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      model = "imagen-4",
      prompt,
      aspect_ratio,
      output_format,
      safety_filter_level,
    } = inputs;

    return await replicate.createTask(
      `models/${MODEL_PATHS[model]}/predictions`,
      {
        prompt,
        aspect_ratio,
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
