import { fal } from "npm:@fal-ai/client@1.2.0";
import { next, repeat, throwError } from "../../../../utils/node.js";

const PRICE_PER_SECOND = {
  "2_1": { audio_on: 0.05, audio_off: 0.05 },
  "2_5": { audio_on: 0.07, audio_off: 0.07 },
  "2_6": { audio_on: 0.14, audio_off: 0.07 },
};

export function costs({ env, inputs }) {
  if (env.scope.FAL_KEY === "user") {
    return 0;
  }

  const { model = "2_6", duration = "5", generate_audio = false } = inputs;

  const prices = PRICE_PER_SECOND[model];
  const cost = prices[generate_audio ? "audio_on" : "audio_off"] * +duration;
  return cost;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 120;

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

export async function run({ env, inputs, state }) {
  const { FAL_KEY } = env.variables;
  if (!FAL_KEY) {
    throwError.fatal("Please, set your API key for Fal AI");
  }

  fal.config({ credentials: FAL_KEY });

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

    const payload = {
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
    };

    console.log("Sending request to", endpoint);
    console.log(JSON.stringify(payload, null, 2));

    const { request_id: task } = await fal.queue.submit(endpoint, payload);

    return repeat({
      state: { task, endpoint, attempt: 0 },
      delay: CHECK_INTERVAL,
    });
  }

  const { task, endpoint, attempt = 0 } = state;

  const { status } = await fal.queue.status(endpoint, {
    requestId: task,
    logs: true,
  });

  if (status !== "COMPLETED") {
    if (attempt >= MAX_ATTEMPTS) {
      throwError.timeout("Generation timeout exceeded");
    }

    return repeat({
      state: { task, endpoint, attempt: attempt + 1 },
      progress: {
        total: MAX_ATTEMPTS,
        processed: attempt,
      },
      delay: CHECK_INTERVAL,
    });
  }

  const {
    data: {
      video: { url: video },
    },
  } = await fal.queue.result(endpoint, { requestId: task });

  return next({
    outputs: { video },
    costs: costs({ env, inputs }),
  });
}
