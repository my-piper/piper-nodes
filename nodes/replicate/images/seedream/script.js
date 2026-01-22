import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { model = "seedream_4" } = inputs;
  switch (model) {
    case "seedream_4_5":
      return 0.04;
    case "seedream_4":
    default:
      return 0.03;
  }
}

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 90;
const MODELS = {
  seedream_4: "bytedance/seedream-4",
  seedream_4_5: "bytedance/seedream-4.5",
};

export async function run({ inputs, state, env }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      model = "seedream_4",
      prompt,
      images,
      image_size,
      aspect_ratio,
      width,
      height,
      sequential_image_generation,
      max_images,
      enhance_prompt,
      seed,
    } = inputs;

    return await replicate.createTask(`models/${MODELS[model]}/predictions`, {
      prompt,
      width,
      height,
      size: image_size,
      aspect_ratio,
      sequential_image_generation,
      image_input: images,
      enhance_prompt,
      seed,
      max_images,
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
