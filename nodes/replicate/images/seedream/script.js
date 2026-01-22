import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { model = "seedream_4" } = inputs;
  switch (model) {
    case "seedream_4_5":
      return 0.04;
    case "seedream_4":
    default:
      return 0.03;
  }
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 90;
const MODELS = {
  seedream_4: "bytedance/seedream-4",
  seedream_4_5: "bytedance/seedream-4.5",
};

export async function run({ inputs, state, env }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const {
    model = "seedream_4",
    prompt,
    images,
    image_size,
    aspect_ratio,
    width,
    height,
    sequential_image_generation,
    max_images,
    enhance_prompt,
    seed,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      width,
      height,
      size: image_size,
      aspect_ratio,
      sequential_image_generation,
      image_input: images,
      enhance_prompt,
      seed,
      max_images,
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
      outputs: { images: output },
      costs: costs({ env, inputs }),
    });
  }
}
