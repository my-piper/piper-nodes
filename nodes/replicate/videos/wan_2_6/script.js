import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

const COST_PER_SECOND = {
  "720p": 0.1,
  "1080p": 0.15,
};

export function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { resolution = "720p", duration = "5" } = inputs;
  return COST_PER_SECOND[resolution] * +duration;
}

const SIZES = {
  "720p": {
    landscape: "1280*720",
    portrait: "720*1280",
  },
  "1080p": {
    landscape: "1920*1080",
    portrait: "1080*1920",
  },
};

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 120;

const MODELS = {
  t2v: "wan-video/wan-2.6-t2v",
  i2v: "wan-video/wan-2.6-i2v",
};

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      prompt,
      image,
      duration,
      negative_prompt,
      resolution,
      orientation,
      audio,
      enable_prompt_expansion,
      multi_shots,
      seed,
    } = inputs;

    const model = image ? MODELS.i2v : MODELS.t2v;

    return await replicate.createTask(`models/${model}/predictions`, {
      prompt,
      image,
      ...(duration ? { duration: +duration } : {}),
      size: SIZES[resolution]?.[orientation],
      negative_prompt,
      audio,
      enable_prompt_expansion,
      multi_shots,
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
