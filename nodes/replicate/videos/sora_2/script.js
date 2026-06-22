import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

const COSTS = {
  "sora-2": { 4: 0.07, 8: 0.14, 12: 0.21 },
  "sora-2-pro": { 4: 0.12, 8: 0.24, 12: 0.36 }, // примерные значения, скорректируйте при необходимости
};

const SUPPORTED = {
  "sora-2": {
    seconds: [4, 8, 12],
    aspect_ratio: ["portrait", "landscape"],
    resolution: ["standard"],
  },
  "sora-2-pro": {
    seconds: [4, 8, 12],
    aspect_ratio: ["portrait", "landscape"],
    resolution: ["standard", "high"],
  },
};

const ENDPOINTS = {
  "sora-2": "openai/sora-2",
  "sora-2-pro": "openai/sora-2-pro",
};

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 120;

function autoCorrectParams(model, params) {
  const supported = SUPPORTED[model];
  const corrected = { ...params };
  // seconds
  if (!supported.seconds.includes(corrected.seconds)) {
    corrected.seconds = supported.seconds[0];
  }
  // aspect_ratio
  if (!supported.aspect_ratio.includes(corrected.aspect_ratio)) {
    corrected.aspect_ratio = supported.aspect_ratio[0];
  }
  // resolution
  if (!supported.resolution.includes(corrected.resolution)) {
    corrected.resolution = supported.resolution[0];
  }
  return corrected;
}

export function costs({ env, inputs }) {
  if (Replicate.userScope(env)) {
    return 0;
  }
  const model = inputs.model || "sora-2";
  const seconds = inputs.seconds || 4;
  return COSTS[model]?.[seconds] || 0.07;
}

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    let {
      model = "sora-2",
      prompt,
      seconds = 4,
      aspect_ratio = "portrait",
      input_reference,
      openai_api_key,
      resolution = "standard",
    } = inputs;

    // Автокоррекция параметров
    ({ seconds, aspect_ratio, resolution } = autoCorrectParams(model, {
      seconds,
      aspect_ratio,
      resolution,
    }));

    const input = {
      prompt,
      seconds,
      aspect_ratio,
    };
    if (model === "sora-2-pro") {
      input.resolution = resolution;
    }
    if (input_reference) {
      input.input_reference = input_reference;
    }
    if (openai_api_key) {
      input.openai_api_key = openai_api_key;
    }

    return await replicate.run(ENDPOINTS[model], { input });
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { output: video } = results;

  return next({
    outputs: { video },
  });
}
