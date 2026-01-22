import { next } from "../../../../utils/node.js";
import { Fal } from "../../utils.js";

const PRICE_PER_SECOND = {
  "2_1": { audio_on: 0.05, audio_off: 0.05 },
  "2_5": { audio_on: 0.07, audio_off: 0.07 },
  "2_6": { audio_on: 0.14, audio_off: 0.07 },
};

export function costs({ env, inputs }) {
  if (Fal.userScope(env)) {
    return 0;
  }

  const { model = "2_6", duration = "5", generate_audio = false } = inputs;

  const prices = PRICE_PER_SECOND[model];
  const cost = prices[generate_audio ? "audio_on" : "audio_off"] * +duration;
  return cost;
}

const MODELS = {
  "2_1": {
    t2v: "fal-ai/kling-video/v2.1/standard/text-to-video",
    i2v: "fal-ai/kling-video/v2.1/standard/image-to-video",
  },
  "2_5": {
    t2v: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
    i2v: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
  },
  "2_6": {
    t2v: "fal-ai/kling-video/v2.6/pro/text-to-video",
    i2v: "fal-ai/kling-video/v2.6/pro/image-to-video",
  },
};

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 120;

export async function run({ env, inputs, state }) {
  const fal = new Fal(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      model = "2_6",
      prompt,
      duration,
      aspect_ratio,
      image,
      tail_image,
      negative_prompt,
      cfg_scale,
      generate_audio,
    } = inputs;

    const endpoint = image ? MODELS[model].i2v : MODELS[model].t2v;

    return await fal.createTask(endpoint, {
      input: {
        prompt,
        image_url: image,
        ...(duration ? { duration: +duration } : {}),
        aspect_ratio,
        tail_image_url: tail_image,
        negative_prompt,
        cfg_scale,
        generate_audio,
      },
    });
  }

  const results = await fal.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const {
    video: { url: video },
  } = results;

  return next({
    outputs: { video },
    costs: costs({ env, inputs }),
  });
}
