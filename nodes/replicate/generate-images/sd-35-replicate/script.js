import {
  next,
  repeat,
  throwError,
} from "https://cdn.jsdelivr.net/gh/my-piper/piper-node@v2.0.1/index.js";
import { catchError, getOutput } from "../../utils.js";

export async function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }

  const { model = "medium" } = inputs;
  switch (model) {
    case "large":
      return 0.065;
    case "medium":
    default:
      return 0.035;
  }
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 100;

const MODEL_PATHS = {
  medium: "stability-ai/stable-diffusion-3.5-medium",
  large: "stability-ai/stable-diffusion-3.5-large",
};

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const {
    model = "medium",
    prompt,
    aspect_ratio,
    cfg,
    negative_prompt,
    seed,
    image,
    prompt_strength,
    output_format,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      aspect_ratio,
      cfg,
      negative_prompt,
      seed,
      image,
      prompt_strength,
      output_format,
    };

    console.log(JSON.stringify(payload, null, 2));

    const res = await fetch(
      `https://api.replicate.com/v1/models/${MODEL_PATHS[model]}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${REPLICATE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: payload,
        }),
      }
    );
    await catchError(res);

    const { id: task } = await res.json();
    return repeat({
      state: { task, retries: 0 },
      delay: CHECK_INTERVAL,
    });
  } else {
    const { task, retries = 0 } = state;

    const res = await fetch(
      `https://api.replicate.com/v1/predictions/${task}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${REPLICATE_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    await catchError(res);

    const output = getOutput(await res.json());
    if (!output) {
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
    }

    return next({
      outputs: { image: output },
      costs: await costs({ env, inputs }),
    });
  }
}
