import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

const COST_PER_SECOND = {
  "3_1": { audio_on: 0.4, audio_off: 0.2 },
  "3_1_fast": { audio_on: 0.15, audio_off: 0.1 },
};

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
    return 0;
  }

  const { model = "3_1_fast", duration = "8", generate_audio = true } = inputs;

  const prices = COST_PER_SECOND[model];
  const cost = prices[generate_audio ? "audio_on" : "audio_off"] * +duration;

  return cost;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 120;

const MODELS = {
  "3_1": "google/veo-3.1",
  "3_1_fast": "google/veo-3.1-fast",
};

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      model = "3_1_fast",
      prompt,
      duration,
      aspect_ratio,
      resolution,
      image,
      last_frame,
      reference_images,
      generate_audio,
      negative_prompt,
      seed,
    } = inputs;

    return await replicate.createTask(`models/${MODELS[model]}/predictions`, {
      prompt,
      ...(duration ? { duration: +duration } : {}),
      aspect_ratio,
      resolution,
      image,
      last_frame,
      reference_images,
      generate_audio,
      negative_prompt,
      seed,
    });
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output: video } = results;

  return next({
    outputs: { video },
    costs: costs({ env, inputs }),
  });
}
