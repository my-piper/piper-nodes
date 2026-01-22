import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env }) {
  if (Replicate.userScope(env)) {
    return 0;
  }
  return 0.03;
}

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 90;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

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
      model = "qwen/qwen-image-edit-plus-lora";
      payload = {
        ...payload,
        image: images,
      };
    } else {
      model = "qwen/qwen-image";
    }

    return await replicate.createTask(`models/${model}/predictions`, payload);
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output } = results;
  const [image] = output;

  return next({
    outputs: { image },
    costs: costs({ env }),
  });
}
