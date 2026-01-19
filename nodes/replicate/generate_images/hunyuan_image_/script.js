import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

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

const CHECK_INTERVAL = 3000;
const MAX_RETRIES = 40;
const MODELS = {
  "hunyuan-2.1": "tencent/hunyuan-image-2.1",
  "hunyuan-3": "tencent/hunyuan-image-3",
};

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

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

  if (!state) {
    const payload = {
      prompt,
      aspect_ratio,
      seed,
      go_fast,
      output_format,
      output_quality,
      disable_safety_checker,
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

    const [image] = output;
    return next({
      outputs: { image },
      costs: costs({ env, inputs }),
    });
  }
}
