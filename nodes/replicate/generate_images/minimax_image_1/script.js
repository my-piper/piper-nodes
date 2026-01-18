export async function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { number_of_images = 1 } = inputs;
  return 0.01 * number_of_images;
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 50;

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
    prompt,
    aspect_ratio,
    number_of_images,
    prompt_optimizer,
    character,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      aspect_ratio,
      number_of_images,
      prompt_optimizer,
      subject_reference: character,
    };

    console.log(JSON.stringify(payload, null, 2));

    try {
      const {
        data: { id: task },
      } = await httpRequest({
        method: "post",
        url: "https://api.replicate.com/v1/models/minimax/image-01/predictions",
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

