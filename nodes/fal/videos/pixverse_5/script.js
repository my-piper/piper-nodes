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

export async function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
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

const CHECK_INTERVAL = 3000;
const MAX_RETRIES = 100;

export async function run({ env, inputs, state }) {
  const { repeat, next, throwError, download } = require("@piper/node");

  const { FAL_KEY } = env.variables;
  if (!FAL_KEY) {
    throwError.fatal("Please, set your API key for Fal AI");
  }

  const { fal } = require("@fal-ai/client");
  fal.config({ credentials: FAL_KEY });

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

    const payload = {
      input: {
        prompt,
        aspect_ratio,
        ...(!!duration ? { duration: +duration } : {}),
        resolution,
        duration,
        image_url: image,
        thinking_type,
        generate_multi_clip_switch,
        generate_audio_switch,
        negative_prompt,
        style,
        seed,
      },
    };

    console.log(JSON.stringify(payload, null, 2));

    const endpoint = !!image
      ? "fal-ai/pixverse/v5.5/image-to-video"
      : "fal-ai/pixverse/v5.5/text-to-video";

    try {
      const { request_id: task } = await fal.queue.submit(endpoint, payload);

      return repeat({
        state: { task, endpoint },
        delay: CHECK_INTERVAL,
      });
    } catch (e) {
      const message = e.message || String(e);
      throwError.fatal(`Failed to submit request: ${message}`);
    }
  }
  const { task, endpoint, retries = 0 } = state;

  try {
    const { status } = await fal.queue.status(endpoint, {
      requestId: task,
      logs: true,
    });

    switch (status) {
      case "COMPLETED":
        break;
      case "IN_PROGRESS":
      case "IN_QUEUE":
      default:
        if (retries >= MAX_RETRIES) {
          throwError.fatal("Generation timeout exceeded");
        }
        return repeat({
          state: { task, endpoint, retries: retries + 1 },
          progress: {
            total: MAX_RETRIES,
            processed: retries,
          },
          delay: CHECK_INTERVAL,
        });
    }

    const {
      data: {
        video: { url },
      },
    } = await fal.queue.result(endpoint, { requestId: task });
    const { data: video } = await download(url);
    return next({
      outputs: { video },
      costs: await costs({ env, inputs }),
    });
  } catch (e) {
    const message = e.message || String(e);
    throwError.fatal(`Failed to get result: ${message}`);
  }
}
