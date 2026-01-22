import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  return 0.01;
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 40;

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const { image } = inputs;

  if (!state) {
    const payload = { image };

    const task = await predict(
      { apiToken: REPLICATE_TOKEN },
      "models/recraft-ai/recraft-vectorize/predictions",
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
      outputs: { svg: output },
      costs: costs({ env, inputs }),
    });
  }
}
