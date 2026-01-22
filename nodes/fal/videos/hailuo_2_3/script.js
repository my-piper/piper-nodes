const PRICING = {
  "2_3": { 6: 0.28, 10: 0.56 },
  "2_3_fast": { 6: 0.19, 10: 0.32 },
  "2_3_pro": 0.49,
  "2_3_pro_fast": 0.33,
};

export async function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { model = "2_3", duration = "6" } = inputs;
  const pricing = PRICING[model];
  return pricing[duration] || pricing;
}

const CHECK_INTERVAL = 3000;
const MAX_RETRIES = 100;

export async function run({ env, inputs, state }) {
  const { repeat, next, throwError, download } = require("@piper/node");

  const FAL_KEY = env.variables.FAL_KEY;
  if (!FAL_KEY) {
    throwError.fatal("Please, set your API key for Fal AI");
  }

  const { fal } = require("@fal-ai/client");
  fal.config({ credentials: FAL_KEY });

  if (!state) {
    const { model = "2_3", prompt, image, duration, prompt_optimizer } = inputs;

    let endpoint = (() => {
      switch (model) {
        case "2_3_fast":
          return !!image
            ? "fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video"
            : "fal-ai/minimax/hailuo-2.3-fast/standard/text-to-video";
        case "2_3_pro":
          return !!image
            ? "fal-ai/minimax/hailuo-2.3/pro/image-to-video"
            : "fal-ai/minimax/hailuo-2.3/pro/text-to-video";
        case "2_3_pro_fast":
          return !!image
            ? "fal-ai/minimax/hailuo-2.3/pro/image-to-video"
            : "fal-ai/minimax/hailuo-2.3/pro/text-to-video";
        case "2_3":
        default:
          return !!image
            ? "fal-ai/minimax/hailuo-2.3/standard/image-to-video"
            : "fal-ai/minimax/hailuo-2.3/standard/text-to-video";
      }
    })();

    const payload = {
      input: {
        prompt,
        image_url: image,
        ...(!!duration ? { duration: +duration } : {}),
        prompt_optimizer,
      },
    };

    console.log(JSON.stringify(payload, null, 2));

    const { request_id: task } = await fal.queue.submit(endpoint, payload);

    return repeat({
      state: { task, endpoint },
      delay: CHECK_INTERVAL,
    });
  }

  const { task, endpoint, retries = 0 } = state;

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
}
