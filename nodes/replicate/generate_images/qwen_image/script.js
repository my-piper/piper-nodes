import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  return 0.03;
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 90;

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
      image_size,
      negative_prompt,
      num_inference_steps,
      guidance,
      enhance_prompt,
      seed,
      output_format,
      output_quality,
      go_fast,
      disable_safety_checker,
    } = inputs;

    let payload = {
      prompt,
      enhance_prompt,
      negative_prompt,
      aspect_ratio,
      image_size,
      guidance,
      num_inference_steps,
      output_format,
      output_quality,
      go_fast,
      disable_safety_checker,
      seed,
    };

    let model;
    if (images?.length > 0) {
      // image to image
      model = "qwen/qwen-image-edit-plus-lora";
      payload = {
        ...payload,
        image: images,
      };
    } else {
      // text to image
      model = "qwen/qwen-image";
    }

    const task = await predict(
      { apiToken: REPLICATE_TOKEN },
      `models/${model}/predictions`,
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

    const [image] = output;

    return next({
      outputs: { image },
      costs: costs({ env }),
    });
  }
}
