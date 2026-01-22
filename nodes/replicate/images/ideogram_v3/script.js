import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { model = "turbo" } = inputs;
  switch (model) {
    case "balanced":
      return 0.06;
    case "quality":
      return 0.09;
    case "turbo":
    default:
      return 0.03;
  }
}

const CHECK_INTERVAL = 1000;
const MAX_RETRIES = 60;

const MODELS = {
  turbo: "ideogram-ai/ideogram-v3-turbo",
  balanced: "ideogram-ai/ideogram-v3-balanced",
  quality: "ideogram-ai/ideogram-v3-quality",
};

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const {
    model = "turbo",
    prompt,
    aspect_ratio,
    resolution,
    style_type,
    style_preset,
    seed,
    style_reference_images,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      aspect_ratio,
      resolution,
      style_type,
      style_preset,
      seed,
      style_reference_images,
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
      outputs: { image: output },
      costs: costs({ env, inputs }),
    });
  }
}
