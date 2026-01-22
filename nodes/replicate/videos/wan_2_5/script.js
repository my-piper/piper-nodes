import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

const COST_PER_SECOND = {
  standard: {
    "480p": 0.05,
    "720p": 0.1,
    "1080p": 0.15,
  },
  fast: {
    "480p": 0.068,
    "720p": 0.068,
    "1080p": 0.102,
  },
};

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { mode = "standard", duration = "5", resolution = "720p" } = inputs;
  return COST_PER_SECOND[mode][resolution] * +duration;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

const MODELS = {
  standard: {
    t2v: "wan-video/wan-2.5-t2v",
    i2v: "wan-video/wan-2.5-i2v",
  },
  fast: {
    t2v: "wan-video/wan-2.5-t2v-fast",
    i2v: "wan-video/wan-2.5-i2v-fast",
  },
};

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      mode = "standard",
      prompt,
      image,
      duration,
      resolution,
      negative_prompt,
      audio,
      enable_prompt_expansion,
      seed,
    } = inputs;

    const endpoint = image ? MODELS[mode].i2v : MODELS[mode].t2v;

    return await replicate.createTask(`models/${endpoint}/predictions`, {
      prompt,
      image,
      ...(duration ? { duration: +duration } : {}),
      resolution,
      negative_prompt,
      audio,
      enable_prompt_expansion,
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
