import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { model = "standard" } = inputs;
  switch (model) {
    case "turbo":
      return 0.05;
    case "standard":
      return 0.08;
    default:
      return 0.08;
  }
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 50;

const MODELS = {
  standard: "runwayml/gen4-image",
  turbo: "runwayml/gen4-image-turbo",
};

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const {
    model = "standard",
    prompt,
    images,
    tags = "@cat",
    aspect_ratio,
    resolution,
    seed,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      reference_images: images,
      ...(!!tags?.length > 0
        ? { reference_tags: [...tags.matchAll(/@(\w+)/g)].map((m) => m[1]) }
        : {}),
      aspect_ratio,
      resolution,
      seed,
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
