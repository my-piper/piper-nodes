import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { model = "hunyuan-2.1" } = inputs;
  switch (model) {
    case "hunyuan-3":
      return 0.08;
    case "hunyuan-2.1":
    default:
      return 0.02;
  }
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 40;

const MODEL_PATHS = {
  "hunyuan-2.1": "tencent/hunyuan-image-2.1",
  "hunyuan-3": "tencent/hunyuan-image-3",
};

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      model = "hunyuan-2.1",
      prompt,
      aspect_ratio,
      seed,
      go_fast,
      output_format,
      output_quality,
      disable_safety_checker,
    } = inputs;

    return await replicate.createTask(
      `models/${MODEL_PATHS[model]}/predictions`,
      {
        prompt,
        aspect_ratio,
        seed,
        go_fast,
        output_format,
        output_quality,
        disable_safety_checker,
      }
    );
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output } = results;
  const [image] = output;

  return next({
    outputs: { image },
    costs: costs({ env, inputs }),
  });
}
