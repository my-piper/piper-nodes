import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  return 0.01;
}

const CHECK_INTERVAL = 1000;
const MAX_RETRIES = 30;

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

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

  if (!state) {
    const payload = {
      prompt,
      width,
      height,
      num_inference_steps,
      guidance_scale,
      output_format,
      output_quality,
      seed,
    };

    const task = await predict(
      { apiToken: REPLICATE_TOKEN },
      "models/prunaai/z-image-turbo/versions/7ea16386290ff5977c7812e66e462d7ec3954d8e007a8cd18ded3e7d41f5d7cf/predictions",
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
      costs: costs({ env }),
    });
  }
}
