import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  return { costs: 0.04, details: "en=Price is fixed;ru=Цена фиксированна" };
}

const CHECK_INTERVAL = 1000;
const MAX_RETRIES = 20;

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const { prompt, style, aspect_ratio, image_size } = inputs;

  if (!state) {
    const payload = {
      prompt,
      size: image_size,
      style,
      aspect_ratio,
    };

    const task = await predict(
      { apiToken: REPLICATE_TOKEN },
      "models/recraft-ai/recraft-v3/predictions",
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
