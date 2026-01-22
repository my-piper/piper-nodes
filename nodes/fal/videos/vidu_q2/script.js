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

export async function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { image, video, resolution = "720p", duration = "4" } = inputs;

  let mode = (() => {
    if (!!video) {
      return "v2v";
    } else if (!!image) {
      return "i2v";
    }
    return "t2v";
  })();

  const { base, second } = PRICING[mode][resolution];
  const cost = base + +duration * second;
  return Math.round(cost * 1000) / 1000;
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
      video,
      resolution,
      duration,
      aspect_ratio,
      movement_amplitude,
      seed,
    } = inputs;

    const endpoint = (() => {
      if (!!video) {
        return "fal-ai/vidu/q2/video-extension/pro";
      }
      if (!!image) {
        return "fal-ai/vidu/q2/image-to-video/pro";
      }
      return "fal-ai/vidu/q2/text-to-video";
    })();

    const payload = {
      input: {
        prompt,
        ...(!!duration ? { duration: +duration } : {}),
        image_url: image,
        video_url: video,
        resolution,
        movement_amplitude,
        aspect_ratio,
        seed,
        // Some magic?
        bgm: false,
      },
    };

    console.log(JSON.stringify(payload, null, 2));

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
