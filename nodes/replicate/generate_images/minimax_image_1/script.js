import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { number_of_images = 1 } = inputs;
  return 0.01 * number_of_images;
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 50;

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const {
    prompt,
    aspect_ratio,
    number_of_images,
    prompt_optimizer,
    character,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      aspect_ratio,
      number_of_images,
      prompt_optimizer,
      subject_reference: character,
    };

    const task = await predict(
      { apiToken: REPLICATE_TOKEN },
      "models/minimax/image-01/predictions",
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
      outputs: { images: output },
      costs: costs({ env, inputs }),
    });
  }
}
