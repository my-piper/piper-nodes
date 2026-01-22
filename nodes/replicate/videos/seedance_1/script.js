import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

const COST_PER_SECOND = {
  lite: {
    "480p": 0.018,
    "720p": 0.036,
    "1080p": 0.072,
  },
  pro: {
    "480p": 0.03,
    "720p": 0.06,
    "1080p": 0.15,
  },
  pro_fast: {
    "480p": 0.015,
    "720p": 0.025,
    "1080p": 0.06,
  },
};

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
    return 0;
  }

  const { mode = "pro_fast", duration = 5, resolution = "1080p" } = inputs;
  const cost = COST_PER_SECOND[mode]?.[resolution];
  return cost * duration;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

const MODELS = {
  lite: "bytedance/seedance-1-lite",
  pro: "bytedance/seedance-1-pro",
  pro_fast: "bytedance/seedance-1-pro-fast",
};

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      mode = "pro_fast",
      prompt,
      image,
      last_frame_image,
      duration,
      resolution,
      aspect_ratio,
      camera_fixed,
      seed,
    } = inputs;

    return await replicate.createTask(`models/${MODELS[mode]}/predictions`, {
      prompt,
      image,
      duration,
      resolution,
      aspect_ratio,
      camera_fixed,
      // TODO: @ivan why 24 fps?
      fps: 24,
      last_frame_image,
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
