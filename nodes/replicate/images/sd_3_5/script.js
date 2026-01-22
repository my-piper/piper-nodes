import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { model = "medium" } = inputs;
  switch (model) {
    case "large":
      return 0.065;
    case "medium":
    default:
      return 0.035;
  }
}

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 100;

const MODEL_PATHS = {
  medium: "stability-ai/stable-diffusion-3.5-medium",
  large: "stability-ai/stable-diffusion-3.5-large",
};

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      model = "medium",
      prompt,
      aspect_ratio,
      cfg,
      negative_prompt,
      seed,
      image,
      prompt_strength,
      output_format,
    } = inputs;

    return await replicate.createTask(
      `models/${MODEL_PATHS[model]}/predictions`,
      {
        prompt,
        aspect_ratio,
        cfg,
        negative_prompt,
        seed,
        image,
        prompt_strength,
        output_format,
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
