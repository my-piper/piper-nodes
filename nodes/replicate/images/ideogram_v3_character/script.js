import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { rendering_speed = "Default" } = inputs;
  switch (rendering_speed) {
    case "Turbo":
      return 0.1;
    case "Quality":
      return 0.2;
    case "Default":
    default:
      return 0.15;
  }
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 50;

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  if (!state) {
    const {
      prompt,
      character_reference_image,
      rendering_speed,
      style_type,
      aspect_ratio,
      resolution,
      magic_prompt_option,
      seed,
      image,
      mask,
    } = inputs;

    const payload = {
      prompt,
      character_reference_image,
      rendering_speed,
      style_type,
      aspect_ratio,
      resolution,
      magic_prompt_option,
      seed,
      image,
      mask,
    };

    const task = await predict(
      { apiToken: REPLICATE_TOKEN },
      "models/ideogram-ai/ideogram-character/predictions",
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
