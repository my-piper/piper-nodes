import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

const PRICE_PER_1K_CHARS = 0.025;

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
    return 0;
  }
  const { text } = inputs;
  return (text.length / 1000) * PRICE_PER_1K_CHARS;
}

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 60;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      text,
      voice,
      reference_audio,
      temperature,
      top_p,
      top_k,
      repetition_penalty,
      seed,
    } = inputs;

    const payload = {
      text,
      voice,
      temperature,
      top_p,
      top_k,
      repetition_penalty,
      reference_audio,
      seed,
    };

    return await replicate.createTask(
      "models/resemble-ai/chatterbox-turbo/predictions",
      payload
    );
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output: audio } = results;

  return next({
    outputs: { audio },
    costs: costs({ env, inputs }),
  });
}
