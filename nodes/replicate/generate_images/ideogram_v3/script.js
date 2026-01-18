export async function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { model = "turbo" } = inputs;
  switch (model) {
    case "balanced":
      return 0.06;
    case "quality":
      return 0.09;
    case "turbo":
    default:
      return 0.03;
  }
}

const CHECK_INTERVAL = 1000;
const MAX_RETRIES = 60;

const MODEL_PATHS = {
  turbo: "ideogram-ai/ideogram-v3-turbo",
  balanced: "ideogram-ai/ideogram-v3-balanced",
  quality: "ideogram-ai/ideogram-v3-quality",
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

export async function run({ env, inputs, state }) {
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
    model = "turbo",
    prompt,
    aspect_ratio,
    resolution,
    style_type,
    style_preset,
    seed,
    style_reference_images,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      aspect_ratio,
      resolution,
      style_type,
      style_preset,
      seed,
      style_reference_images,
    };

    console.log(JSON.stringify(payload, null, 2));

    try {
      const {
        data: { id: task },
      } = await httpRequest({
        method: "post",
        url: `https://api.replicate.com/v1/models/${MODEL_PATHS[model]}/predictions`,
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
    } catch (e) {
      catchError(e);
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
          const { data: image } = await download(output);
          return next({
            outputs: { image },
            costs: await costs({ env, inputs }),
          });
        }

        default:
          throwError.fatal(`Unknown status: ${status}`);
      }
    } catch (e) {
      catchError(e);
    }
  }
}

