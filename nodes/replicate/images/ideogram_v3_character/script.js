import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
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

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 50;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

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

    return await replicate.createTask(
      "models/ideogram-ai/ideogram-character/predictions",
      {
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
      }
    );
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
