import { next } from "../../../../utils/node.js";
import { Fal } from "../../utils.js";

const PRICING = {
  t2v: {
    "720p": { base: 0.3, second: 0 },
    "1080p": { base: 0.2, second: 0.1 },
  },
  i2v: {
    "720p": { base: 0.1, second: 0.05 },
    "1080p": { base: 0.3, second: 0.1 },
  },
  v2v: {
    "720p": { base: 0.075, second: 0.1125 },
    "1080p": { base: 0.375, second: 0.1125 },
  },
};

export function costs({ env, inputs }) {
  if (Fal.userScope(env)) {
    return 0;
  }

  const { image, video, resolution = "720p", duration = "4" } = inputs;

  const mode = (() => {
    if (video) {
      return "v2v";
    } else if (image) {
      return "i2v";
    }
    return "t2v";
  })();

  const { base, second } = PRICING[mode][resolution];
  const cost = base + +duration * second;
  return Math.round(cost * 1000) / 1000;
}

const MODELS = {
  t2v: "fal-ai/vidu/q2/text-to-video",
  i2v: "fal-ai/vidu/q2/image-to-video/pro",
  v2v: "fal-ai/vidu/q2/video-extension/pro",
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
      video,
      resolution,
      duration,
      aspect_ratio,
      movement_amplitude,
      seed,
    } = inputs;

    const endpoint = (() => {
      if (video) {
        return MODELS.v2v;
      }
      if (image) {
        return MODELS.i2v;
      }
      return MODELS.t2v;
    })();

    return await fal.createTask(endpoint, {
      input: {
        prompt,
        ...(duration ? { duration: +duration } : {}),
        image_url: image,
        video_url: video,
        resolution,
        movement_amplitude,
        aspect_ratio,
        seed,
        // Some magic?
        bgm: false,
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
