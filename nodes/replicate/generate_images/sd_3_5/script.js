import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

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

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 100;

const MODEL_PATHS = {
  medium: "stability-ai/stable-diffusion-3.5-medium",
  large: "stability-ai/stable-diffusion-3.5-large",
};

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

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

  if (!state) {
    const payload = {
      prompt,
      aspect_ratio,
      cfg,
      negative_prompt,
      seed,
      image,
      prompt_strength,
      output_format,
    };

    const task = await predict(
      { apiToken: REPLICATE_TOKEN },
      `models/${MODEL_PATHS[model]}/predictions`,
      payload
    );
    return repeat({
      state: { task, retries: 0 },
      delay: CHECK_INTERVAL,
    });
  } else {
    const { task, retries = 0 } = state;

    const output = await getOutput({ apiToken: REPLICATE_TOKEN }, task);
    if (!output) {
      if (retries >= MAX_RETRIES) {
        throwError.timeout();
      }
      return repeat({
        state: { task, retries: retries + 1 },
        progress: {
          total: MAX_RETRIES,
          processed: retries,
        },
        delay: CHECK_INTERVAL,
      });
    }

    return next({
      outputs: { image: output },
      costs: costs({ env, inputs }),
    });
  }
}
