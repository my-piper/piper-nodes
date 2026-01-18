export async function costs({ env }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  return 0.03;
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 90;

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
      prompt,
      images,
      aspect_ratio,
      image_size,
      negative_prompt,
      num_inference_steps,
      guidance,
      enhance_prompt,
      seed,
      output_format,
      output_quality,
      go_fast,
      disable_safety_checker,
    } = inputs;

    let payload = {
      prompt,
      enhance_prompt,
      negative_prompt,
      aspect_ratio,
      image_size,
      guidance,
      num_inference_steps,
      output_format,
      output_quality,
      go_fast,
      disable_safety_checker,
      seed,
    };

    let model;
    if (images?.length > 0) {
      // image to image
      model = "qwen/qwen-image-edit-plus-lora";
      payload = {
        ...payload,
        image: images,
      };
    } else {
      // text to image
      model = "qwen/qwen-image";
    }

    console.log(JSON.stringify(payload, null, 2));

    try {
      const {
        data: { id: task },
      } = await httpRequest({
        method: "post",
        url: `https://api.replicate.com/v1/models/${model}/predictions`,
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
          let [url] = output;
          const { data: image } = await download(url);
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

