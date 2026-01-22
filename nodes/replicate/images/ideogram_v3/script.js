import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { model = "turbo" } = inputs;
  switch (model) {
    case "balanced":
      return 0.06;
    case "quality":
      return 0.09;
    case "turbo":
    default:
      return 0.03;
  }
}

const CHECK_INTERVAL = 1_000;
const MAX_ATTEMPTS = 60;

const MODEL_PATHS = {
  turbo: "ideogram-ai/ideogram-v3-turbo",
  balanced: "ideogram-ai/ideogram-v3-balanced",
  quality: "ideogram-ai/ideogram-v3-quality",
};

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      model = "turbo",
      prompt,
      aspect_ratio,
      resolution,
      style_type,
      style_preset,
      seed,
      style_reference_images,
    } = inputs;

    return await replicate.createTask(
      `models/${MODEL_PATHS[model]}/predictions`,
      {
        prompt,
        aspect_ratio,
        resolution,
        style_type,
        style_preset,
        seed,
        style_reference_images,
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
