import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

const COST_PER_SECOND = {
  4: 0.07,
  8: 0.14,
  12: 0.21,
};

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
    return 0;
  }

  const { seconds = 4 } = inputs;
  return COST_PER_SECOND[seconds] || 0.07;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 120;

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      prompt,
      seconds = 4,
      aspect_ratio = "portrait",
      input_reference,
      openai_api_key,
    } = inputs;

    const input = {
      prompt,
      seconds,
      aspect_ratio,
    };

    if (input_reference) {
      input.input_reference = input_reference;
    }

    if (openai_api_key) {
      input.openai_api_key = openai_api_key;
    }

    return await replicate.createTask(
      "models/openai/sora-2/predictions",
      input
    );
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output: video } = results;

  return next({
    outputs: { video },
  });
}
