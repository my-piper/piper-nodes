import { next } from "../../../../utils/node.js";
import { Fal } from "../../utils.js";

const PRICING = {
  "2_3": { 6: 0.28, 10: 0.56 },
  "2_3_fast": { 6: 0.19, 10: 0.32 },
  "2_3_pro": 0.49,
  "2_3_pro_fast": 0.33,
};

export function costs({ env, inputs }) {
  if (Fal.userScope(env)) {
    return 0;
  }

  const { model = "2_3", duration = "6" } = inputs;
  const pricing = PRICING[model];
  return pricing[duration] || pricing;
}

const MODELS = {
  "2_3": {
    t2v: "fal-ai/minimax/hailuo-2.3/standard/text-to-video",
    i2v: "fal-ai/minimax/hailuo-2.3/standard/image-to-video",
  },
  "2_3_fast": {
    t2v: "fal-ai/minimax/hailuo-2.3-fast/standard/text-to-video",
    i2v: "fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video",
  },
  "2_3_pro": {
    t2v: "fal-ai/minimax/hailuo-2.3/pro/text-to-video",
    i2v: "fal-ai/minimax/hailuo-2.3/pro/image-to-video",
  },
  "2_3_pro_fast": {
    t2v: "fal-ai/minimax/hailuo-2.3/pro/text-to-video",
    i2v: "fal-ai/minimax/hailuo-2.3/pro/image-to-video",
  },
};

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

export async function run({ env, inputs, state }) {
  const fal = new Fal(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { model = "2_3", prompt, image, duration, prompt_optimizer } = inputs;

    const endpoint = image ? MODELS[model].i2v : MODELS[model].t2v;

    return await fal.createTask(endpoint, {
      input: {
        prompt,
        image_url: image,
        ...(duration ? { duration: +duration } : {}),
        prompt_optimizer,
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
