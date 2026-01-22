import { next } from "../../../../utils/node.js";
import { Fal } from "../../utils.js";

const PRICING_BASE = {
  "360p": 0.15,
  "540p": 0.15,
  "720p": 0.2,
  "1080p": 0.4,
};

const AUDIO_COST = 0.05;
const MULTI_CLIP_COST = 0.1;
const MULTI_CLIP_AUDIO_COST = 0.15;

const DURATION_MULTIPLIERS = {
  5: 1,
  8: 2,
  10: 2.2,
};

export function costs({ env, inputs }) {
  if (Fal.userScope(env)) {
    return 0;
  }

  const {
    resolution = "720p",
    generate_multi_clip_switch = false,
    generate_audio_switch = false,
    duration = "5",
  } = inputs;

  let cost = PRICING_BASE[resolution];
  if (generate_multi_clip_switch && generate_audio_switch) {
    cost += MULTI_CLIP_AUDIO_COST;
  } else if (generate_multi_clip_switch) {
    cost += MULTI_CLIP_COST;
  } else if (generate_audio_switch) {
    cost += AUDIO_COST;
  }

  cost *= DURATION_MULTIPLIERS[+duration];
  return Math.round(cost * 100) / 100;
}

const MODELS = {
  t2v: "fal-ai/pixverse/v5.5/text-to-video",
  i2v: "fal-ai/pixverse/v5.5/image-to-video",
};

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

export async function run({ env, inputs, state }) {
  const fal = new Fal(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      prompt,
      image,
      aspect_ratio,
      resolution,
      duration,
      style,
      thinking_type,
      generate_multi_clip_switch,
      generate_audio_switch,
      negative_prompt,
      seed,
    } = inputs;

    const endpoint = image ? MODELS.i2v : MODELS.t2v;

    return await fal.createTask(endpoint, {
      input: {
        prompt,
        aspect_ratio,
        ...(duration ? { duration: +duration } : {}),
        resolution,
        image_url: image,
        thinking_type,
        generate_multi_clip_switch,
        generate_audio_switch,
        negative_prompt,
        style,
        seed,
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
