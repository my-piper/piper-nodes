import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
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

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 50;

const MODELS = {
  standard: "runwayml/gen4-image",
  turbo: "runwayml/gen4-image-turbo",
};

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      model = "standard",
      prompt,
      images,
      tags = "@cat",
      aspect_ratio,
      resolution,
      seed,
    } = inputs;

    return await replicate.createTask(`models/${MODELS[model]}/predictions`, {
      prompt,
      reference_images: images,
      ...(!!tags?.length > 0
        ? { reference_tags: [...tags.matchAll(/@(\w+)/g)].map((m) => m[1]) }
        : {}),
      aspect_ratio,
      resolution,
      seed,
    });
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output } = results;

  return next({
    outputs: { image: output },
    costs: costs({ env, inputs }),
  });
}
