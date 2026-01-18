export async function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { model = "seedream_4" } = inputs;
  switch (model) {
    case "seedream_4_5":
      return 0.04;
    case "seedream_4":
    default:
      return 0.03;
  }
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 90;
const ENDPOINTS = {
  seedream_4: "bytedance/seedream-4",
  seedream_4_5: "bytedance/seedream-4.5",
};

function catchError(error) {
  const { throwError } = require("@piper/node");

  const errorData = error.response?.data;
  const message =
    errorData?.detail || errorData?.error || error.message || error;
  if (message?.includes("E005") || message?.includes("sensitive")) {
    throwError.fatal(
      "Content flagged as sensitive. Please try different prompt.",
    );
  }

  throwError.fatal(message);
}

export async function run({ inputs, state, env }) {
  const {
    repeat,
    next,
    throwError,
    httpRequest,
    download,
  } = require("@piper/node");

  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const {
    model = "seedream_4",
    prompt,
    images,
    image_size,
    aspect_ratio,
    width,
    height,
    sequential_image_generation,
    max_images,
    enhance_prompt,
    seed,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      width,
      height,
      size: image_size,
      aspect_ratio,
      sequential_image_generation,
      image_input: images,
      enhance_prompt,
      seed,
      max_images,
    };

    console.log(JSON.stringify(payload, null, 2));

    try {
      const {
        data: { id: task },
      } = await httpRequest({
        method: "post",
        url: `https://api.replicate.com/v1/models/${ENDPOINTS[model]}/predictions`,
        data: {
          input: payload,
        },
        headers: {
          Authorization: `Bearer ${REPLICATE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      return repeat({
        state: { task },
        delay: CHECK_INTERVAL,
      });
    } catch (err) {
      catchError(err);
    }
  } else {
    const { task, retries = 0 } = state;

    try {
      const { data } = await httpRequest({
        method: "get",
        url: `https://api.replicate.com/v1/predictions/${task}`,
        headers: {
          Authorization: `Bearer ${REPLICATE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      const { status, error, output } = data;

      switch (status) {
        case "starting":
        case "processing":
          if (retries >= MAX_RETRIES) {
            throwError.fatal("Generation timeout exceeded");
          }
          return repeat({
            state: { task, retries: retries + 1 },
            progress: {
              total: MAX_RETRIES,
              processed: retries,
            },
            delay: CHECK_INTERVAL,
          });

        case "failed":
        case "canceled":
          catchError(error);
        case "succeeded": {
          const images = (
            await Promise.all(output.map((url) => download(url)))
          ).map(({ data }) => data);
          return next({
            outputs: { images },
            costs: await costs({ env, inputs }),
          });
        }

        default:
          throwError.fatal(`Unknown status: ${status}`);
      }
    } catch (err) {
      catchError(err);
    }
  }
}

