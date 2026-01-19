import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

const PRICES = {
  fast: 0.01,
  dev: 0.032,
  pro: 0.04,
  max: 0.08,
};

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { model = "fast" } = inputs;
  return PRICES[model];
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 90;
const MODELS = {
  fast: "prunaai/flux-kontext-fast",
  dev: "black-forest-labs/flux-kontext-dev-lora",
  pro: "black-forest-labs/flux-kontext-pro",
  max: "black-forest-labs/flux-kontext-max",
};

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

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

    const payload = {
      prompt,
      img_cond_path: image,
      aspect_ratio,
      seed,
      safety_tolerance,
      prompt_upsampling,
      output_format,
      output_quality,
    };

    const task = await predict(
      { apiToken: REPLICATE_TOKEN },
      `models/${MODELS[model]}/predictions`,
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
