import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { resolution = "2K" } = inputs;
  switch (resolution) {
    case "4K":
      return 0.24;
    case "1K":
    case "2K":
    default:
      return 0.14;
  }
}

const CHECK_INTERVAL = 3000;
const MAX_RETRIES = 100;

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  if (!state) {
    const {
      prompt,
      images,
      aspect_ratio,
      resolution,
      output_format,
      safety_filter_level,
    } = inputs;

    const payload = {
      prompt,
      image_input: images,
      aspect_ratio,
      resolution,
      output_format,
      safety_filter_level,
    };

    const task = await predict(
      { apiToken: REPLICATE_TOKEN },
      "models/google/nano-banana-pro/predictions",
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
