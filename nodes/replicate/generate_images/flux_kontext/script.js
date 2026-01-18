const PRICES = {
  fast: 0.01,
  dev: 0.032,
  pro: 0.04,
  max: 0.08,
};

export async function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { model = "fast" } = inputs;
  return PRICES[model];
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 90;
const ENDPOINTS = {
  fast: "prunaai/flux-kontext-fast",
  dev: "black-forest-labs/flux-kontext-dev-lora",
  pro: "black-forest-labs/flux-kontext-pro",
  max: "black-forest-labs/flux-kontext-max",
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

  if (!state) {
    const {
      model = "fast",
      prompt,
      image,
      aspect_ratio,
      seed,
      safety_tolerance,
      prompt_upsampling,
      output_format,
      output_quality,
    } = inputs;

    let payload = {
      prompt,
      img_cond_path: image,
      aspect_ratio,
      seed,
      safety_tolerance,
      prompt_upsampling,
      output_format,
      output_quality,
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
          const { data: image } = await download(output);
          return next({
            outputs: { image },
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

