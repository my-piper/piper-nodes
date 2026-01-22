import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
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

const CHECK_INTERVAL = 1000;
const MAX_RETRIES = 40;

const MODEL_PATHS = {
  "imagen-4-fast": "google/imagen-4-fast",
  "imagen-4": "google/imagen-4",
  "imagen-4-ultra": "google/imagen-4-ultra",
};

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const {
    model = "imagen-4",
    prompt,
    aspect_ratio,
    output_format,
    safety_filter_level,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      aspect_ratio,
      output_format,
      safety_filter_level,
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
